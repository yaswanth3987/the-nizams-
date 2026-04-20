import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SoundContext } from './SoundContextDefinition';

const SOUND_MAP = {
    newOrder: '/sounds/new-order.mp3',
    ready: '/sounds/ready.mp3',
    assistance: '/sounds/assistance.mp3'
};

export function SoundProvider({ children }) {
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('nizam_sound_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        localStorage.setItem('nizam_sound_enabled', JSON.stringify(soundEnabled));
    }, [soundEnabled]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60000); // Pulse every minute
        return () => clearInterval(timer);
    }, []);

    const playSound = useCallback((type) => {
        if (!soundEnabled) return;
        const audioPath = SOUND_MAP[type];
        if (!audioPath) return;
        const audio = new Audio(audioPath);
        audio.play().catch(() => {});
    }, [soundEnabled]);

    const getWaitTime = useCallback((session) => {
        if (!session.prepStartedAt || !session.prepTime) return 0;
        const start = new Date(session.prepStartedAt).getTime();
        const durationMs = session.prepTime * 60000;
        const elapsed = now - start;
        const remainingMs = durationMs - elapsed;
        return Math.max(0, Math.ceil(remainingMs / 60000));
    }, [now]);

    const toggleSound = () => setSoundEnabled(prev => !prev);

    const value = useMemo(() => ({ playSound, soundEnabled, toggleSound, getWaitTime }), [playSound, soundEnabled, getWaitTime]);

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
}


