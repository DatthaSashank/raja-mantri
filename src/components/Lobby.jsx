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
        socket.emit(SOCKET_EVENTS.CREATE_ROOM, { playerName, sessionId });
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
            className="setup-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <h2>Zero-G Uplink</h2>

            {mode === 'MENU' && (
                <div className="lobby-menu">
                    <input
                        type="text"
                        placeholder="Enter Codename"
                        value={playerName}
                        onChange={e => setPlayerName(e.target.value)}
                        className="lobby-input"
                    />
                    <div className="lobby-actions">
                        <button onClick={handleCreate} disabled={!isConnected}>Create Mission</button>
                        <button onClick={() => setMode('JOIN')} disabled={!isConnected}>Join Mission</button>
                    </div>
                </div>
            )}

            {mode === 'JOIN' && (
                <div className="lobby-menu">
                    <input
                        type="text"
                        placeholder="Enter Codename"
                        value={playerName}
                        onChange={e => setPlayerName(e.target.value)}
                        className="lobby-input"
                    />
                    <input
                        type="text"
                        placeholder="Mission Code (4 Chars)"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value)}
                        className="lobby-input"
                        maxLength={4}
                    />
                    <div className="lobby-actions">
                        <button onClick={handleJoin} disabled={!isConnected}>Connect</button>
                        <button onClick={() => setMode('MENU')} className="secondary-btn">Back</button>
                    </div>
                </div>
            )}

            {mode === 'WAITING' && (
                <div className="waiting-room">
                    <p>Connecting to Satellite...</p>
                    {/* Parent component will switch view when room is joined */}
                </div>
            )}

            {error && <p className="error-message">{error}</p>}
            <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#555' }}>
                Status: {isConnected ? 'Online' : 'Offline'}
            </div>
        </motion.div>
    );
};

export default Lobby;
