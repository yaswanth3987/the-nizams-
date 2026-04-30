import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Calendar, Clock, Users, Phone, CheckCircle, XCircle, Clock3 } from 'lucide-react';

const AdminReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';

    const fetchReservations = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/waitlist`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setReservations(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
        const socket = io(apiUrl);
        
        socket.on('waitlistUpdated', () => {
            fetchReservations();
        });

        return () => socket.disconnect();
    }, [apiUrl]);

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${apiUrl}/api/waitlist/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Network response was not ok');
            // The socket will trigger a re-fetch
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update reservation status.');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'waiting': return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium flex items-center gap-1"><Clock3 size={14}/> Waiting</span>;
            case 'seated': return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14}/> Seated</span>;
            case 'cancelled': return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14}/> Cancelled</span>;
            default: return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">{status}</span>;
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Reservations & Waitlist</h2>
                    <p className="text-gray-400">Manage incoming bookings from the website</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : reservations.length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-xl p-12 text-center border border-white/5">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No Reservations Yet</h3>
                    <p className="text-gray-400">Bookings made on the website will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reservations.map(res => (
                        <div key={res.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 hover:border-amber-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white capitalize">{res.name}</h3>
                                {getStatusBadge(res.status)}
                            </div>
                            
                            <div className="space-y-2 mb-6">
                                {res.bookingDate && (
                                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg mb-4">
                                        <div>
                                            <div className="text-xs text-amber-500/70 uppercase tracking-wider font-bold mb-1">Target Seating</div>
                                            <div className="text-amber-400 font-bold capitalize">{res.seatingType || 'Table'} - {res.seatingId || 'Any'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-amber-500/70 uppercase tracking-wider font-bold mb-1">Date & Time</div>
                                            <div className="text-amber-400 font-bold">{res.bookingDate} @ {res.bookingTime}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center text-gray-300 gap-3 bg-black/20 p-2 rounded-lg">
                                    <Users size={18} className="text-amber-500" />
                                    <span>Party of <strong className="text-white text-lg">{res.party_size}</strong></span>
                                </div>
                                <div className="flex items-center text-gray-300 gap-3 bg-black/20 p-2 rounded-lg">
                                    <Phone size={18} className="text-amber-500" />
                                    <span className="text-white">{res.phone}</span>
                                </div>
                                {res.email && (
                                    <div className="flex items-center text-gray-300 gap-3 bg-black/20 p-2 rounded-lg">
                                        <span className="text-amber-500 w-[18px] text-center font-bold">@</span>
                                        <span className="text-white text-sm truncate">{res.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center text-gray-500 gap-3 text-xs px-2 mt-3 border-t border-white/5 pt-3">
                                    <Clock size={12} />
                                    <span>Request received: {new Date(res.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {res.status === 'waiting' && (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => updateStatus(res.id, 'seated')}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle size={18}/> Seat Table
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(res.id, 'cancelled')}
                                        className="flex-1 bg-red-900/50 hover:bg-red-800 text-red-200 py-2 rounded-lg font-medium transition-colors border border-red-800/50 flex justify-center items-center gap-2"
                                    >
                                        <XCircle size={18}/> Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminReservations;
