import React, { createContext, useContext, useState, useEffect } from 'react';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('nizam_sound_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('nizam_sound_enabled', JSON.stringify(soundEnabled));
    }, [soundEnabled]);

    const toggleSound = () => setSoundEnabled(prev => !prev);

    return (
        <SoundContext.Provider value={{ soundEnabled, toggleSound }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
