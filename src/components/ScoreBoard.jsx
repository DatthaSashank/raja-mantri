import React from 'react';
import { motion } from 'framer-motion';

const ScoreBoard = ({ players, history, onNextRound, isGameOver }) => {
    // Sort players by total score for display if game over
    const sortedPlayers = isGameOver
        ? [...players].sort((a, b) => b.totalScore - a.totalScore)
        : players;

    return (
        <motion.div
            className="scoreboard-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2>{isGameOver ? "Game Over - Final Report" : "Round Results"}</h2>

            <div className="results-table">
                <div className="table-header">
                    <span>Player</span>
                    <span>Role</span>
                    <span>Round Score</span>
                    <span>Total Score</span>
                </div>
                {sortedPlayers.map((player, index) => (
                    <div key={index} className={`table-row ${isGameOver && index === 0 ? 'winner-row' : ''}`}>
                        <span>
                            {isGameOver && index === 0 && '🏆 '}
                            {player.name}
                        </span>
                        <span className="role-reveal">{player.role}</span>
                        <span>{player.score}</span>
                        <span className="total-score">{player.totalScore}</span>
                    </div>
                ))}
            </div>

            <button className="next-round-btn" onClick={onNextRound}>
                {isGameOver ? "Return to Lobby" : "Next Round"}
            </button>

            <div className="history-section">
                <h3>Game History</h3>
                <div className="history-list">
                    {history.map((roundData, idx) => (
                        <div key={idx} className="history-item">
                            <strong>Round {roundData.round}</strong>
                            {roundData.results.map(p => (
                                <span key={p.name} className="mini-score">
                                    {p.name}: {p.totalScore}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default ScoreBoard;
