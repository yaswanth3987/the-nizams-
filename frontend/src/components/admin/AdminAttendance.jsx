import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, X, UserPlus, Trash2, CheckCircle, AlertTriangle, Fingerprint, ScanFace, Smartphone, Lock, Camera } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminAttendance() {
    const [staffList, setStaffList] = useState([]);
    const [attendanceToday, setAttendanceToday] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    
    // Video streaming refs
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const requestAnimationFrameRef = useRef(null);
    const blinkHistory = useRef([]);
    const bestDescriptor = useRef(null); // Stores descriptor when eyes are wide open
    const faceHoldFrames = useRef(0); // For registration stability

    // Registration States
    const [showAddModal, setShowAddModal] = useState(false);
    const [regStep, setRegStep] = useState('form'); // 'form' -> 'scan' -> API
    const [newStaff, setNewStaff] = useState({ name: '', phone: '', faceEmbedding: null });
    
    // Verification / Attendance States
    const [bioModal, setBioModal] = useState({ isOpen: false, staff: null, step: 'camera', errorMessage: '' }); // steps: 'camera', 'otp', 'success', 'error'
    const [otpInput, setOtpInput] = useState('');
    
    // Shared ML UI States
    const [scanMessage, setScanMessage] = useState('Initializing Camera...');

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models/';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);

                // Warm-up inference to compile TensorFlow WebGL shaders BEFORE the user opens the camera.
                try {
                    const dummyCanvas = document.createElement('canvas');
                    dummyCanvas.width = 160; dummyCanvas.height = 160;
                    await faceapi.detectSingleFace(dummyCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
                                 .withFaceLandmarks()
                                 .withFaceDescriptor();
                } catch (e) { console.warn('Warmup skipped:', e.message); }

                setModelsLoaded(true);
            } catch (err) {
                console.error("Failed to load ML models:", err);
                // Force load state even if models failed to load to avoid infinite wait, allowing error messages later
                setModelsLoaded(true); 
            }
        };
        loadModels();
        fetchData();
        return () => stopCamera();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, attRes] = await Promise.all([
                fetch(`${API_URL}/employees`),
                fetch(`${API_URL}/attendance/today`)
            ]);
            const emps = await empRes.json();
            const atts = await attRes.json();
            setStaffList(Array.isArray(emps) ? emps : []);
            setAttendanceToday(Array.isArray(atts) ? atts : []);
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    };

    // === CAMERA HANDLING ===
    const startCamera = async (mode, targetDescriptor = null) => {
        setScanMessage('Requesting Camera Access...');
        try {
            if (streamRef.current) stopCamera(); // Stop any existing streams just in case
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to actually start playing to analyze
                videoRef.current.onplay = () => {
                    setScanMessage(mode === 'register' ? 'Align face and hold still...' : 'Blink to verify liveness & capture...');
                    blinkHistory.current = [];
                    bestDescriptor.current = null;
                    faceHoldFrames.current = 0;
                    analyzeVideo(mode, targetDescriptor);
                };
            }
        } catch (err) {
            console.error("Camera access denied", err);
            setScanMessage('Webcam access denied. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (requestAnimationFrameRef.current) cancelAnimationFrame(requestAnimationFrameRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    // Calculate Eye Aspect Ratio for blink detection
    const calculateEAR = (eye) => {
        const p1 = eye[1], p2 = eye[5], p3 = eye[2], p4 = eye[4], p0 = eye[0], p5 = eye[3];
        const vHeight = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) + Math.sqrt(Math.pow(p3.x - p4.x, 2) + Math.pow(p3.y - p4.y, 2));
        const vWidth = Math.sqrt(Math.pow(p0.x - p5.x, 2) + Math.pow(p0.y - p5.y, 2));
        return vHeight / (2.0 * vWidth);
    };

    const analyzeVideo = async (mode, targetDescriptor = null) => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        try {
            // Use inputSize 160 for extreme speed (mobile friendly), lower threshold for easy lock-on
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
                                           .withFaceLandmarks()
                                           .withFaceDescriptor();

            if (detection) {
                const leftEye = detection.landmarks.getLeftEye();
                const rightEye = detection.landmarks.getRightEye();
                const ear = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2;
                
                // If eyes are wide open, store this pristine descriptor for matching
                if (ear > 0.26) {
                    bestDescriptor.current = detection.descriptor;
                }

                if (mode === 'register') {
                    // Registration: Just look at the camera for 1 second with eyes open to get a clear embedding
                    if (ear > 0.25) {
                        faceHoldFrames.current += 1;
                        if (faceHoldFrames.current < 8) {
                            setScanMessage(`Hold still... (${faceHoldFrames.current}/8)`);
                        } else {
                            if (!bestDescriptor.current) bestDescriptor.current = detection.descriptor;
                            setScanMessage('Face registered successfully!');
                            const embeddingArray = Array.from(bestDescriptor.current);
                            stopCamera();
                            await registerEmployeeAPI({ ...newStaff, faceEmbedding: embeddingArray });
                            return; // exit loop
                        }
                    } else {
                        faceHoldFrames.current = 0;
                        setScanMessage('Please open your eyes directly at the camera.');
                    }
                } 
                else if (mode === 'login' && targetDescriptor) {
                    blinkHistory.current.push(ear);
                    if (blinkHistory.current.length > 15) blinkHistory.current.shift();

                    const minEar = Math.min(...blinkHistory.current);
                    const maxEar = Math.max(...blinkHistory.current);
                    const isBlinked = maxEar > 0.26 && minEar < 0.22; 

                    if (isBlinked) {
                        setScanMessage('Liveness verified! Comparing vectors...');
                        // Use the best pristine descriptor (eyes open) if available, else fallback
                        const descriptorToUse = bestDescriptor.current || detection.descriptor;
                        const distance = faceapi.euclideanDistance(descriptorToUse, targetDescriptor);
                        stopCamera();
                        
                        if (distance <= 0.6) { // 0.6 is official threshold, highly responsive
                            setScanMessage('Face Match Verified! Sending OTP...');
                            triggerAttendanceOTP();
                        } else {
                            setBioModal(prev => ({ ...prev, step: 'error', errorMessage: 'Identity verification failed! Face does not match the registered profile.' }));
                        }
                        return; // exit loop
                    } else {
                        setScanMessage('Face locked! Please BLINK to prove liveness.');
                    }
                }
            } else {
                if (mode === 'register') faceHoldFrames.current = 0;
                setScanMessage('No face detected. Align your face.');
            }
        } catch (e) {
            console.error("Inference Error:", e);
        }

        // Run at ~30 FPS to allow React to process UI updates without crashing the browser tab
        setTimeout(() => {
            requestAnimationFrameRef.current = requestAnimationFrame(() => analyzeVideo(mode, targetDescriptor));
        }, 30);
    };

    // === API HANDLERS ===
    const registerEmployeeAPI = async (employeeData) => {
        try {
            const res = await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });
            if (res.ok) {
                setShowAddModal(false);
                fetchData();
            } else {
                setScanMessage('Server error during registration.');
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteStaff = async (id) => {
        if (!confirm("Remove this staff member permanently?")) return;
        try {
            await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleStartBiometric = (staff) => {
        if (!staff.faceEmbedding) {
            alert('This employee was registered without a face embedding (Old data). Please delete and re-register them!');
            return;
        }
        setBioModal({ isOpen: true, staff, step: 'camera', errorMessage: '' });
        setOtpInput('');
        
        const embeddingArray = JSON.parse(staff.faceEmbedding);
        const targetDescriptor = new Float32Array(embeddingArray);
        
        // Wait a tick for modal to render video tag, then start
        setTimeout(() => startCamera('login', targetDescriptor), 100);
    };

    const triggerAttendanceOTP = async () => {
        try {
            const res = await fetch(`${API_URL}/attendance/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: bioModal.staff.id })
            });
            const data = await res.json();
            
            // Show OTP step and store dev OTP for testing without checking logs
            setBioModal(prev => ({ ...prev, step: 'otp', devOtp: data.devOtp }));
        } catch (err) { console.error(err); }
    };

    const handleVerifyLoginAPI = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/attendance/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: bioModal.staff.id, otp: otpInput })
            });

            if (res.ok) {
                setBioModal(prev => ({ ...prev, step: 'success' }));
                fetchData();
                setTimeout(() => setBioModal({ isOpen: false, staff: null, step: 'camera', errorMessage: '' }), 2000);
            } else {
                const data = await res.json();
                setBioModal(prev => ({ ...prev, errorMessage: data.error || 'Invalid OTP. Check the console and try again.' }));
            }
        } catch (err) { console.error(err); }
    };


    const totalPresent = attendanceToday.length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nizam-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Staff Attendance</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Biometric verification and multi-factor authentication for the personnel registry.
                    </p>
                </div>
                <button 
                    disabled={!modelsLoaded}
                    onClick={() => { setShowAddModal(true); setRegStep('form'); setNewStaff({name:'', phone:'', faceEmbedding: null}); }}
                    className="h-14 px-8 rounded-xl bg-accent text-black font-bold text-sm flex items-center gap-3 transition-all hover:bg-white shadow-xl disabled:opacity-50"
                >
                    {!modelsLoaded ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> : <UserPlus size={20} />} 
                    {modelsLoaded ? 'New Enrollment' : 'Wait...'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard icon={CheckCircle} label="Active Today" value={totalPresent.toString()} subtext="Verified Personnel" color="emerald-400" />
                <StatCard icon={Fingerprint} label="Total Registry" value={staffList.length.toString()} subtext="Enrolled Staff" color="accent" />
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl flex items-center justify-between shadow-2xl group overflow-hidden">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                            <Lock size={14} /> Biometric Guard
                        </h4>
                        <p className="text-sm text-white/60 leading-relaxed">Continuous facial geometry comparison and liveness detection active.</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a120a] border border-emerald-900/30 rounded-[3rem] flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="p-10 border-b border-emerald-900/30 flex justify-between items-center bg-emerald-950/20">
                    <span className="font-black tracking-[0.4em] text-emerald-500/40 uppercase text-xs">Registry Ledger</span>
                    <div className="relative w-96">
                        <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500/40" />
                        <input type="text" placeholder="Identify staff..." className="w-full bg-[#0c0d0c] border border-emerald-900/30 rounded-2xl px-6 pl-16 py-5 text-sm text-white focus:outline-none focus:border-emerald-500/30 transition-all font-sans" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs font-bold uppercase tracking-wider text-white/40 border-b border-white/10 bg-white/5">
                                <th className="py-6 px-10">Registry ID</th>
                                <th className="py-6 px-10">Personnel Name</th>
                                <th className="py-6 px-10">Verification Status</th>
                                <th className="py-6 px-10 text-right">Access Point</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-white/20 font-serif italic text-xl">No active registry detected.</td></tr>
                            ) : staffList.map(staff => {
                                const attended = attendanceToday.find(a => a.employeeId === staff.id);
                                return (
                                    <tr key={staff.id} className="border-b border-white/10 hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-6 px-10 text-white/20 font-serif italic text-sm">#{String(staff.id).padStart(4, '0')}</td>
                                        <td className="py-6 px-10">
                                            <p className="font-serif font-bold text-xl text-white italic">{staff.name}</p>
                                            <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mt-1">Authorized Staff</p>
                                        </td>
                                        <td className="py-6 px-10">
                                            {attended ? (
                                                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20">
                                                    Present
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-white/10 uppercase tracking-widest">Awaiting Scan</span>
                                            )}
                                        </td>
                                        <td className="py-6 px-10 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                {!attended && (
                                                    <button 
                                                        onClick={() => handleStartBiometric(staff)}
                                                        className="px-6 py-2.5 rounded-xl bg-secondary text-accent border border-white/10 hover:bg-white hover:text-black transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                                    >
                                                        <ScanFace size={16} /> Verify
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteStaff(staff.id)} className="p-3 text-white/10 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Registration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-[#0c0d0c]/98 backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-[#111311] border border-white/5 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                        <div className="p-12 border-b border-white/5 text-center relative bg-black/40">
                            <h3 className="text-5xl font-serif text-white font-bold tracking-tight mb-2 italic">Enrollment</h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Biometric Database Integration</p>
                            <button onClick={() => { setShowAddModal(false); stopCamera(); }} className="absolute right-10 top-12 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all"><X size={20} /></button>
                        </div>

                        {regStep === 'form' && (
                            <form 
                                onSubmit={(e) => { 
                                    e.preventDefault(); 
                                    setRegStep('scan'); 
                                    setTimeout(() => startCamera('register'), 100);
                                }} 
                                className="p-12 space-y-10"
                            >
                                <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] text-[13px] text-blue-400 leading-loose italic font-medium flex gap-6">
                                    <AlertTriangle size={24} className="text-nizam-gold shrink-0"/>
                                    <p>Initiating cryptographic facial mapping. Liveness validation mandatory for registry synchronization. This identity shard is permanent.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Full Designation</label>
                                    <input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="Staff Name..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Communication Line</label>
                                    <input required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="+91 ..." />
                                </div>
                                <button type="submit" className="w-full h-24 bg-gradient-to-r from-[#2c5b4d] to-[#1a3d34] text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:brightness-125 transition-all mt-4 flex justify-center items-center gap-4">
                                    <Camera size={20}/> Launch Scanner
                                </button>
                            </form>
                        )}

                        {regStep === 'scan' && (
                            <div className="p-12 text-center animate-in zoom-in-95">
                                <h4 className="text-[11px] font-black text-nizam-gold uppercase tracking-[0.5em] mb-12 italic">Aligning Geometry</h4>
                                <div className="w-80 h-80 mx-auto rounded-full overflow-hidden border-8 border-white/5 shadow-[0_0_100px_rgba(198,168,124,0.1)] relative mb-12">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-110 brightness-110" />
                                    <div className="absolute inset-12 border-2 border-nizam-gold/30 rounded-[2rem] animate-pulse z-40 pointer-events-none">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-nizam-gold/80 rounded-tl-xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-nizam-gold/80 rounded-tr-xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-nizam-gold/80 rounded-bl-xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-nizam-gold/80 rounded-br-xl"></div>
                                    </div>
                                </div>
                                <p className="text-white font-serif text-2xl font-bold tracking-tight italic mb-2">
                                    {scanMessage}
                                </p>
                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] italic uppercase">Positioning face within Royal aperture</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Biometric Verification Modal */}
            {bioModal.isOpen && (
                <div className="fixed inset-0 bg-[#0c0d0c]/98 backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-[#111311] border border-white/5 rounded-[3rem] w-full max-w-md overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative">
                        {bioModal.step !== 'success' && (
                            <button onClick={() => { setBioModal({ isOpen: false, staff: null, step: 'camera', errorMessage: '' }); stopCamera(); }} className="absolute right-10 top-12 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white z-50">
                                <X size={20} />
                            </button>
                        )}
                        
                        <div className="text-center p-12 bg-black/40 border-b border-white/5">
                            <h3 className="text-5xl font-serif text-white mb-2 font-bold tracking-tight italic uppercase">Identity</h3>
                            <p className="text-[10px] text-nizam-gold font-black tracking-[0.3em] uppercase italic">{bioModal.staff?.name}</p>
                        </div>

                        {/* STEP 1: Face Liveness Scanner */}
                        {bioModal.step === 'camera' && (
                            <div className="p-12 pb-20 flex flex-col items-center animate-in zoom-in-95">
                                <div className="relative mb-12 flex justify-center items-center w-80 h-80 rounded-full border-8 border-white/5 bg-black shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-hidden scale-110">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover z-10 brightness-125" />
                                    
                                    <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-blue-500/40 animate-spin z-20 pointer-events-none" style={{ animationDuration: '4s' }}></div>
                                    <div className="absolute inset-4 rounded-full border-b-2 border-r-2 border-nizam-gold/40 animate-spin z-20 pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
                                    <div className="absolute w-full h-[1px] bg-blue-500/40 shadow-[0_0_30px_#3b82f6] animate-pulse z-30 pointer-events-none top-1/2"></div>
                                </div>
                                <p className="text-white font-serif text-2xl font-bold tracking-tight italic animate-pulse text-center leading-relaxed mt-6">
                                    {scanMessage}
                                </p>
                            </div>
                        )}

                        {/* STEP 2: OTP Verification */}
                        {bioModal.step === 'otp' && (
                            <div className="p-12 animate-in slide-in-from-right-8 fade-in">
                                <div className="text-center mb-12">
                                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[1.5rem] mx-auto flex items-center justify-center mb-8 text-nizam-gold shadow-2xl group-hover:scale-110 transition-transform">
                                        <Smartphone size={40} />
                                    </div>
                                    <h4 className="text-4xl font-serif text-white font-bold tracking-tight italic uppercase">MFA Sentinel</h4>
                                    <p className="text-[10px] uppercase font-black text-white/20 mt-4 tracking-[0.4em] italic">Code dispatched to +{bioModal.staff?.phone?.slice(-4)}</p>
                                </div>
                                
                                {bioModal.errorMessage && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8 text-center">
                                        <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em]">{bioModal.errorMessage}</p>
                                    </div>
                                )}

                                {bioModal.devOtp && (
                                    <div className="p-10 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] mb-12 flex flex-col items-center">
                                        <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4 opacity-50">Virtual SMS Buffer</span>
                                        <span className="text-white text-6xl font-serif font-bold tracking-[0.4em] italic tabular-nums">{bioModal.devOtp}</span>
                                    </div>
                                )}

                                <form onSubmit={handleVerifyLoginAPI} className="space-y-10">
                                    <input 
                                        type="text" 
                                        maxLength={4}
                                        autoFocus
                                        value={otpInput}
                                        onChange={e => setOtpInput(e.target.value)}
                                        className="w-full bg-[#0c0d0c] border border-white/10 rounded-[2rem] p-10 text-center text-6xl font-serif text-white tracking-[0.6em] focus:outline-none focus:border-nizam-gold/50 shadow-inner italic font-bold" 
                                        placeholder="----" 
                                    />
                                    <button type="submit" disabled={otpInput.length < 4} className="w-full h-24 bg-gradient-to-r from-[#2c5b4d] to-[#1a3d34] text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:brightness-125 transition-all disabled:opacity-30">
                                        Authorize Signature
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ERROR CATCH */}
                        {bioModal.step === 'error' && (
                            <div className="p-16 text-center animate-in zoom-in-95">
                                <div className="w-28 h-28 bg-red-500/10 border-2 border-red-500/40 mx-auto rounded-full flex items-center justify-center mb-10 shadow-2xl">
                                    <AlertTriangle size={48} className="text-red-500" />
                                </div>
                                <h4 className="text-4xl font-serif text-red-500 font-bold tracking-tighter uppercase mb-4 italic">Denied</h4>
                                <p className="text-sm text-red-500/60 font-medium italic mb-12 leading-relaxed px-6">{bioModal.errorMessage}</p>
                                <button onClick={() => setBioModal({ ...bioModal, step: 'camera', errorMessage: '' })} className="w-full h-20 bg-white/5 border border-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-white hover:text-black transition-all">Retry Analysis</button>
                            </div>
                        )}

                        {/* SUCCESS */}
                        {bioModal.step === 'success' && (
                            <div className="p-16 text-center animate-in zoom-in-95 duration-700">
                                <div className="w-28 h-28 bg-emerald-500/10 border-4 border-emerald-500 rounded-full mx-auto flex items-center justify-center mb-10 shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                                    <CheckCircle size={56} className="text-emerald-400 animate-bounce" />
                                </div>
                                <h4 className="text-4xl font-serif text-emerald-400 tracking-[0.3em] uppercase mb-4 italic font-bold">Authorized</h4>
                                <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-black italic">Identity Verified • Session Logged</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, subvalue, highlight = 'text-white' }) {
    return (
        <div className="bg-[#111311] border border-white/5 p-10 rounded-[2rem] relative shadow-2xl group hover:border-nizam-gold/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-nizam-gold/5 blur-3xl -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 relative z-10">{title}</h4>
            <div className="flex items-baseline gap-3 relative z-10">
                <span className={`text-5xl font-serif tracking-tight font-bold ${highlight}`}>{value}</span>
                <span className="text-[10px] font-black text-nizam-gold/40 tracking-[0.2em] uppercase italic">{subvalue}</span>
            </div>
        </div>
    );
}
