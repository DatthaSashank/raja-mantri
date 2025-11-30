import React from 'react';
import { motion } from 'framer-motion';
import soundManager from '../utils/SoundManager';

const Card = ({ title, content, isRevealed, onClick, icon }) => {
    const handleClick = () => {
        soundManager.playFlip();
        onClick();
    };

    return (
        <div className="card-container" onClick={handleClick}>
            <motion.div
                className="card-inner"
                initial={false}
                animate={{ rotateY: isRevealed ? 180 : 0 }}
                transition={{ duration: 0.6, animationDirection: 'normal' }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className="card-front">
                    <div className="card-pattern">
                        <span className="royal-emblem">⚜️</span>
                        <h3>Tap to Reveal</h3>
                    </div>
                </div>
                <div className="card-back">
                    <div className="card-content">
                        <span className="role-icon">{icon}</span>
                        <h3>{title}</h3>
                        {content && <p>{content}</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Card;
