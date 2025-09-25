import React from 'react';
import { Button } from './Button';
import "../Styles/Styles.css";

export const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <Button className="navbar__button" aux={'Encuestas'} />
      <Button className="navbar__button" aux={'Estadísticas'} />
      <Button className="navbar__button" aux={'Cuenta'} />
    </nav>
  );
};
