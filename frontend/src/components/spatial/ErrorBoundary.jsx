import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { bad: false };
  }

  static getDerivedStateFromError() {
    return { bad: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.bad) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default ErrorBoundary;
