import { useEffect, useCallback, useRef } from 'react';
import { useSound } from './useSound';

const SOUNDS = {
    assistance: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Premium Service Bell
    newOrder: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',    // Modern Soft Ding
    ready: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',       // Success Chime
    bill: 'https://assets.mixkit.co/active_storage/sfx/2208/2208-preview.mp3'        // Cash Register
};

export const useSoundSystem = (hasActiveAssistance = false) => {
    const { soundEnabled } = useSound();
    const assistanceInterval = useRef(null);
    const audioElements = useRef({});

    // Preload sounds
    useEffect(() => {
        Object.entries(SOUNDS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.load();
            audioElements.current[key] = audio;
        });
    }, []);

    const playSound = useCallback((type) => {
        if (!soundEnabled) return;
        
        // Add Haptic Feedback for Tablets
        if ("vibrate" in navigator) {
            if (type === 'assistance') navigator.vibrate([200, 100, 200]);
            else if (type === 'ready') navigator.vibrate([150, 50, 150]);
            else navigator.vibrate(50);
        }

        const audio = audioElements.current[type];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio blocked:', e));
        }
    }, [soundEnabled]);

    // Assistance Repeat Logic
    useEffect(() => {
        if (hasActiveAssistance && soundEnabled) {
            // Initial play
            playSound('assistance');
            
            // Set repeat interval every 4 seconds
            assistanceInterval.current = setInterval(() => {
                playSound('assistance');
            }, 4000);
        } else {
            if (assistanceInterval.current) {
                clearInterval(assistanceInterval.current);
                assistanceInterval.current = null;
            }
        }

        return () => {
            if (assistanceInterval.current) clearInterval(assistanceInterval.current);
        };
    }, [hasActiveAssistance, soundEnabled, playSound]);

    return { playSound };
};
