import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B3A2E] to-[#07241C] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C29958_0.8px,transparent_0.8px)] [background-size:24px_24px]" />
            
            <div className="z-10 text-center w-full max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#C29958] rounded-full flex items-center justify-center premium-shadow animate-fade-in shadow-[0_0_30px_rgba(194,153,88,0.4)]">
                    <span className="text-3xl font-serif text-[#0B3A2E] font-bold">N</span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-[#C29958] mb-2 animate-slide-in">The Great Nizam</h1>
                <p className="text-gray-300 mb-10 text-sm tracking-widest uppercase animate-slide-in" style={{animationDelay: '0.1s'}}>Authentic Royal Cuisine</p>

                    <div className="flex flex-col gap-4 animate-slide-in" style={{animationDelay: '0.2s'}}>
                        <button 
                            onClick={() => alert("Please scan the QR code located on your table to start your Dine-In experience.")}
                            className="w-full bg-[#0B3A2E] border border-[#C29958]/50 text-[#C29958] py-4 rounded-xl font-semibold text-lg hover:bg-[#C29958]/10 transition-all active:scale-[0.98]"
                        >
                            Dine In
                        </button>
                    </div>
            </div>
        </div>
    );
}
