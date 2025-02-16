import React from 'react';
import ReactDOM from 'react-dom/client';
import { Model } from './model/model';
import './index.css'; // ✅ Import global styles

const App = () => (
  <div className='canvas-container'>
    <Model />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
