import React from 'react';
import ReactDOM from 'react-dom';
import { Model } from './model/model';

const App = () => (
  <React.Fragment>
    <Model />
  </React.Fragment>
);

ReactDOM.render(<App />, document.getElementById('root'));
