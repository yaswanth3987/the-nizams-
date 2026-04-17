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
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide uppercase">Attendance Hub</h2>
                    <p className="text-nizam-textMuted text-sm max-w-xl leading-relaxed italic">
                        Advanced multi-factor security. Enforce daily attendance via ML Biometrics and 2FA to ensure high-integrity staff reporting.
                    </p>
                </div>
                <button 
                    disabled={!modelsLoaded}
                    onClick={() => { setShowAddModal(true); setRegStep('form'); setNewStaff({name:'', phone:'', faceEmbedding: null}); }}
                    className="bg-nizam-dark border-2 border-nizam-gold/30 text-nizam-gold hover:bg-nizam-gold hover:text-black disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl"
                >
                    {!modelsLoaded ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-nizam-gold"></div> : <UserPlus className="w-4 h-4" />} 
                    {modelsLoaded ? 'Register Staff' : 'Initializing ML...'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Present Today" value={totalPresent.toString().padStart(2, '0')} subvalue=" Verified" highlight="text-emerald-400" />
                <StatCard title="Total Roster" value={staffList.length.toString().padStart(2, '0')} subvalue=" Active" highlight="text-white" />
                <div className="bg-nizam-card border-2 border-blue-900/40 p-6 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 animate-pulse"/> SECURE ENCLAVE
                        </h4>
                        <p className="text-[11px] text-nizam-textMuted leading-relaxed font-medium italic">Continuous facial geometry comparison with forced liveness detection enabled.</p>
                    </div>
                </div>
            </div>

            <div className="bg-nizam-card border-2 border-nizam-border/30 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-nizam-border/30 flex justify-between items-center bg-black/20">
                    <span className="font-black tracking-[0.3em] text-nizam-textMuted uppercase text-[10px]">Staff Ledger</span>
                    <div className="relative w-72">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-nizam-gold" />
                        <input type="text" placeholder="Filter staff..." className="w-full bg-nizam-dark border-2 border-nizam-border/30 rounded-xl px-5 pl-11 py-2.5 text-xs text-white focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-nizam-gold/60 border-b border-nizam-border/30 bg-nizam-dark/50">
                                <th className="py-5 px-8">ID</th>
                                <th className="py-5 px-8">Staff Member</th>
                                <th className="py-5 px-8">Contact</th>
                                <th className="py-5 px-8">Service Status</th>
                                <th className="py-5 px-8 text-right">Verification Gate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-[#a8b8b2] text-sm">No employees registered yet.</td></tr>
                            ) : staffList.map(staff => {
                                const attended = attendanceToday.find(a => a.employeeId === staff.id);
                                return (
                                    <tr key={staff.id} className="border-b border-nizam-border/30 hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-6 px-8 text-nizam-textMuted font-mono text-xs">#{String(staff.id).padStart(4, '0')}</td>
                                        <td className="py-6 px-8">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm uppercase tracking-tight">{staff.name}</span>
                                                <span className="text-[10px] text-nizam-textMuted font-bold uppercase tracking-widest mt-0.5">Staff Associate</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-nizam-textMuted font-mono text-xs italic">{staff.phone}</td>
                                        <td className="py-6 px-8">
                                            {attended ? (() => {
                                                const checkinTime = new Date(attended.checkInTime || attended.date || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                                return (
                                                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-black bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 shadow-sm animate-in fade-in zoom-in-95">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    Verified at {checkinTime}
                                                </span>
                                            )})() : (
                                                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-nizam-textMuted font-black bg-nizam-dark px-3 py-2 rounded-lg border border-nizam-border/30">
                                                    <Clock className="w-3.5 h-3.5 opacity-30" /> Off-Duty
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {attended ? (
                                                    <div className="bg-emerald-500/5 text-emerald-400/50 border border-emerald-500/10 px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.3em] uppercase">
                                                        SESSION ACTIVE
                                                    </div>
                                                ) : (
                                                    <button 
                                                        disabled={!modelsLoaded}
                                                        onClick={() => handleStartBiometric(staff)}
                                                        className="bg-nizam-dark disabled:opacity-50 text-blue-400 border-2 border-blue-900/40 hover:bg-blue-600 hover:text-white hover:border-blue-500 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all inline-flex items-center gap-2 shadow-lg active:scale-95"
                                                    >
                                                        {!modelsLoaded ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div> : <ScanFace className="w-4 h-4" />} 
                                                        Identify
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteStaff(staff.id)}
                                                    className="text-red-500/20 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-500/10"
                                                    title="Purge Identity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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


            {showAddModal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-nizam-card border-2 border-nizam-border/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-nizam-border/30 text-center relative bg-black/20">
                            <div className="flex items-center justify-center gap-3">
                                <Lock className="w-4 h-4 text-nizam-gold"/>
                                <h3 className="text-xl font-serif text-white uppercase tracking-widest">ML ENROLLMENT</h3>
                            </div>
                            <button onClick={() => { setShowAddModal(false); stopCamera(); }} className="absolute right-6 top-6 text-nizam-textMuted hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        {regStep === 'form' && (
                            <form 
                                onSubmit={(e) => { 
                                    e.preventDefault(); 
                                    setRegStep('scan'); 
                                    setTimeout(() => startCamera('register'), 100);
                                }} 
                                className="p-8"
                            >
                                <div className="space-y-6">
                                    <div className="bg-blue-950/20 border-2 border-blue-900/30 p-5 rounded-xl text-[11px] text-blue-300 flex gap-4 leading-relaxed font-medium italic">
                                        <AlertTriangle className="w-5 h-5 text-nizam-gold shrink-0"/>
                                        <p>Cryptographic facial mapping initiation. Staff must be present for liveness validation. This profile is permanent.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-nizam-textMuted tracking-[0.3em] uppercase mb-2">Legal Identity Name</label>
                                        <input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-nizam-dark border-2 border-nizam-border/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="Full Name" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-nizam-textMuted tracking-[0.3em] uppercase mb-2">Secure Mobile Line</label>
                                        <input required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full bg-nizam-dark border-2 border-nizam-border/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="+44 ..." />
                                    </div>
                                </div>
                                <button type="submit" className="w-full mt-8 py-5 bg-nizam-gold text-black font-black rounded-xl text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-white shadow-xl active:scale-[0.98] flex justify-center items-center gap-3">
                                    <Camera className="w-5 h-5"/> Initialize Biometrics
                                </button>
                            </form>
                        )}

                        {regStep === 'scan' && (
                            <div className="p-10 text-center">
                                <h4 className="text-white font-serif text-2xl mb-6">Scanning Geometry</h4>
                                <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-nizam-gold/50 shadow-[0_0_50px_rgba(182,156,114,0.2)] relative mb-8">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-110" />
                                    <div className="absolute inset-8 border-2 border-nizam-gold/30 rounded-2xl animate-pulse z-40 pointer-events-none">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-nizam-gold rounded-tl"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-nizam-gold rounded-tr"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-nizam-gold rounded-bl"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-nizam-gold rounded-br"></div>
                                    </div>
                                </div>
                                <p className="text-nizam-gold font-mono tracking-[0.3em] text-sm font-black uppercase animate-pulse mb-3">
                                    {scanMessage}
                                </p>
                                <p className="text-nizam-textMuted text-[10px] uppercase font-black tracking-widest italic">Position face within the golden aperture</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {bioModal.isOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-nizam-dark border-2 border-nizam-border/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200 relative">
                        {bioModal.step !== 'success' && (
                            <button onClick={() => { setBioModal({ isOpen: false, staff: null, step: 'camera', errorMessage: '' }); stopCamera(); }} className="absolute right-6 top-6 text-nizam-textMuted hover:text-white z-50">
                                <X className="w-6 h-6" />
                            </button>
                        )}
                        
                        <div className="text-center p-10 bg-black/40 border-b border-nizam-border/30">
                            <h3 className="text-3xl font-serif text-white mb-2 tracking-[0.2em] uppercase">Security Gate</h3>
                            <p className="text-[10px] text-nizam-gold font-black tracking-[0.3em] uppercase">Target: {bioModal.staff?.name}</p>
                        </div>

                        {/* STEP 1: Face Liveness Scanner */}
                        {bioModal.step === 'camera' && (
                            <div className="p-10 pb-14 flex flex-col items-center">
                                <div className="relative mb-8 flex justify-center items-center w-64 h-64 rounded-full border-4 border-blue-900/30 bg-black shadow-[0_0_60px_rgba(59,130,246,0.15)] overflow-hidden scale-110">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover z-10 brightness-110" />
                                    
                                    {/* Scanning Overlays */}
                                    <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin z-20 pointer-events-none" style={{ animationDuration: '3s' }}></div>
                                    <div className="absolute inset-3 rounded-full border-b-2 border-r-2 border-nizam-gold animate-spin z-20 pointer-events-none opacity-50" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                                    <div className="absolute w-full h-[1px] bg-blue-400 shadow-[0_0_20px_#3b82f6] animate-pulse z-30 pointer-events-none top-1/2"></div>
                                </div>
                                <p className="text-blue-400 font-mono tracking-[0.2em] text-[11px] font-black animate-pulse text-center leading-relaxed uppercase mt-4">
                                    {scanMessage}
                                </p>
                            </div>
                        )}

                        {/* STEP 2: OTP Verification */}
                        {bioModal.step === 'otp' && (
                            <div className="p-10 animate-in slide-in-from-right-8 fade-in">
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-nizam-dark border-2 border-nizam-border/30 rounded-2xl mx-auto flex items-center justify-center mb-6 text-nizam-gold shadow-xl">
                                        <Smartphone className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-2xl font-serif text-white tracking-widest uppercase">MFA Sentinel</h4>
                                    <p className="text-[9px] uppercase font-black text-nizam-textMuted mt-3 tracking-[0.3em]">Code dispatched to +{bioModal.staff?.phone?.slice(-4)}</p>
                                </div>
                                
                                {bioModal.errorMessage && (
                                    <div className="bg-red-500/10 border-2 border-red-500/20 p-3 rounded-xl mb-6 text-center animate-shake">
                                        <p className="text-red-400 font-black text-[9px] uppercase tracking-[0.2em]">{bioModal.errorMessage}</p>
                                    </div>
                                )}

                                {bioModal.devOtp && (
                                    <div className="bg-blue-500/10 border-2 border-blue-500/20 p-5 rounded-2xl mb-8 flex flex-col items-center">
                                        <span className="text-blue-400 font-black text-[9px] uppercase tracking-[0.3em] mb-2 opacity-50">Debug Virtual SMS</span>
                                        <span className="text-white text-3xl font-mono tracking-[0.5em] font-black tabular-nums">{bioModal.devOtp}</span>
                                    </div>
                                )}

                                <form onSubmit={handleVerifyLoginAPI} className="space-y-8">
                                    <input 
                                        type="text" 
                                        maxLength={4}
                                        autoFocus
                                        value={otpInput}
                                        onChange={e => setOtpInput(e.target.value)}
                                        className="w-full bg-black border-2 border-nizam-border/30 rounded-2xl p-6 text-center text-4xl font-mono text-white tracking-[0.8em] focus:outline-none focus:border-nizam-gold/50 shadow-inner transition-all font-black" 
                                        placeholder="----" 
                                    />
                                    <button type="submit" disabled={otpInput.length < 4} className="w-full py-6 bg-nizam-gold text-black font-black tracking-[0.4em] uppercase text-xs rounded-xl transition-all shadow-2xl hover:bg-white active:scale-[0.98] disabled:opacity-30">
                                        Authorize Signature
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ERROR CATCH */}
                        {bioModal.step === 'error' && (
                            <div className="p-12 text-center animate-in zoom-in-95">
                                <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500 mx-auto rounded-full flex items-center justify-center mb-8">
                                    <AlertTriangle className="w-12 h-12 text-red-500" />
                                </div>
                                <h4 className="text-3xl font-serif text-red-500 tracking-widest uppercase mb-4">Breach Detected</h4>
                                <p className="text-sm text-red-400 font-medium italic mb-10 leading-relaxed px-4">{bioModal.errorMessage}</p>
                                <button onClick={() => setBioModal({ ...bioModal, step: 'camera', errorMessage: '' })} className="py-4 px-10 bg-nizam-dark border-2 border-nizam-border/50 text-white rounded-xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-black transition-all">Manual Override</button>
                            </div>
                        )}

                        {/* SUCCESS */}
                        {bioModal.step === 'success' && (
                            <div className="p-12 text-center animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-emerald-500/10 border-4 border-emerald-500 rounded-full mx-auto flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                                    <CheckCircle className="w-14 h-14 text-emerald-400 animate-bounce" />
                                </div>
                                <h4 className="text-3xl font-serif text-emerald-400 tracking-[0.2em] uppercase mb-2">Gate Open</h4>
                                <p className="text-[10px] text-nizam-textMuted uppercase tracking-[0.4em] font-black italic">Identity Verified • Session Logged</p>
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
        <div className="bg-nizam-card border-2 border-nizam-border/30 p-8 rounded-2xl relative shadow-2xl group hover:border-nizam-gold/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-nizam-gold/5 blur-3xl -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-nizam-textMuted mb-4 relative z-10">{title}</h4>
            <div className="flex items-baseline gap-2 relative z-10">
                <span className={`text-4xl font-serif tracking-tight font-bold ${highlight}`}>{value}</span>
                <span className="text-[10px] font-black text-nizam-gold/40 tracking-[0.2em] uppercase italic">{subvalue}</span>
            </div>
        </div>
    );
}
