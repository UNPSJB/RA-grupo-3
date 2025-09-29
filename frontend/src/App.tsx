import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar.tsx';
import EncuestasPage from './pages/EncuestasPage.tsx';
import EstadisticasPage from './pages/EstadisticasPage.tsx';
import CuentaPage from './pages/CuentaPage.tsx';
import logo from './img/Logo50Color_conletras.png';
import './Styles/Styles.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__branding">
          <img className="app-header__logo" src={logo} alt="Logo Universidad" />
          <h1 className="app-header__title">Encuestas UNPSJB</h1>
        </div>
        <Navbar />
      </header>
      <main className="app-main">
        <Routes>
          <Route path='/'/>
          <Route path='/encuestas' element = {<EncuestasPage/>}/>
          <Route path='/estadisticas' element = {<EstadisticasPage/>}/>
          <Route path='/cuenta' element = {<CuentaPage/>}/>
          <Route path='/completarEncuesta' element = {<EncuestasPage/>}/>

        </Routes>
      </main>
    </div>
  );
};

export default App;
