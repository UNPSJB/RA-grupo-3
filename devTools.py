import os
import sys
import subprocess
import time

# --- CONFIGURACIÓN ---
# Detectamos si estamos en Windows o Linux para el comando de cambio de directorio
IS_WINDOWS = sys.platform.startswith('win')
CHAIN_CMD = "&" if IS_WINDOWS else "&&"
PYTHON_CMD = sys.executable # Usa el python del entorno virtual actual

DB_PATH = os.path.join("backend", "app.db")

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_c(msg, color=Colors.ENDC):
    print(f"{color}{msg}{Colors.ENDC}")

def delete_db():
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print_c(f"🗑️  Base de datos eliminada: {DB_PATH}", Colors.WARNING)
        except Exception as e:
            print_c(f"❌ Error borrando DB: {e}", Colors.FAIL)
    else:
        print_c("⚠️  No se encontró base de datos para borrar.", Colors.BLUE)

def run_seed_command(module_name, description):
    """
    Ejecuta un módulo python dentro de la carpeta 'backend' para resolver
    correctamente los imports 'from src...'
    """
    print_c(f"⏳ Ejecutando: {description}...", Colors.BLUE)
    
    # Comando mágico: Entra a backend Y ejecuta el módulo
    # Ejemplo Linux: cd backend && /path/to/python -m src.seed_data
    cmd = f"cd backend {CHAIN_CMD} {PYTHON_CMD} -m {module_name}"
    
    try:
        result = subprocess.run(cmd, shell=True)
        if result.returncode == 0:
            print_c(f"✅ {description} completado.", Colors.GREEN)
            return True
        else:
            print_c(f"❌ Falló {description}.", Colors.FAIL)
            return False
    except Exception as e:
        print_c(f"❌ Excepción en {description}: {e}", Colors.FAIL)
        return False

def launch_locust():
    print_c("🦗 Lanzando Locust...", Colors.HEADER)
    print_c("👉 Abre en tu navegador: http://localhost:8089", Colors.BOLD)
    try:
        # Locust se ejecuta desde la raíz porque ahí está locustfile.py
        subprocess.run(["locust", "-f", "locustfile.py"])
    except KeyboardInterrupt:
        print_c("\n🛑 Locust detenido.", Colors.WARNING)

def full_reset():
    print_c("\n--- INICIANDO RESET COMPLETO ---", Colors.BOLD)
    delete_db()
    
    # 1. Seeds de Estructura (Usuarios, Materias, etc.)
    if not run_seed_command("src.seed_data", "Seed Data (Estructura)"):
        return
    
    # 2. Seeds de Plantillas (Encuestas base)
    if not run_seed_command("src.seed_plantilla", "Seed Plantillas"):
        return
        
    print_c("\n✨ Todo listo. Iniciando Locust...", Colors.BOLD)
    time.sleep(1)
    launch_locust()

def menu():
    while True:
        print("\n" + "="*30)
        print_c("   HERRAMIENTAS DE DESARROLLO", Colors.HEADER)
        print("="*30)
        print("1. 🔥 Reset Completo (DB + Seeds + Locust)")
        print("2. 🗑️  Solo Borrar DB")
        print("3. 🌱 Solo Correr Seeds")
        print("4. 🦗 Solo Lanza Locust")
        print("0. Salir")
        
        choice = input("\nElige una opción: ")

        if choice == '1':
            full_reset()
        elif choice == '2':
            delete_db()
        elif choice == '3':
            run_seed_command("src.seed_data", "Seed Data")
            run_seed_command("src.seed_plantilla", "Seed Plantillas")
        elif choice == '4':
            launch_locust()
        elif choice == '0':
            print("Chau! 👋")
            break
        else:
            print("Opción no válida.")

if __name__ == "__main__":
    if not os.path.exists("backend"):
        print_c("❌ Error: Ejecuta este script desde la raíz del proyecto (donde ves la carpeta 'backend').", Colors.FAIL)
    else:
        try:
            menu()
        except KeyboardInterrupt:
            print("\nSalida forzada.")