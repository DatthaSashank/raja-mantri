import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import soundManager from '../utils/SoundManager';
import { getSessionId } from '../utils/session';
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../utils/constants';
import kingImg from '../assets/king.png';
import queenImg from '../assets/queen.png';
import policeImg from '../assets/police.png';
import thiefImg from '../assets/thief.png';
import ministerImg from '../assets/minister.png';

const Lobby = () => {
    const { socket, isConnected } = useSocket();
    const [playerName, setPlayerName] = useState(localStorage.getItem('rm_playerName') || '');
    const [roomCode, setRoomCode] = useState('');
    const [maxRounds, setMaxRounds] = useState(5);
    const [mode, setMode] = useState('MENU'); // MENU, JOIN, WAITING
    const [error, setError] = useState('');

    useEffect(() => {
        if (!socket) return;

        const handleError = (msg) => {
            setError(msg);
            setMode('MENU');
            soundManager.playFailure();
        };

        socket.on(SOCKET_EVENTS.ERROR, handleError);
        return () => socket.off(SOCKET_EVENTS.ERROR, handleError);
    }, [socket]);

    const handleCreate = () => {
        if (!playerName) { setError('Name Required'); return; }
        if (!socket) { setError('Connection Lost'); return; }

        soundManager.playClick();
        localStorage.setItem('rm_playerName', playerName);
        const sessionId = getSessionId();
        socket.emit(SOCKET_EVENTS.CREATE_ROOM, { playerName, sessionId, maxRounds });
        setMode('WAITING');
    };

    const handleJoin = () => {
        if (!playerName || !roomCode) { setError('Name & Code Required'); return; }
        if (!socket) { setError('Connection Lost'); return; }

        soundManager.playClick();
        localStorage.setItem('rm_playerName', playerName);
        const sessionId = getSessionId();
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: roomCode.toUpperCase(), playerName, sessionId });
        setMode('WAITING');
    };

    useEffect(() => {
        // Particle generation
        const createParticle = () => {
            const p = document.createElement('div');
            p.className = 'particle';
            let size = Math.random() * 4 + 'px';
            p.style.width = size;
            p.style.height = size;
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            p.style.animationDuration = (Math.random() * 10 + 5) + 's';
            p.style.animationDelay = Math.random() * 5 + 's';
            document.body.appendChild(p);

            // Cleanup particle after animation
            setTimeout(() => {
                p.remove();
            }, 15000);
        };

        const interval = setInterval(createParticle, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="center-content relative-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="bg-glow"></div>

            <motion.div
                className="portal-container"
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 10, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 1.5 }}
            >
                <h1 className="game-title">RAJA MANTRI</h1>
                <p className="tagline">The Deception Protocol</p>

                {mode === 'MENU' && (
                    <div className="lobby-menu">
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="IDENTITY TAG (NAME)"
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                autoComplete="off"
                            />
                        </div>

                        <div className="input-box">
                            <select
                                value={maxRounds}
                                onChange={(e) => setMaxRounds(Number(e.target.value))}
                                className="modern-select"
                            >
                                <option value={3}>3 ROUNDS (SPEED)</option>
                                <option value={5}>5 ROUNDS (STANDARD)</option>
                                <option value={10}>10 ROUNDS (LONG)</option>
                            </select>
                        </div>

                        <div className="lobby-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                            <button className="enter-btn" onClick={handleCreate} disabled={!isConnected}>CREATE ROOM</button>
                            <button className="enter-btn secondary-btn" onClick={() => setMode('JOIN')} disabled={!isConnected}>JOIN ROOM</button>
                        </div>
                    </div>
                )}

                {mode === 'JOIN' && (
                    <div className="lobby-menu">
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="IDENTITY TAG (NAME)"
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="SECURITY CODES (ROOM ID)"
                                value={roomCode}
                                onChange={e => setRoomCode(e.target.value)}
                                maxLength={4}
                                autoComplete="off"
                            />
                        </div>
                        <div className="lobby-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                            <button className="enter-btn" onClick={handleJoin} disabled={!isConnected}>ESTABLISH LINK</button>
                            <button className="enter-btn secondary-btn" onClick={() => setMode('MENU')}>ABORT</button>
                        </div>
                    </div>
                )}

                {mode === 'WAITING' && (
                    <div className="waiting-room">
                        <p style={{ color: '#00f2ff', letterSpacing: '2px', margin: '20px 0' }}>ESTABLISHING UPLINK...</p>
                        <div className="dot" style={{ margin: '0 auto' }}></div>
                    </div>
                )}

                {error && <p className="error-message" style={{ color: '#ff4444', marginTop: '1rem', fontFamily: 'Orbitron' }}>⚠ {error}</p>}

                <div className="role-circles">
                    <div className="dot" title="Raja"></div>
                    <div className="dot" title="Mantri" style={{ animationDelay: '0.2s' }}></div>
                    <div className="dot" title="Police" style={{ animationDelay: '0.4s' }}></div>
                    <div className="dot" title="Chor" style={{ animationDelay: '0.6s' }}></div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#ff69b4', letterSpacing: '1px', fontWeight: 'bold' }}>
                    SYSTEM STATUS: <span style={{ color: isConnected ? '#00f2ff' : '#ff4444' }}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Lobby;
