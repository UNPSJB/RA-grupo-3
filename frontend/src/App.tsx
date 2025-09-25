import 'bootstrap/dist/css/bootstrap.min.css';
import CrearPregunta from './CrearPregunta';

import CrearEncuesta from './CrearEncuesta'
import './App.css'

function App() {
  return (
    <div className="App">
      <CrearEncuesta />
      <CrearPregunta />    
    </div>
  )
}

export default App