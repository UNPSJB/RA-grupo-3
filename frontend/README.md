git init vite

nombre del projecto:
	frontend

framework:
	React 
variant:
	TypeScript + SWC

entrar a la carpeta frontend y arrancar npm
	cd frontend
	npm install
	npm run dev

se elimino la carpeta assets que se encuentra en src
se elimino App.css e index.css
ahora solo correr la app con npm run dev desde la carpeta frondend.

///	integrando react bootstrap	///

instalar el paquete en el proyecto
	npm install react-bootstrap bootstrap

luego, agregar en main.tsx el siguiente import
	import 'bootstrap/dist/css/bootrstrap.min.css';