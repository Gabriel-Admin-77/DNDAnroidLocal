'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * App-wide error boundary. Catches render-time exceptions so a single
 * bad AI response or transient data shape doesn't kill the whole game.
 * Shows the last known error and lets the user reset the view or go home.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Surface to console for debugging; in a real app this would
        // also post to a telemetry endpoint.
        console.error('[ErrorBoundary] caught:', error, info);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-stone-900 border border-red-900/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950/40 border border-red-900/50">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-serif text-stone-100 mb-1">The Adventure Stumbled</h1>
                            <p className="text-sm text-stone-400">
                                Something broke while weaving the tale. Your progress is safe — try reloading the scene.
                            </p>
                        </div>
                        {this.state.error?.message && (
                            <details className="text-left bg-stone-950 border border-stone-800 rounded-lg p-3">
                                <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-300">
                                    Error details
                                </summary>
                                <pre className="mt-2 text-[10px] text-red-300/80 whitespace-pre-wrap break-words font-mono">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 text-stone-950 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </button>
                            <Link
                                href="/"
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                            >
                                <Home className="w-4 h-4" /> Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
