import random
import queue
import time
from locust import HttpUser, task, between

# --- CONFIGURACIÓN ALUMNOS ---
# Cargamos los alumnos en la cola
# CAMBIO: Empezamos desde el 2 para dejar 'alumno1' libre para la demo manual
alumnos_queue = queue.Queue()
for i in range(2, 801):  
    alumnos_queue.put(f"alumno{i}")

class AlumnoUser(HttpUser):
    # Tiempo de espera entre acciones (simula lectura)
    wait_time = between(2, 4) 
    host = "http://localhost:8000"
    
    # El 8% de los alumnos entra pero no responde nada (realismo)
    PROBABILIDAD_INACTIVO = 0.08

    def on_start(self):
        try:
            self.username = alumnos_queue.get(block=False)
            self.password = "123456"

            if random.random() < self.PROBABILIDAD_INACTIVO:
                print(f"😴 {self.username} decidió no participar.")
                self.stop(force=True)
                return

            self.do_login()
        except queue.Empty:
            self.stop(force=True)

    def reintentar_usuario(self, motivo):
        print(f"\n🚨 ¡FALLÓ {self.username}! Motivo: {motivo}")
        print(f"♻️  Devolviendo a {self.username} a la fila...\n")
        alumnos_queue.put(self.username)
        self.stop()

    def do_login(self):
        try:
            res = self.client.post("/auth/token", data={"username": self.username, "password": self.password})
            if res.status_code == 200:
                self.client.headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
                print(f"🎓 {self.username} inició sesión.")
            else:
                self.reintentar_usuario(f"Login {res.status_code}")
        except Exception as e:
            self.reintentar_usuario(f"Excepción login: {e}")

    @task
    def responder_encuestas(self):
        if not hasattr(self, 'username'): return self.stop()

        try:
            with self.client.get("/encuestas-abiertas/mis-instancias-activas", catch_response=True) as response:
                if response.status_code != 200: return self.reintentar_usuario("Error fetching encuestas")
                
                pendientes = [e for e in response.json() if not e['ha_respondido']]
                
                if not pendientes:
                    print(f"🏁 {self.username} al día. Saliendo.")
                    return self.stop()

                print(f"📋 {self.username} responderá {len(pendientes)} encuestas.")
                for encuesta in pendientes:
                    time.sleep(random.uniform(2, 5)) # Simula tiempo de respuesta
                    self.procesar_encuesta(encuesta['instancia_id'])

                print(f"🎉 {self.username} terminó.")
                self.stop()
        except Exception as e:
            self.reintentar_usuario(f"Error proceso: {e}")

    def procesar_encuesta(self, instancia_id):
        res = self.client.get(f"/encuestas-abiertas/instancia/{instancia_id}/detalles")
        if res.status_code != 200: return
        
        plantilla = res.json()
        payload = []
        for s in plantilla['secciones']:
            for p in s['preguntas']:
                resp = {"pregunta_id": p['id']}
                if p['tipo'] == "MULTIPLE_CHOICE" and p.get('opciones'):
                    resp['opcion_id'] = random.choice(p['opciones'])['id']
                    payload.append(resp)
                elif p['tipo'] == "REDACCION":
                    resp['texto'] = f"Comentario simulado por {self.username}."
                    payload.append(resp)

        if payload:
            self.client.post(f"/encuestas-abiertas/instancia/{instancia_id}/responder", json={"respuestas": payload})