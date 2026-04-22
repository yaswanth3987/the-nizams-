import { useEffect, useCallback, useRef } from 'react';
import { useSound } from './useSound';

const SOUNDS = {
    assistance: 'https://assets.mixkit.co/active_storage/sfx/2856/2856-preview.mp3', // Service Bell
    newOrder: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',    // Minimal Bubble/Ping
    ready: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',       // Short Digital Chime
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
