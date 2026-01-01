import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lobby from './Lobby';
import RoleReveal from './RoleReveal';
import ScoreBoard from './ScoreBoard';
import soundManager from '../utils/SoundManager';
import Card from './Card';
import { getSessionId, saveRoomCode, getLastRoomCode, clearRoomCode } from '../utils/session';
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS, GAME_STATE, CHAIN_ORDER, ROLES } from '../utils/constants';

const GameController = () => {
    const { socket, socketId } = useSocket();
    const [room, setRoom] = useState(null);
    const [notification, setNotification] = useState('');
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            // Attempt Auto-Reconnect
            const lastRoom = getLastRoomCode();
            if (lastRoom) {
                setIsReconnecting(true);
                const savedName = localStorage.getItem('rm_playerName') || 'Agent';
                const sessionId = getSessionId();
                socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: lastRoom, playerName: savedName, sessionId });
            }
        };

        const handleRoomCreated = ({ roomCode, state }) => {
            setRoom(state);
            saveRoomCode(roomCode);
            setIsReconnecting(false);
        };

        const handleStateUpdate = (updatedRoom) => {
            setRoom(updatedRoom);
            saveRoomCode(updatedRoom.code);
            setIsReconnecting(false);
        };

        const handleError = () => {
            if (isReconnecting) {
                clearRoomCode();
                setIsReconnecting(false);
            }
        };

        const handleCorrectGuess = ({ message }) => {
            soundManager.playSuccess();
            setNotification(message);
            setTimeout(() => setNotification(''), 2000);
        };

        const handleWrongGuess = ({ message }) => {
            soundManager.playFailure();
            setNotification(message);
            setTimeout(() => setNotification(''), 2000);
        };

        const handleGameStarted = () => {
            soundManager.playStart();
        };

        // If socket is already connected when component mounts (e.g. hot reload or navigation)
        if (socket.connected) {
            handleConnect();
        }

        socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
        socket.on(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
        socket.on(SOCKET_EVENTS.STATE_UPDATE, handleStateUpdate);
        socket.on(SOCKET_EVENTS.ERROR, handleError);
        socket.on(SOCKET_EVENTS.CORRECT_GUESS, handleCorrectGuess);
        socket.on(SOCKET_EVENTS.WRONG_GUESS, handleWrongGuess);
        socket.on(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);

        return () => {
            socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
            socket.off(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
            socket.off(SOCKET_EVENTS.STATE_UPDATE, handleStateUpdate);
            socket.off(SOCKET_EVENTS.ERROR, handleError);
            socket.off(SOCKET_EVENTS.CORRECT_GUESS, handleCorrectGuess);
            socket.off(SOCKET_EVENTS.WRONG_GUESS, handleWrongGuess);
            socket.off(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
        };
    }, [socket, isReconnecting]);

    const handleStartGame = () => {
        if (room && socket) {
            socket.emit(SOCKET_EVENTS.START_GAME, { roomCode: room.code });
        }
    };

    const handleGuess = (targetIndex) => {
        if (room && socket) {
            socket.emit(SOCKET_EVENTS.MAKE_GUESS, { roomCode: room.code, targetIndex });
        }
    };

    const handleNextRound = () => {
        if (room && socket) {
            if (room.gameState === GAME_STATE.GAME_OVER) {
                // Reset to Lobby (reload page or clear state)
                // Reloading is safest to clear all state
                window.location.reload();
            } else {
                socket.emit(SOCKET_EVENTS.NEXT_ROUND, { roomCode: room.code });
            }
        }
    };

    const handleExit = () => {
        if (room && socket) {
            if (confirm("Are you sure you want to abort the mission?")) {
                socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode: room.code });
                clearRoomCode();
                window.location.reload();
            }
        }
    };

    if (!socket) return <div>Initializing Comms...</div>;

    if (!room) {
        return (
            <>
                {isReconnecting && <div className="notification">Reconnecting to Mission...</div>}
                <Lobby />
            </>
        );
    }

    // Waiting Room Logic
    if (room.gameState === GAME_STATE.LOBBY) {
        return (
            <div className="setup-container">
                <div className="lobby-header">
                    <h2>Mission Control: {room.code}</h2>
                    <button className="exit-btn" onClick={handleExit} title="Exit Mission">❌</button>
                </div>
                <div className="player-list">
                    {room.players.map((p, i) => (
                        <div key={i} className="player-list-item">
                            {p.name} {p.id === socketId ? '(You)' : ''}
                        </div>
                    ))}
                </div>
                <p>Waiting for crew ({room.players.length}/5)...</p>
                <p>Mission Length: {room.maxRounds} Rounds</p>
                {room.players.length === 5 && room.players[0].id === socketId && (
                    <button className="start-btn" onClick={handleStartGame}>Launch Mission</button>
                )}
            </div>
        );
    }

    // Find My Player Object
    // Use socketId from context which is reliable
    const myPlayer = room.players.find(p => p.id === socketId);

    if (!myPlayer) return <div>Error: Player data sync failure. Refreshing...</div>;

    if (room.gameState === GAME_STATE.RESULT || room.gameState === GAME_STATE.GAME_OVER) {
        return (
            <ScoreBoard
                players={room.players}
                history={[]}
                onNextRound={handleNextRound}
                isGameOver={room.gameState === GAME_STATE.GAME_OVER}
            />
        );
    }

    const getRoleIcon = (role) => {
        switch (role) {
            case ROLES.RAJU: return '👑';
            case ROLES.RANI: return '👸';
            case ROLES.MANTHRI: return '📜';
            case ROLES.BHATUDU: return '🛡️';
            case ROLES.DONGA: return '🦹';
            default: return '❓';
        }
    };

    return (
        <div className="game-controller">
            <div className="status-bar">
                <div className="status-info">
                    <p>Room: {room.code} | Round: {room.round}</p>
                    <p>{room.message}</p>
                </div>
                <button className="exit-btn-small" onClick={handleExit}>Exit</button>
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
                        if (p.id === socketId) return null; // Skip self in grid

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
