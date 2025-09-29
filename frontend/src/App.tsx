
import React from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Tabla } from './components/Tabla.tsx';
import logo from './img/Logo50Color_conletras.png';
import './Styles/Styles.css';


const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__branding">
          <img className="app-header__logo" src={logo} alt="Logo Universidad" />
          <h1 className="app-header__title">Encuestas UNPSJB</h1>
          {/* <CrearPregunta /> */}
        </div>
        <Navbar />
      </header>
      <main className="app-main">
        <Tabla />
      </main>
    </div>
  );
};

export default App;
