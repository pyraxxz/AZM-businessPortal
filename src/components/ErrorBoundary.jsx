import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', fontSize: '14px', color: '#f43f5e', background: '#0a0a0f', minHeight: '100vh' }}>
          <h2 style={{ color: '#f43f5e', marginBottom: '20px' }}>React crashed — ErrorBoundary caught:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message || 'Unknown error'}
            {'\n\n'}
            {this.state.error?.stack || 'No stack trace'}
            {'\n\n'}
            {this.state.errorInfo?.componentStack || 'No component stack'}
          </pre>
          <button
            onClick={() => { 
              localStorage.clear(); 
              window.location.href = '/'; 
            }}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#f43f5e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Clear cache & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
