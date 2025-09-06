import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary glass-card" style={{
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <h2 className="gradient-text">🌊 Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="gradient-button"
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                // Clear any invalid tokens
                localStorage.removeItem('token');
                window.location.reload();
              }}
            >
              🔄 Restart Application
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary>Error Details (Development Only)</summary>
              <pre style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: '1rem', 
                borderRadius: '8px',
                fontSize: '0.8rem',
                overflow: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
