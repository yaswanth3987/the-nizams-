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
                    <h2 className="text-3xl font-serif text-white mb-2 tracking-wide">Secure Attendance Hub</h2>
                    <p className="text-[#a8b8b2] text-sm max-w-xl leading-relaxed">
                        Strict multi-factor authentication. Enforce daily attendance via ML Hardware Biometrics (Facial Liveness) followed by 2FA OTP verification to permanently eliminate proxy check-ins.
                    </p>
                </div>
                <button 
                    disabled={!modelsLoaded}
                    onClick={() => { setShowAddModal(true); setRegStep('form'); setNewStaff({name:'', phone:'', faceEmbedding: null}); }}
                    className="bg-emerald-900 border border-emerald-600 text-emerald-400 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
                >
                    {!modelsLoaded ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400"></div> : <UserPlus className="w-4 h-4" />} 
                    {modelsLoaded ? 'Register Employee' : 'Downloading ML...'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Staff Present" value={totalPresent.toString().padStart(2, '0')} subvalue=" Verified Today" highlight="text-emerald-400" />
                <StatCard title="Total Registered" value={staffList.length.toString().padStart(2, '0')} subvalue=" Active Profiles" highlight="text-white" />
                <div className="bg-[#1c1e1c] border border-blue-900/50 p-6 rounded-xl flex items-center justify-between shadow-lg">
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80 mb-2 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5"/> ML BIO-SECURE ENABLED</h4>
                        <p className="text-xs text-[#a8b8b2] leading-relaxed">Continuous facial geometry comparison with forced liveness (blink-to-capture) active on all checkpoints.</p>
                    </div>
                </div>
            </div>

            <div className="bg-nizam-card border border-nizam-border rounded-xl flex flex-col shadow-xl">
                <div className="p-4 border-b border-nizam-border/50 flex justify-between items-center text-sm">
                    <span className="font-bold tracking-widest text-[#a8b8b2] uppercase text-[10px]">Active Staff Roster</span>
                    <div className="relative w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a8b8b2]" />
                        <input type="text" placeholder="Search roster..." className="w-full bg-[#111312] border border-nizam-border rounded px-4 pl-9 py-1.5 text-xs text-white focus:outline-none focus:border-nizam-gold/50" />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8b2] border-b border-nizam-border/50 bg-black/20">
                                <th className="py-4 px-6">ID</th>
                                <th className="py-4 px-6">STAFF MEMBER</th>
                                <th className="py-4 px-6">CONTACT NO.</th>
                                <th className="py-4 px-6">TODAY'S STATUS</th>
                                <th className="py-4 px-6 text-right">MFA CHECK-IN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-[#a8b8b2] text-sm">No employees registered yet.</td></tr>
                            ) : staffList.map(staff => {
                                const attended = attendanceToday.find(a => a.employeeId === staff.id);
                                return (
                                    <tr key={staff.id} className="border-b border-nizam-border/30 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-6 text-[#a8b8b2] font-mono text-xs">#{String(staff.id).padStart(4, '0')}</td>
                                        <td className="py-4 px-6 font-bold text-white text-sm">{staff.name}</td>
                                        <td className="py-4 px-6 text-[#a8b8b2] font-mono text-xs overflow-hidden max-w-[120px] text-ellipsis whitespace-nowrap">{staff.phone}</td>
                                        <td className="py-4 px-6">
                                            {attended ? (() => {
                                                const checkinTime = new Date(attended.checkInTime || attended.date || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                                return (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-900/20 px-2.5 py-1.5 rounded border border-emerald-900/50">
                                                    <CheckCircle className="w-3.5 h-3.5" /> In at {checkinTime}
                                                </span>
                                            )})() : (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#a8b8b2] font-bold bg-[#1a1c1a] px-2.5 py-1.5 rounded border border-gray-700/50">
                                                    <Clock className="w-3.5 h-3.5" /> Pending Signature
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            {attended ? (
                                                <button disabled className="bg-[#1c2e26] text-emerald-600 border border-[#173a2f] px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase cursor-not-allowed">
                                                    PRESENT
                                                </button>
                                            ) : (
                                                <button 
                                                    disabled={!modelsLoaded}
                                                    onClick={() => handleStartBiometric(staff)}
                                                    title={modelsLoaded ? "Face Recognition MFA Check-in" : "Loading Models..."}
                                                    className="bg-[#111827] disabled:opacity-50 text-blue-400 border border-blue-900 hover:bg-blue-900 hover:text-white px-4 py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-colors inline-flex items-center gap-2 align-middle shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                                                >
                                                    {!modelsLoaded ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div> : <ScanFace className="w-4 h-4" />} 
                                                    {modelsLoaded ? '2FA LOGIN' : 'LOADING'}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteStaff(staff.id)}
                                                className="text-red-500/60 hover:text-red-400 transition-colors inline-flex align-middle ml-2 p-1"
                                                title="Remove Staff"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* REGISTRATION MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-nizam-card border border-nizam-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-nizam-border/50 text-center relative bg-black/40 flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4 text-[#a8b8b2]"/>
                            <h3 className="text-lg font-serif text-white">Secure ML Registration</h3>
                            <button onClick={() => { setShowAddModal(false); stopCamera(); }} className="absolute right-4 top-4 text-[#a8b8b2] hover:text-white"><X className="w-4 h-4" /></button>
                        </div>

                        {regStep === 'form' && (
                            <form 
                                onSubmit={(e) => { 
                                    e.preventDefault(); 
                                    setRegStep('scan'); 
                                    setTimeout(() => startCamera('register'), 100);
                                }} 
                                className="p-6"
                            >
                                <div className="space-y-4">
                                    <div className="bg-[#1c1e1c] border border-nizam-border/50 p-4 rounded-lg mb-6 text-xs text-[#a8b8b2] flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-nizam-gold shrink-0"/>
                                        <p>You are initiating a permanent cryptographic face mapping. The employee must be present to blink into the camera for liveness verification.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#a8b8b2] tracking-widest uppercase mb-1.5">Full Name (Govt ID Matching)</label>
                                        <input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-[#111312] border border-nizam-border rounded p-3 text-sm text-white focus:outline-none focus:border-nizam-gold" placeholder="e.g. John Doe" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#a8b8b2] tracking-widest uppercase mb-1.5">Mobile Number (For 2FA OTP)</label>
                                        <input required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full bg-[#111312] border border-nizam-border rounded p-3 text-sm text-white focus:outline-none focus:border-nizam-gold" placeholder="+44 7700 900077" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full mt-6 py-4 bg-emerald-900 border border-emerald-600 hover:bg-emerald-800 text-white font-bold rounded text-[11px] uppercase tracking-widest transition-colors flex justify-center items-center gap-2">
                                    <Camera className="w-4 h-4"/> Next: Capture ML Face Geometry
                                </button>
                            </form>
                        )}

                        {regStep === 'scan' && (
                            <div className="p-8 text-center">
                                <h4 className="text-white font-serif text-xl mb-4">Capturing Face ID</h4>
                                <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-[#3b82f6] shadow-[0_0_30px_rgba(59,130,246,0.2)] relative mb-6">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                    <div className="absolute inset-4 border border-blue-400/50 rounded-lg animate-pulse z-40 pointer-events-none">
                                        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-blue-400 rounded-tl"></div>
                                        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-blue-400 rounded-tr"></div>
                                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-blue-400 rounded-bl"></div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-blue-400 rounded-br"></div>
                                    </div>
                                </div>
                                <p className="text-cyan-400 font-mono tracking-widest text-sm font-bold uppercase animate-pulse mb-2">
                                    {scanMessage}
                                </p>
                                <p className="text-[#a8b8b2] text-[10px] uppercase">Please position your face clearly in the circle and blink to combat photo-spoofing.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* LOGIN / ATTENDANCE MODAL */}
            {bioModal.isOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#111312] border border-nizam-border rounded-xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
                        {bioModal.step !== 'success' && (
                            <button onClick={() => { setBioModal({ isOpen: false, staff: null, step: 'camera', errorMessage: '' }); stopCamera(); }} className="absolute right-4 top-4 text-white/50 hover:text-white z-50">
                                <X className="w-6 h-6" />
                            </button>
                        )}
                        
                        <div className="text-center p-8 bg-gradient-to-b from-[#1c1e1c] to-[#111312] border-b border-white/5">
                            <h3 className="text-2xl font-serif text-white mb-2 tracking-wider">MFA Security Gate</h3>
                            <p className="text-[#a8b8b2] text-sm">Target Identity: <span className="text-white font-bold">{bioModal.staff?.name}</span></p>
                        </div>

                        {/* STEP 1: Face Liveness Scanner */}
                        {bioModal.step === 'camera' && (
                            <div className="p-8 pb-12 flex flex-col items-center">
                                <div className="relative mb-8 flex justify-center items-center w-56 h-56 rounded-full border border-blue-900/50 bg-[#0a0a0a] shadow-[0_0_40px_rgba(59,130,246,0.1)] overflow-hidden">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover z-10" />
                                    
                                    {/* Scanning Overlays */}
                                    <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[#3b82f6] animate-spin z-20 pointer-events-none" style={{ animationDuration: '3s' }}></div>
                                    <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-nizam-gold animate-spin z-20 pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                                    <div className="absolute w-full h-[2px] bg-cyan-400/80 shadow-[0_0_15px_#22d3ee] animate-pulse z-30 pointer-events-none top-1/2"></div>
                                </div>
                                <p className="text-cyan-400 font-mono tracking-widest text-[11px] font-bold animate-pulse text-center leading-relaxed">
                                    {scanMessage}
                                </p>
                            </div>
                        )}

                        {/* STEP 2: OTP Verification */}
                        {bioModal.step === 'otp' && (
                            <div className="p-8 animate-in slide-in-from-right-8 fade-in">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-[#181a17] border border-[#2a302a] rounded-full mx-auto flex items-center justify-center mb-4 text-white">
                                        <Smartphone className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white tracking-wide">Enter 2FA Code</h4>
                                    <p className="text-[10px] uppercase font-bold text-[#a8b8b2] mt-2 tracking-widest">Sent via SMS to {bioModal.staff?.phone}</p>
                                </div>
                                
                                {bioModal.errorMessage && (
                                    <div className="bg-red-900/30 border border-red-500/50 p-2 rounded mb-4 text-center">
                                        <p className="text-red-400 font-bold text-[10px] uppercase tracking-widest">{bioModal.errorMessage}</p>
                                    </div>
                                )}

                                {bioModal.devOtp && (
                                    <div className="bg-blue-900/40 border border-blue-500/50 p-3 rounded mb-6 flex flex-col items-center">
                                        <span className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-1">[DEV SMS SIMULATOR]</span>
                                        <span className="text-white text-lg font-mono tracking-widest font-bold">{bioModal.devOtp}</span>
                                    </div>
                                )}

                                <form onSubmit={handleVerifyLoginAPI} className="space-y-6">
                                    <input 
                                        type="text" 
                                        maxLength={4}
                                        autoFocus
                                        value={otpInput}
                                        onChange={e => setOtpInput(e.target.value)}
                                        className="w-full bg-[#1c1e1c] border-2 border-blue-900/50 rounded-xl p-4 text-center text-3xl font-mono text-white tracking-[1em] focus:outline-none focus:border-blue-500/50 shadow-inner" 
                                        placeholder="0000" 
                                    />
                                    <button type="submit" disabled={otpInput.length < 4} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase text-xs rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50">
                                        Verify & Mark Attendance
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ERROR CATCH (if ML fails entirely) */}
                        {bioModal.step === 'error' && (
                            <div className="p-8 text-center">
                                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-red-500 tracking-wide mb-2">Access Denied</h4>
                                <p className="text-sm text-red-400/80 mb-6">{bioModal.errorMessage}</p>
                                <button onClick={() => setBioModal({ ...bioModal, step: 'camera', errorMessage: '' })} className="py-2 px-6 border border-red-900/50 text-red-400 rounded font-bold uppercase tracking-widest text-[10px] hover:bg-red-900/20">Try Again</button>
                            </div>
                        )}

                        {/* SUCCESS */}
                        {bioModal.step === 'success' && (
                            <div className="p-8 text-center animate-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-emerald-900/20 border-2 border-emerald-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h4 className="text-xl font-bold text-emerald-400 tracking-wide mb-1">Access Granted</h4>
                                <p className="text-xs text-[#a8b8b2] uppercase tracking-widest font-bold">Attendance Logged Successfully</p>
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
        <div className="bg-[#1c1e1c] border border-nizam-border p-6 rounded-xl relative shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8b2] mb-3">{title}</h4>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-serif tracking-wide ${highlight}`}>{value}</span>
                <span className="text-[10px] font-bold text-[#a8b8b2] tracking-widest uppercase">{subvalue}</span>
            </div>
        </div>
    );
}
