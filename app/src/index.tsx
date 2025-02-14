import React from 'react';
import ReactDOM from 'react-dom/client';
import { Model } from './model/model';

const App = () => (
  <>
    <Model />
  </>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
