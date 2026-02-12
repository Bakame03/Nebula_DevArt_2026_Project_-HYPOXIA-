"use client";
import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useStore } from '@/store/useStore';

export default function SoundManager() {
  const { stressLevel } = useStore();
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    // ⚠️ IMPORTANT: DEV 4 DOIT METTRE UN FICHIER 'breathing.mp3' DANS /public/sounds/
    soundRef.current = new Howl({
      src: ['/sounds/breathing.mp3'], 
      loop: true,
      volume: 0.2,
      rate: 1.0,
      html5: true, // Force HTML5 Audio pour éviter les problèmes de chargement
    });
    
    // On lance le son au premier clic utilisateur (politique navigateur)
    const startAudio = () => {
        if (soundRef.current && !soundRef.current.playing()) {
            soundRef.current.play();
        }
    };
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);

    return () => { 
        window.removeEventListener('click', startAudio);
        window.removeEventListener('keydown', startAudio);
        soundRef.current?.unload(); 
    };
  }, []);

  useEffect(() => {
    if (soundRef.current) {
      // Accélération cardiaque
      const newRate = 1.0 + (stressLevel * 1.5); 
      soundRef.current.rate(newRate);
      soundRef.current.volume(0.2 + (stressLevel * 0.8));
    }
  }, [stressLevel]);

  return null;
}
