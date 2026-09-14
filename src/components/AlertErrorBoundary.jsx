import React from 'react';

export default class AlertErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Triggers native browser alert on runtime error
    alert(`Runtime Error: ${error.message}, ${JSON.stringify(errorInfo)}`);
  }

  render() {
    if (this.state.hasError) {
      return <h2>An error occurred. Check the alert prompt.</h2>;
    }
    return this.props.children;
  }
}
