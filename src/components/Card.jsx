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
                transition={{ duration: 0.6, type: "spring", stiffness: 50 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className="card-front">
                    <div className="card-pattern">
                        <span className="holo-icon" style={{ fontSize: '3rem' }}>🔍</span>
                    </div>
                </div>
                <div className="card-back">
                    <div className="card-content" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {typeof icon === 'string' && (icon.includes('/') || icon.includes('.png')) ? (
                            <img src={icon} alt={title} className="card-image" />
                        ) : (
                            <span className="role-icon">{icon}</span>
                        )}
                        <div className="card-role-title">
                            {title}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Card;
