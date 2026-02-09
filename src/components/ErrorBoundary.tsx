import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-rose-600 mb-4">Something went wrong.</h1>
                    <p className="text-slate-600 mb-4">Please try refreshing the page.</p>
                    <div className="bg-slate-100 p-4 rounded-lg text-left overflow-auto max-w-2xl mx-auto">
                        <code className="text-xs text-rose-500 font-mono">
                            {this.state.error?.toString()}
                        </code>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
