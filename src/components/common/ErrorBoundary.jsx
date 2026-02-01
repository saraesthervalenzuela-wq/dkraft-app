import { Component } from 'react';
import Icon from './Icon';
import Button from './Button';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught:', error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                        <Icon name="error" className="text-red-400 text-4xl" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-200 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-slate-400 mb-6 max-w-md">
                        {this.props.message || 'An unexpected error occurred. Please try again.'}
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mb-6 text-left w-full max-w-lg">
                            <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-400">
                                Error details
                            </summary>
                            <pre className="mt-2 p-4 bg-slate-800/50 rounded-lg text-xs text-red-400 overflow-auto">
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => window.location.reload()}>
                            Refresh Page
                        </Button>
                        <Button variant="primary" onClick={this.handleRetry}>
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
