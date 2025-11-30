import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerSetup from './PlayerSetup';
import RoleReveal from './RoleReveal';
import ScoreBoard from './ScoreBoard';
import soundManager from '../utils/SoundManager';
import Card from './Card';

const ROLES = ['Raju', 'Rani', 'Manthri', 'Bhatudu', 'Donga'];
const SCORES = { Raju: 1000, Rani: 900, Manthri: 800, Bhatudu: 500, Donga: 0 };
const CHAIN_ORDER = ['Raju', 'Rani', 'Manthri', 'Bhatudu', 'Donga'];

const GameController = () => {
    const [gameState, setGameState] = useState('SETUP'); // SETUP, REVEAL, PLAY, RESULT
    const [players, setPlayers] = useState([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [gameHistory, setGameHistory] = useState([]);

    // Game Logic State
    const [chainIndex, setChainIndex] = useState(0); // 0=Raju guessing Rani, etc.
    const [revealedRoles, setRevealedRoles] = useState({}); // { playerId: role }
    const [message, setMessage] = useState('');

    const startGame = (playerNames) => {
        const initialPlayers = playerNames.map(name => ({
            name,
            score: 0,
            totalScore: 0,
            role: null
        }));
        setPlayers(initialPlayers);
        soundManager.playStart();
        startRound(initialPlayers);
    };

    const startRound = (currentPlayers) => {
        const shuffledRoles = [...ROLES].sort(() => Math.random() - 0.5);
        const playersWithRoles = currentPlayers.map((p, i) => ({
            ...p,
            role: shuffledRoles[i],
            score: 0
        }));
        setPlayers(playersWithRoles);
        setCurrentPlayerIndex(0);
        setChainIndex(0);
        setRevealedRoles({});
        setGameState('REVEAL');
    };

    const handleNextReveal = () => {
        if (currentPlayerIndex < 4) {
            setCurrentPlayerIndex(prev => prev + 1);
        } else {
            // All roles revealed privately. Start Game.
            // Reveal Raju immediately.
            const rajuIndex = players.findIndex(p => p.role === 'Raju');
            setRevealedRoles({ [rajuIndex]: 'Raju' });
            setMessage(`Raju (${players[rajuIndex].name}) identified. Target: Rani.`);
            setGameState('PLAY');
        }
    };

    const handleGuess = (targetIndex) => {
        // Current guesser is the player with the role at CHAIN_ORDER[chainIndex]
        const currentRole = CHAIN_ORDER[chainIndex];
        const targetRole = CHAIN_ORDER[chainIndex + 1];

        // Find who currently holds the currentRole (The Guesser)
        const guesserIndex = players.findIndex(p => p.role === currentRole);
        const guesser = players[guesserIndex];
        const target = players[targetIndex];

        if (target.role === targetRole) {
            // Correct Guess
            soundManager.playSuccess();
            const newRevealed = { ...revealedRoles, [targetIndex]: targetRole };
            setRevealedRoles(newRevealed);

            if (chainIndex + 1 === 3) { // Manthri -> Bhatudu (Last guess before Donga auto-reveal)
                // Bhatudu found. Donga is the last one.
                const dongaIndex = players.findIndex(p => p.role === 'Donga');
                setRevealedRoles({ ...newRevealed, [dongaIndex]: 'Donga' });
                finishRound(players);
            } else {
                setChainIndex(prev => prev + 1);
                setMessage(`Correct! ${target.name} is ${targetRole}. Next Target: ${CHAIN_ORDER[chainIndex + 2]}.`);
            }
        } else {
            // Incorrect Guess -> SWAP
            soundManager.playFailure();
            setTimeout(() => {
                soundManager.playSwap();
                performSwap(guesserIndex, targetIndex);
            }, 500);
        }
    };

    const performSwap = (idx1, idx2) => {
        const newPlayers = [...players];
        // Swap roles
        const tempRole = newPlayers[idx1].role;
        newPlayers[idx1].role = newPlayers[idx2].role;
        newPlayers[idx2].role = tempRole;

        setPlayers(newPlayers);
        setMessage(`SWAP INITIATED! ${newPlayers[idx1].name} and ${newPlayers[idx2].name} exchanged roles.`);

        // If one of them was already revealed (the guesser usually is), we might need to update revealedRoles logic?
        // Actually, in this game, the ROLE is revealed, not the player. 
        // Wait, if Raju swaps with someone, the NEW Raju is now revealed? 
        // "The player who is now Raju repeats the guess." -> Yes.
        // So we need to track which *player indices* are revealed? 
        // The prompt says: "Raju Reveal: The player holding the Raju card is automatically revealed."
        // If Raju swaps, the OLD Raju is no longer Raju. The NEW Raju must be revealed.

        // Update revealed roles based on the swap
        // We know CHAIN_ORDER[chainIndex] is the current active role.
        // The player holding it changed.
        // We should re-calculate revealed roles for the active chain.

        // Actually, simpler: The "Revealed" status follows the ROLE in the chain.
        // So we just need to know who holds the revealed roles.

        // Let's just update the message and keep going. The UI will update because it checks `p.role` against `revealedRoles`?
        // No, `revealedRoles` maps Index -> Role. If roles swap, this mapping is invalid.
        // We should map Role -> PlayerIndex instead? Or just re-scan.

        // Let's clear revealedRoles for the swapped players and re-establish the active one.
        // Actually, all previous roles in the chain are "Solved".
        // If a solved role gets swapped... wait, the rules say:
        // "Raju Guesses Rani... Incorrect... Raju and guessed player swap... New Raju repeats."
        // This implies only the current active role (Raju) is swapping.
        // Previous roles (if any) are already locked? 
        // "Rani Guesses Manthri... Incorrect... Rani and guessed player swap."
        // So only the current head of the chain swaps.

        // So we just need to find the new player for the current role and ensure they are revealed.
        const currentRole = CHAIN_ORDER[chainIndex];
        const newGuesserIndex = newPlayers.findIndex(p => p.role === currentRole);

        // We need to update revealedRoles to reflect the new owner of the current role
        // And potentially the previous owners of previous roles if they swapped?
        // Actually, can you swap with a previously revealed player?
        // "Rani selects one of the remaining three secret players".
        // So you never swap with a revealed player. Good.

        // So we just need to update the revealed status for the current role.
        const updatedRevealed = { ...revealedRoles };
        // Remove old index
        delete updatedRevealed[idx1];
        delete updatedRevealed[idx2];
        // Add new index for current role
        updatedRevealed[newGuesserIndex] = currentRole;

        setRevealedRoles(updatedRevealed);
    };

    const finishRound = (finalPlayers) => {
        // Calculate scores
        const scoredPlayers = finalPlayers.map(p => {
            const points = SCORES[p.role];
            return {
                ...p,
                score: points,
                totalScore: p.totalScore + points
            };
        });
        setPlayers(scoredPlayers);
        setGameHistory([...gameHistory, { round, results: scoredPlayers }]);
        setGameState('RESULT');
    };

    const nextRound = () => {
        setRound(prev => prev + 1);
        startRound(players);
    };

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
            {gameState === 'SETUP' && <PlayerSetup onStartGame={startGame} />}

            {gameState === 'REVEAL' && (
                <RoleReveal
                    playerName={players[currentPlayerIndex].name}
                    role={players[currentPlayerIndex].role}
                    onNext={handleNextReveal}
                />
            )}

            {gameState === 'PLAY' && (
                <div className="game-area">
                    <div className="status-bar">
                        <p>{message}</p>
                        <p>Current Mission: <strong>{CHAIN_ORDER[chainIndex]}</strong> finding <strong>{CHAIN_ORDER[chainIndex + 1]}</strong></p>
                    </div>

                    <div className="players-grid">
                        {players.map((p, idx) => {
                            const isRevealed = revealedRoles[idx];
                            const isCurrentGuesser = p.role === CHAIN_ORDER[chainIndex];
                            const isSelectable = !isRevealed && !isCurrentGuesser;

                            return (
                                <motion.div
                                    key={idx}
                                    className="player-slot"
                                    layout
                                    transition={{ type: "spring", stiffness: 40 }}
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
                                    {isCurrentGuesser && <div className="indicator">ACTIVE</div>}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {gameState === 'RESULT' && (
                <ScoreBoard
                    players={players}
                    history={gameHistory}
                    onNextRound={nextRound}
                />
            )}
        </div>
    );
};

export default GameController;
