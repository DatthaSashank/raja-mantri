import React, { useState } from 'react';
import { motion } from 'framer-motion';
import soundManager from '../utils/SoundManager';
import { getSessionId } from '../utils/session';

const Lobby = ({ socket, onJoin, serverUrl }) => {
    const [playerName, setPlayerName] = useState(localStorage.getItem('rm_playerName') || '');
    const [roomCode, setRoomCode] = useState('');
    const [mode, setMode] = useState('MENU'); // MENU, JOIN, WAITING
    const [error, setError] = useState('');
    const [currentRoom, setCurrentRoom] = useState(null);

    React.useEffect(() => {
        socket.on('error', (msg) => {
            setError(msg);
            setMode('MENU');
            soundManager.playFailure();
        });
        return () => socket.off('error');
    }, [socket]);

    const handleCreate = () => {
        if (!playerName) { setError('Name Required'); return; }
        soundManager.playClick();
        localStorage.setItem('rm_playerName', playerName);
        const sessionId = getSessionId();
        socket.emit('create_room', { playerName, sessionId });
        setMode('WAITING');
    };

    const handleJoin = () => {
        if (!playerName || !roomCode) { setError('Name & Code Required'); return; }
        soundManager.playClick();
        localStorage.setItem('rm_playerName', playerName);
        const sessionId = getSessionId();
        socket.emit('join_room', { roomCode: roomCode.toUpperCase(), playerName, sessionId });
        setMode('WAITING');
    };

    // Listen for room updates handled in parent or here?
    // Better to handle in parent (GameController) or pass down state.
    // For now, let's assume GameController handles the socket events and passes 'room' prop?
    // Or we can listen here for initial connection.

    // Actually, GameController will manage the socket listeners. 
    // This component just emits.

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
                        <button onClick={handleCreate}>Create Mission</button>
                        <button onClick={() => setMode('JOIN')}>Join Mission</button>
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
                        <button onClick={handleJoin}>Connect</button>
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
                Server: {serverUrl}
            </div>
        </motion.div>
    );
};

export default Lobby;
