import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import soundManager from '../utils/SoundManager';

const RoleReveal = ({ playerName, role, onNext }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Raju': return '👑';
            case 'Rani': return '👸';
            case 'Manthri': return '📜';
            case 'Bhatudu': return '🛡️';
            case 'Donga': return '🦹';
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
            <h2>{playerName}'s Identity</h2>
            <p>Pass device to {playerName}. Tap to decrypt role.</p>

            <div className="card-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
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
                    style={{ marginTop: '2rem' }}
                >
                    CONFIRM & NEXT
                </motion.button>
            )}
        </motion.div>
    );
};

export default RoleReveal;
