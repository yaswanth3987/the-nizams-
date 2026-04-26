import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#111312] flex items-center justify-center p-6 text-emerald-50">
                    <div className="bg-[#1c1e1c] max-w-md w-full p-8 rounded-xl border border-red-900/30 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-900"></div>
                        
                        <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        
                        <h1 className="text-2xl font-serif text-white mb-2 tracking-wide">Interface Error</h1>
                        <p className="text-[#9ca3af] text-sm mb-8 leading-relaxed">
                            The Great Nizam digital terminal encountered an unexpected rendering fault and has halted to prevent data corruption.
                        </p>

                        <div className="bg-black/40 border border-white/5 rounded p-4 text-left mb-8 overflow-x-auto">
                            <p className="text-red-400 font-mono text-xs">{this.state.error?.toString()}</p>
                        </div>

                        <button 
                            onClick={() => window.location.reload()} 
                            className="w-full py-3 px-4 bg-gradient-to-r from-[#173a2f] to-[#122e25] border border-[#1f4a38] text-[#a8b8b2] hover:text-white rounded font-bold uppercase tracking-widest text-[10px] transition-all flex justify-center items-center gap-2"
                        >
                            <Clock className="w-4 h-4" /> Restart Terminal
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}
