import React, { useState, useEffect } from 'react';
import PlayerSetup from './PlayerSetup';
import RoleReveal from './RoleReveal';
import GuessingPhase from './GuessingPhase';
import ScoreBoard from './ScoreBoard';
import soundManager from '../utils/SoundManager';

const ROLES = ['Raja', 'Mantri', 'Chor', 'Sipahi'];
const SCORES = { Raja: 1000, Mantri: 800, Sipahi: 500, Chor: 0 };

const GameController = () => {
    const [gameState, setGameState] = useState('SETUP'); // SETUP, REVEAL, GUESS, RESULT
    const [players, setPlayers] = useState([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [gameHistory, setGameHistory] = useState([]);

    const startGame = (playerNames) => {
        const initialPlayers = playerNames.map(name => ({
            name,
            score: 0,
            role: null,
            totalScore: 0
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
        setGameState('REVEAL');
    };

    const handleNextPlayer = () => {
        if (currentPlayerIndex < 3) {
            setCurrentPlayerIndex(prev => prev + 1);
        } else {
            setGameState('GUESS');
        }
    };

    const handleGuess = (guessedPlayerId) => {
        const isCorrect = players[guessedPlayerId].role === 'Chor';

        if (isCorrect) {
            soundManager.playSuccess();
        } else {
            soundManager.playFailure();
        }

        const updatedPlayers = players.map(p => {
            let roundScore = 0;
            if (p.role === 'Raja') roundScore = 1000;
            if (p.role === 'Sipahi') roundScore = 500;

            if (p.role === 'Mantri') {
                roundScore = isCorrect ? 800 : 0;
            }
            if (p.role === 'Chor') {
                roundScore = isCorrect ? 0 : 800;
            }
            return { ...p, score: roundScore, totalScore: p.totalScore + roundScore };
        });

        setPlayers(updatedPlayers);
        setGameHistory([...gameHistory, { round, results: updatedPlayers }]);
        setGameState('RESULT');
    };

    const nextRound = () => {
        setRound(prev => prev + 1);
        startRound(players);
    };

    return (
        <div className="game-controller">
            {gameState === 'SETUP' && <PlayerSetup onStartGame={startGame} />}

            {gameState === 'REVEAL' && (
                <RoleReveal
                    playerName={players[currentPlayerIndex].name}
                    role={players[currentPlayerIndex].role}
                    onNext={handleNextPlayer}
                />
            )}

            {gameState === 'GUESS' && (
                <GuessingPhase
                    players={players}
                    onGuess={handleGuess}
                />
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
