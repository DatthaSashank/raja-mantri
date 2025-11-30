import React, { useState } from 'react';
import { motion } from 'framer-motion';
import soundManager from '../utils/SoundManager';

const PlayerSetup = ({ onStartGame }) => {
    const [players, setPlayers] = useState(['', '', '', '', '']);
    const [error, setError] = useState('');

    const handleNameChange = (index, value) => {
        const newPlayers = [...players];
        newPlayers[index] = value;
        setPlayers(newPlayers);
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        soundManager.playClick();
        if (players.some(p => p.trim() === '')) {
            setError('Please enter all 5 player names.');
            return;
        }
        onStartGame(players);
    };

    return (
        <motion.div
            className="setup-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h2>Initialize Crew (5 Players)</h2>
            <form onSubmit={handleSubmit} className="player-form">
                {players.map((name, index) => (
                    <div key={index} className="input-group">
                        <label>Crew Member {index + 1}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            placeholder={`Enter Name`}
                            maxLength={15}
                        />
                    </div>
                ))}
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="start-btn">ENGAGE PROTOCOL</button>
            </form>
        </motion.div>
    );
};

export default PlayerSetup;
