import React, { useState } from 'react';
import GameController from './components/GameController';
import soundManager from './utils/SoundManager';
import { Volume2, VolumeX } from 'lucide-react';

function App() {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="app-container">
      <button
        className="mute-btn"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX /> : <Volume2 />}
      </button>
      <h1>Raju Mantri: Zero-G Heist</h1>
      <GameController />
    </div>
  );
}

export default App;
