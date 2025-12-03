import random
import queue
import time
import json
from locust import HttpUser, task, between

# --- CONFIGURACIÓN PROFESORES ---
# Profesores del 2 al 14 (Reservamos profesor1 para manual)
profesores_queue = queue.Queue()
for i in range(2, 61):
    profesores_queue.put(f"profesor{i}")

class ProfesorUser(HttpUser):
    wait_time = between(3, 5) 
    host = "http://localhost:8000"

    def on_start(self):
        try:
            self.username = profesores_queue.get(block=False)
            self.password = "123456"
            self.do_login()
        except queue.Empty:
            self.stop(force=True)

    def reintentar_usuario(self, motivo):
        print(f"\n⚠️ FALLÓ {self.username}. Motivo: {motivo}")
        print(f"♻️  Reintentando...\n")
        profesores_queue.put(self.username)
        self.stop()

    def do_login(self):
        try:
            res = self.client.post("/auth/token", data={"username": self.username, "password": self.password})
            if res.status_code == 200:
                self.client.headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
                print(f"👨‍🏫 {self.username} conectado.")
            else:
                self.reintentar_usuario(f"Login {res.status_code}")
        except Exception as e:
            self.reintentar_usuario(f"Excepción login: {e}")

    @task
    def completar_informes(self):
        if not hasattr(self, 'username'): return self.stop()

        try:
            # Busca reportes pendientes en el endpoint de profesor
            with self.client.get("/encuestas-abiertas/mis-instancias-activas-profesor", catch_response=True) as response:
                if response.status_code != 200: 
                    return self.reintentar_usuario("Error fetching reportes")
                
                # Filtramos los que NO están respondidos (aunque el endpoint suele traer solo pendientes)
                pendientes = [r for r in response.json() if not r.get('ha_respondido', False)]

                if not pendientes:
                    print(f"🏁 {self.username} no tiene informes pendientes. Se retira.")
                    return self.stop()

                print(f"📝 {self.username} completará {len(pendientes)} informes...")

                for reporte in pendientes:
                    time.sleep(random.uniform(3, 6)) # Tiempo para redactar
                    self.procesar_reporte(reporte['instancia_id'])

                print(f"✅ {self.username} completó todo.")
                self.stop()

        except Exception as e:
            self.reintentar_usuario(f"Error proceso: {e}")

    def procesar_reporte(self, instancia_id):
        res = self.client.get(f"/encuestas-abiertas/reporte/instancia/{instancia_id}/detalles")
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
                    texto_respuesta = ""
                    
                    # Detección inteligente de preguntas
                    txt_lower = p['texto'].lower()
                    
                    if p['texto'].startswith("4."): # Auxiliares
                        auxiliares_fake = [
                            {"nombre": "Auxiliar 1", "calificacion": "Muy Bueno (MB)", "justificacion": "Correcto desempeño."},
                            {"nombre": "Auxiliar 2", "calificacion": "Excelente (E)", "justificacion": "Gran compromiso."}
                        ]
                        texto_respuesta = json.dumps(auxiliares_fake)
                    
                    elif "cantidad" in txt_lower or "porcentaje" in txt_lower:
                        texto_respuesta = "100" # O un número random
                    
                    else:
                        texto_respuesta = f"Informe automático de {self.username}."

                    resp['texto'] = texto_respuesta
                    payload.append(resp)

        if payload:
            self.client.post(
                f"/reportes-abiertas/instancia/{instancia_id}/responder",
                json={"respuestas": payload}
            )