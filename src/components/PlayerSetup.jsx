import React, { useState } from 'react';
import { motion } from 'framer-motion';
import soundManager from '../utils/SoundManager';

const PlayerSetup = ({ onStartGame }) => {
    const [players, setPlayers] = useState(['', '', '', '']);
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
            setError('Please enter all 4 player names.');
            return;
        }
        onStartGame(players);
    };

    return (
        <motion.div
            className="setup-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2>Enter Player Names</h2>
            <form onSubmit={handleSubmit} className="player-form">
                {players.map((name, index) => (
                    <div key={index} className="input-group">
                        <label>Player {index + 1}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            placeholder={`Enter name for Player ${index + 1}`}
                            maxLength={15}
                        />
                    </div>
                ))}
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="start-btn">Start Game</button>
            </form>
        </motion.div>
    );
};

export default PlayerSetup;
