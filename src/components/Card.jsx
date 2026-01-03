import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import soundManager from '../utils/SoundManager';

const Card = ({ title, content, isRevealed, onClick, icon, isActive }) => {
    const handleClick = () => {
        if (!isRevealed && title !== 'Revealed') {
            soundManager.playFlip();
            onClick();
        }
    };

    return (
        <div className="card-container" onClick={handleClick}>
            <motion.div
                className="card-inner"
                initial={false}
                animate={{
                    rotateY: isRevealed ? 180 : 0,
                    scale: isActive ? 1.05 : 1
                }}
                transition={{
                    rotateY: { duration: 0.6, type: "spring", stiffness: 60, damping: 12 },
                    scale: { duration: 0.3 }
                }}
                whileHover={{ scale: isRevealed ? 1 : 1.05, rotateZ: isRevealed ? 0 : 2 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className="card-front">
                    <div className="card-pattern">
                        <span className="holo-icon" style={{ fontSize: '3rem' }}>❓</span>
                    </div>
                </div>
                <div className="card-back">
                    <div className="card-content" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence>
                            {isRevealed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    {typeof icon === 'string' && (icon.includes('/') || icon.includes('.png')) ? (
                                        <img src={icon} alt={title} className="card-image" />
                                    ) : (
                                        <span className="role-icon">{icon}</span>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
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
