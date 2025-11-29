import random
import queue
import time
from locust import HttpUser, task, between

# 1. Cargamos los 111 alumnos en la cola
usuarios_queue = queue.Queue()
for i in range(1, 201):  
    usuarios_queue.put(f"alumno{i}")

class AlumnoUser(HttpUser):
    # Tiempo de espera entre tareas (simula lectura/pensamiento entre encuestas)
    wait_time = between(2, 5) 
    host = "http://localhost:8000"

    # --- CONFIGURACIÓN DE PROBABILIDAD ---
    PROBABILIDAD_INACTIVO = 0.08  # El 10% de los alumnos no hará nada

    def on_start(self):
        """
        Se ejecuta al nacer el usuario.
        """
        try:
            # Intentamos sacar un alumno de la cola
            self.username = usuarios_queue.get(block=False)
            self.password = "123456"

            # --- SIMULACIÓN DE ALUMNO INACTIVO ---
            if random.random() < self.PROBABILIDAD_INACTIVO:
                print(f"😴 {self.username} decidió no entrar al sistema (Inactivo).")
                self.stop(force=True)
                return

            # Si es activo, procedemos al login
            self.do_login()

        except queue.Empty:
            # Si se acaban los usuarios, detenemos este proceso silenciosamente
            self.stop(force=True)

    def do_login(self):
        try:
            response = self.client.post("/auth/token", data={
                "username": self.username,
                "password": self.password
            })
            
            if response.status_code == 200:
                token = response.json()["access_token"]
                self.client.headers = {"Authorization": f"Bearer {token}"}
                print(f"✅ {self.username} inició sesión.")
            else:
                print(f"❌ Error login {self.username}")
                self.stop()
        except Exception:
            self.stop()

    @task
    def responder_todas_las_encuestas(self):
        # Seguridad: si no tiene username (por fallo en start), salir
        if not hasattr(self, 'username'):
            self.stop()
            return

        # 1. Obtener lista de encuestas
        with self.client.get("/encuestas-abiertas/mis-instancias-activas", catch_response=True) as response:
            if response.status_code != 200:
                self.stop()
                return
            
            data = response.json()
            # Filtramos solo las que NO ha respondido
            pendientes = [e for e in data if not e['ha_respondido']]

            if not pendientes:
                print(f"🏁 {self.username} no tiene nada pendiente. Saliendo.")
                self.stop()
                return

            print(f"📋 {self.username} tiene {len(pendientes)} encuestas pendientes. Empezando...")

            # 2. ITERAR sobre TODAS las encuestas pendientes
            for encuesta in pendientes:
                self.procesar_encuesta(encuesta['instancia_id'])
                # Pequeña pausa realista entre encuesta y encuesta
                time.sleep(random.uniform(1, 2)) 

            print(f"🎉 {self.username} terminó TODAS sus encuestas.")
            
        # 3. Al terminar todo el lote, el usuario se retira
        self.stop() 

    def procesar_encuesta(self, instancia_id):
        """Lógica auxiliar para responder una encuesta individual"""
        
        # A. Obtener detalle (preguntas)
        res_detalles = self.client.get(f"/encuestas-abiertas/instancia/{instancia_id}/detalles")
        if res_detalles.status_code != 200:
            return
        
        plantilla = res_detalles.json()
        respuestas_payload = []

        # B. Generar respuestas aleatorias
        for seccion in plantilla['secciones']:
            for pregunta in seccion['preguntas']:
                resp = {"pregunta_id": pregunta['id']}
                
                if pregunta['tipo'] == "MULTIPLE_CHOICE":
                    opciones = pregunta.get('opciones', [])
                    if opciones:
                        opcion = random.choice(opciones)
                        resp['opcion_id'] = opcion['id']
                        respuestas_payload.append(resp)
                
                elif pregunta['tipo'] == "REDACCION":
                    resp['texto'] = f"Comentario aleatorio de {self.username}"
                    respuestas_payload.append(resp)

        # C. Enviar respuestas
        if respuestas_payload:
            post_res = self.client.post(
                f"/encuestas-abiertas/instancia/{instancia_id}/responder",
                json={"respuestas": respuestas_payload}
            )
            
            if post_res.status_code in [200, 201]:
                # Log opcional (comentado para no saturar consola)
                # print(f"   -> {self.username} envió encuesta {instancia_id}")
                pass
            else:
                print(f"⚠️ Error enviando encuesta {instancia_id}: {post_res.text}")