import { useState } from 'react';
import './App.css';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <span className="badge">HRIS One Monorepo</span>
      <h1>HRIS One Frontend</h1>
      <p>React + TypeScript + Vite</p>
      <div className="card">
        <button className="button" onClick={() => setCount((c) => c + 1)}>
          Count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
