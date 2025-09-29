import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import "../Styles/Styles.css";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <Button className="navbar__button" aux={'Encuestas'} onClick={() => navigate('/encuestas')}/>
      <Button className="navbar__button" aux={'Estadísticas'} onClick={() => navigate('/estadisticas')}/>
      <Button className="navbar__button" aux={'Cuenta'} onClick={() => navigate('/cuenta')}/>
    </nav>
  );
};
