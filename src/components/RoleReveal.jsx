import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import soundManager from '../utils/SoundManager';

const RoleReveal = ({ playerName, role, onNext }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Raja': return '👑';
            case 'Mantri': return '👳';
            case 'Chor': return '🦹';
            case 'Sipahi': return '👮';
            default: return '❓';
        }
    };

    const handleCardClick = () => {
        if (!isRevealed) {
            soundManager.playReveal();
            setIsRevealed(true);
        }
    };

    return (
        <motion.div
            className="reveal-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <h2>{playerName}'s Turn</h2>
            <p>Pass the device to {playerName} and tap the card to reveal your role.</p>

            <div className="card-wrapper">
                <Card
                    title={role}
                    isRevealed={isRevealed}
                    onClick={handleCardClick}
                    icon={getRoleIcon(role)}
                />
            </div>

            {isRevealed && (
                <motion.button
                    className="next-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                        soundManager.playClick();
                        onNext();
                    }}
                >
                    Next Player
                </motion.button>
            )}
        </motion.div>
    );
};

export default RoleReveal;
