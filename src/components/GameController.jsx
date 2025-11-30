import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import Lobby from './Lobby';
import RoleReveal from './RoleReveal';
import ScoreBoard from './ScoreBoard';
import soundManager from '../utils/SoundManager';
import Card from './Card';

// Connect to server (Environment Variable or Localhost fallback)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const socket = io(SERVER_URL);

const CHAIN_ORDER = ['Raju', 'Rani', 'Manthri', 'Bhatudu', 'Donga'];

const GameController = () => {
    const [room, setRoom] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [notification, setNotification] = useState('');

    useEffect(() => {
        socket.on('connect', () => {
            setPlayerId(socket.id);
        });

        socket.on('room_created', ({ roomCode, state }) => {
            setRoom(state);
        });

        socket.on('state_update', (updatedRoom) => {
            setRoom(updatedRoom);
        });

        socket.on('correct_guess', ({ message }) => {
            soundManager.playSuccess();
            setNotification(message);
            setTimeout(() => setNotification(''), 2000);
        });

        socket.on('wrong_guess', ({ message }) => {
            soundManager.playFailure();
            setNotification(message);
            setTimeout(() => setNotification(''), 2000);
        });

        socket.on('game_started', () => {
            soundManager.playStart();
        });

        return () => {
            socket.off('connect');
            socket.off('room_created');
            socket.off('state_update');
            socket.off('correct_guess');
            socket.off('wrong_guess');
            socket.off('game_started');
        };
    }, []);

    const handleStartGame = () => {
        if (room) {
            socket.emit('start_game', { roomCode: room.code });
        }
    };

    const handleGuess = (targetIndex) => {
        if (room) {
            socket.emit('make_guess', { roomCode: room.code, targetIndex });
        }
    };

    const handleNextRound = () => {
        if (room) {
            socket.emit('next_round', { roomCode: room.code });
        }
    };

    if (!room) {
        return <Lobby socket={socket} serverUrl={SERVER_URL} />;
    }

    // Waiting Room Logic
    if (room.gameState === 'LOBBY') {
        return (
            <div className="setup-container">
                <h2>Mission Control: {room.code}</h2>
                <div className="player-list">
                    {room.players.map((p, i) => (
                        <div key={i} className="player-list-item">
                            {p.name} {p.id === playerId ? '(You)' : ''}
                        </div>
                    ))}
                </div>
                <p>Waiting for crew ({room.players.length}/5)...</p>
                {room.players.length === 5 && room.players[0].id === playerId && (
                    <button className="start-btn" onClick={handleStartGame}>Launch Mission</button>
                )}
            </div>
        );
    }

    // Find My Player Object
    const myPlayer = room.players.find(p => p.id === playerId);
    if (!myPlayer) return <div>Error: Player not found</div>;

    // Role Reveal Phase (Wait, we can just show role on screen now)
    // Or keep a "Reveal" step?
    // Let's keep a Reveal step but it's personal.

    // Actually, let's simplify. If GameState is PLAY, show the board.
    // We can show the role in a corner or have a "Tap to view role" card.

    if (room.gameState === 'RESULT') {
        return <ScoreBoard players={room.players} history={[]} onNextRound={handleNextRound} />;
    }

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

    return (
        <div className="game-controller">
            <div className="status-bar">
                <p>Room: {room.code} | Round: {room.round}</p>
                <p>{room.message}</p>
                {notification && <div className="notification">{notification}</div>}
            </div>

            {/* My Role Card (Private) */}
            <div className="my-role-section">
                <h3>Your Identity</h3>
                <div className="card-wrapper">
                    <Card
                        title={myPlayer.role}
                        isRevealed={true}
                        icon={getRoleIcon(myPlayer.role)}
                        onClick={() => { }} // No action
                    />
                </div>
            </div>

            {/* Other Players Grid */}
            <div className="game-area">
                <h3>Crew Status</h3>
                <div className="players-grid">
                    {room.players.map((p, idx) => {
                        // Logic for visibility
                        // I can see:
                        // 1. Myself (Already shown above, maybe skip here or show as "ME")
                        // 2. Revealed roles (room.revealedRoles[idx])

                        if (p.id === playerId) return null; // Skip self in grid

                        const isRevealed = room.revealedRoles[idx];
                        const currentTurnRole = CHAIN_ORDER[room.chainIndex];
                        const isMyTurn = myPlayer.role === currentTurnRole;
                        const isSelectable = isMyTurn && !isRevealed;

                        return (
                            <motion.div
                                key={idx}
                                className="player-slot"
                                layout
                            >
                                <Card
                                    title={isRevealed ? p.role : "???"}
                                    content={isRevealed ? "" : "Encrypted"}
                                    isRevealed={!!isRevealed}
                                    icon={isRevealed ? getRoleIcon(p.role) : "🔒"}
                                    onClick={() => {
                                        if (isSelectable) handleGuess(idx);
                                    }}
                                />
                                <div className="player-name">{p.name}</div>
                                {p.role === currentTurnRole && <div className="indicator">ACTIVE</div>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GameController;
