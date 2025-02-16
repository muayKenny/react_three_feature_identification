import React from 'react';
import ReactDOM from 'react-dom/client';
import { Model } from './model/model';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true }; // Set error state
  }

  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong.</h2>; // Fallback UI
    }
    return this.props.children;
  }
}

const App = () => (
  <div className='canvas-container'>
    <ErrorBoundary>
      <Model />
    </ErrorBoundary>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
