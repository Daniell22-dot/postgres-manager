import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <AlertCircle size={48} className="error-icon" />
            <h2>Something went wrong</h2>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.props.showDetails && this.state.errorInfo && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <div className="error-actions">
              <button onClick={this.handleReset} className="reset-btn">
                <RefreshCw size={16} />
                Try Again
              </button>
              {this.props.onBack && (
                <button onClick={this.props.onBack} className="back-btn">
                  Go Back
                </button>
              )}
            </div>
          </div>
          
          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 40px;
              background: #1e1e2e;
            }
            
            .error-content {
              text-align: center;
              max-width: 500px;
            }
            
            .error-icon {
              color: #f38ba8;
              margin-bottom: 20px;
            }
            
            h2 {
              color: #cdd6f4;
              margin-bottom: 12px;
            }
            
            .error-message {
              color: #6c7086;
              margin-bottom: 20px;
              font-family: monospace;
              background: #181825;
              padding: 12px;
              border-radius: 6px;
              word-break: break-word;
            }
            
            .error-details {
              margin: 20px 0;
              text-align: left;
              background: #181825;
              padding: 12px;
              border-radius: 6px;
              font-size: 12px;
            }
            
            .error-details pre {
              margin-top: 8px;
              overflow-x: auto;
              font-size: 11px;
            }
            
            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 20px;
            }
            
            .reset-btn, .back-btn {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.2s;
            }
            
            .reset-btn {
              background: #89b4fa;
              color: #1e1e2e;
            }
            
            .reset-btn:hover {
              background: #b4befe;
              transform: translateY(-1px);
            }
            
            .back-btn {
              background: #313244;
              color: #cdd6f4;
            }
            
            .back-btn:hover {
              background: #45475a;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;