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
import kingImg from '../assets/king.png';
import queenImg from '../assets/queen.png';
import ministerImg from '../assets/minister.png';
import policeImg from '../assets/police.png';
import thiefImg from '../assets/thief.png';

const GameController = () => {
    const { socket, socketId } = useSocket();
    const [room, setRoom] = useState(null);
    const [notification, setNotification] = useState('');
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            setIsReconnecting(false);
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
                window.location.reload();
            } else {
                socket.emit(SOCKET_EVENTS.NEXT_ROUND, { roomCode: room.code });
            }
        }
    };

    const handleExit = () => {
        if (room && socket) {
            if (confirm("Are you sure you want to leave the game?")) {
                socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode: room.code });
                clearRoomCode();
                window.location.href = window.location.origin;
            }
        }
    };

    if (!socket) return <div>Initializing Comms...</div>;

    if (!room) {
        return (
            <>
                {isReconnecting && <div className="notification">Rejoining Game...</div>}
                <Lobby />
            </>
        );
    }

    if (room.gameState === GAME_STATE.LOBBY) {
        return (
            <div className="glass-panel">
                <button className="exit-btn-corner" onClick={handleExit} title="Leave Game">EXIT ROOM</button>

                <div className="lobby-header">
                    <h2>Game Room: {room.code}</h2>
                    <button
                        className="enter-btn secondary-btn"
                        onClick={() => {
                            const url = `${window.location.protocol}//${window.location.host}?room=${room.code}`;
                            navigator.clipboard.writeText(url);
                            setNotification("Invite Link Copied!");
                            setTimeout(() => setNotification(''), 2000);
                        }}
                        style={{ marginTop: '10px', fontSize: '0.9rem', padding: '10px' }}
                    >
                        🔗 SHARE INVITE LINK
                    </button>
                </div>
                <div className="player-list">
                    {room.players.map((p, i) => (
                        <div key={i} className="player-list-item">
                            {p.name} {p.id === socketId ? '(You)' : ''}
                        </div>
                    ))}
                </div>
                <p>Waiting for players ({room.players.length}/5)...</p>
                <p>Game Length: {room.maxRounds} Rounds</p>
                {room.players.length === 5 && room.players[0].id === socketId && (
                    <button className="start-btn" onClick={handleStartGame}>Start Game</button>
                )}
            </div>
        );
    }

    // Find My Player Object
    const myPlayer = room.players.find(p => p.id === socketId);
    if (!myPlayer) return <div>Error: Player data sync failure. Refreshing...</div>;

    if (room.gameState === GAME_STATE.RESULT || room.gameState === GAME_STATE.GAME_OVER) {
        return (
            <>
                {/* Keep voice chat active during results */}
                <ScoreBoard
                    players={room.players}
                    history={[]}
                    onNextRound={handleNextRound}
                    isGameOver={room.gameState === GAME_STATE.GAME_OVER}
                />
            </>
        );
    }

    const getRoleIcon = (role) => {
        switch (role) {
            case ROLES.RAJU: return kingImg;
            case ROLES.RANI: return queenImg;
            case ROLES.MANTHRI: return ministerImg;
            case ROLES.BHATUDU: return policeImg;
            case ROLES.DONGA: return thiefImg;
            default: return '❓';
        }
    };

    return (
        <div className="game-mode">
            <div className="game-header glass-panel" style={{ padding: '0.5rem 2rem', borderRadius: '50px', marginBottom: '1rem', width: 'auto' }}>
                <div className="game-title" style={{ fontSize: '1.5rem', margin: 0 }}>RAJA MANTRI</div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ color: '#00f2ff', fontFamily: 'Orbitron' }}>ROOM: {room.code}</div>
                    <button className="modern-btn btn-exit" onClick={handleExit} style={{ padding: '5px 15px', fontSize: '0.8rem' }}>EXIT</button>
                </div>
            </div>

            <div className="status-bar">
                <div className="status-info">
                    <p>Round: {room.round} | {room.message}</p>
                </div>
                {notification && <div className="notification">{notification}</div>}
            </div>

            <div className="game-table">
                {room.players.map((p, idx) => {
                    const isMe = p.id === socketId;
                    const isRevealed = room.revealedRoles[idx] || isMe; // Review my own role always
                    const currentTurnRole = CHAIN_ORDER[room.chainIndex];
                    // Mantri's turn to guess
                    const isMyTurn = myPlayer.role === currentTurnRole;
                    // Can only select others if it's my turn
                    const isSelectable = !isMe && isMyTurn && !isRevealed;

                    // Highlight active player
                    const isActive = p.role === currentTurnRole;

                    return (
                        <motion.div
                            key={idx}
                            className={`player-tile ${isActive ? 'active-turn' : ''}`}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card
                                title={isMe ? `${p.role} (You)` : (isRevealed ? p.role : "???")}
                                content={isRevealed ? "" : "Encrypted"}
                                isRevealed={!!isRevealed}
                                icon={isRevealed ? getRoleIcon(p.role) : "🔒"}
                                isActive={isActive}
                                onClick={() => {
                                    if (isSelectable) handleGuess(idx);
                                }}
                            />
                            <div className="player-info">
                                <span className="player-name">{p.name} {isMe ? '(You)' : ''}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default GameController;
