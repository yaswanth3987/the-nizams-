import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const [showTakeawayForm, setShowTakeawayForm] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const navigate = useNavigate();

    const handleTakeawaySubmit = (e) => {
        e.preventDefault();
        if (name && phone) {
            localStorage.setItem('takeaway_name', name);
            localStorage.setItem('takeaway_phone', phone);
            navigate('/takeaway');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B3A2E] to-[#07241C] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat" />
            
            <div className="z-10 text-center w-full max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#C29958] rounded-full flex items-center justify-center premium-shadow animate-fade-in shadow-[0_0_30px_rgba(194,153,88,0.4)]">
                    <span className="text-3xl font-serif text-[#0B3A2E] font-bold">N</span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-[#C29958] mb-2 animate-slide-in">The Great Nizam</h1>
                <p className="text-gray-300 mb-10 text-sm tracking-widest uppercase animate-slide-in" style={{animationDelay: '0.1s'}}>Authentic Royal Cuisine</p>

                {!showTakeawayForm ? (
                    <div className="flex flex-col gap-4 animate-slide-in" style={{animationDelay: '0.2s'}}>
                        <button 
                            onClick={() => alert("Please scan the QR code located on your table to start your Dine-In experience.")}
                            className="w-full bg-[#0B3A2E] border border-[#C29958]/50 text-[#C29958] py-4 rounded-xl font-semibold text-lg hover:bg-[#C29958]/10 transition-all active:scale-[0.98]"
                        >
                            Dine In
                        </button>
                        <button 
                            onClick={() => setShowTakeawayForm(true)}
                            className="w-full bg-[#C29958] text-[#0B3A2E] py-4 rounded-xl font-bold text-lg premium-shadow hover:bg-[#b0884b] transition-all active:scale-[0.98]"
                        >
                            Takeaway Order
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleTakeawaySubmit} className="bg-[#0B3A2E]/80 backdrop-blur-md p-6 rounded-2xl border border-[#C29958]/30 animate-fade-in">
                        <h2 className="text-xl font-serif text-[#C29958] mb-4 text-left">Your Details</h2>
                        
                        <div className="mb-4 text-left">
                            <label className="block text-gray-300 text-sm mb-1">Full Name</label>
                            <input 
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[#07241C] text-white border border-[#C29958]/30 focus:border-[#C29958] focus:outline-none transition-colors"
                                placeholder="Enter your name"
                            />
                        </div>
                        
                        <div className="mb-6 text-left">
                            <label className="block text-gray-300 text-sm mb-1">Phone Number</label>
                            <input 
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[#07241C] text-white border border-[#C29958]/30 focus:border-[#C29958] focus:outline-none transition-colors"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowTakeawayForm(false)}
                                className="flex-1 py-3 rounded-lg font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                type="submit"
                                className="flex-[2] bg-[#C29958] text-[#0B3A2E] py-3 rounded-lg font-bold premium-shadow hover:bg-[#b0884b] transition-all active:scale-[0.98]"
                            >
                                Start Ordering
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
