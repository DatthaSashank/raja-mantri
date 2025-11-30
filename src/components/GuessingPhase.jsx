import React from 'react';
import { motion } from 'framer-motion';

const GuessingPhase = ({ players, onGuess }) => {
    const mantri = players.find(p => p.role === 'Mantri');
    const others = players.filter(p => p.role !== 'Mantri' && p.role !== 'Raja');

    return (
        <motion.div
            className="guessing-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <h2>Mantri's Challenge</h2>
            <p className="instruction">
                <strong>{mantri.name} (Mantri)</strong>, identify the Chor!
            </p>

            <div className="suspects-grid">
                {others.map((player, index) => (
                    <motion.div
                        key={index}
                        className="suspect-card"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onGuess(players.indexOf(player))}
                    >
                        <div className="avatar">👤</div>
                        <h3>{player.name}</h3>
                        <p>Tap to Accuse</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default GuessingPhase;
