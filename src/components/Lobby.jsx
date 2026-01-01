import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import soundManager from '../utils/SoundManager';
import { getSessionId } from '../utils/session';
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../utils/constants';

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

    return (
        <motion.div
            className="center-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="glass-panel">
                <h2>Raja Mantri</h2>

                {mode === 'MENU' && (
                    <div className="lobby-menu">
                        <input
                            type="text"
                            placeholder="ENTER NAME"
                            value={playerName}
                            onChange={e => setPlayerName(e.target.value)}
                            className="lobby-input"
                        />

                        <div className="rounds-selector">
                            <label>GAME DURATION</label>
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

                        <div className="lobby-actions">
                            <button onClick={handleCreate} disabled={!isConnected}>CREATE</button>
                            <button onClick={() => setMode('JOIN')} disabled={!isConnected} className="secondary-btn">JOIN</button>
                        </div>
                    </div>
                )}

                {mode === 'JOIN' && (
                    <div className="lobby-menu">
                        <input
                            type="text"
                            placeholder="ENTER NAME"
                            value={playerName}
                            onChange={e => setPlayerName(e.target.value)}
                            className="lobby-input"
                        />
                        <input
                            type="text"
                            placeholder="GAME CODE"
                            value={roomCode}
                            onChange={e => setRoomCode(e.target.value)}
                            className="lobby-input"
                            maxLength={4}
                        />
                        <div className="lobby-actions">
                            <button onClick={handleJoin} disabled={!isConnected}>CONNECT</button>
                            <button onClick={() => setMode('MENU')} className="secondary-btn">BACK</button>
                        </div>
                    </div>
                )}

                {mode === 'WAITING' && (
                    <div className="waiting-room">
                        <p>ESTABLISHING UPLINK...</p>
                        {/* Parent component will switch view when room is joined */}
                    </div>
                )}

                {error && <p className="error-message" style={{ color: 'var(--neon-pink)', marginTop: '1rem' }}>{error}</p>}
                <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#555', letterSpacing: '1px' }}>
                    SYSTEM STATUS: <span style={{ color: isConnected ? 'var(--neon-cyan)' : 'var(--neon-pink)' }}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default Lobby;
