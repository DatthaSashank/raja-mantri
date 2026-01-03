/* eslint-env node */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (dev)
        methods: ["GET", "POST"]
    }
});

// Game Constants
const ROLES = ['Raju', 'Rani', 'Manthri', 'Bhatudu', 'Donga'];
const SCORES = { Raju: 1000, Rani: 900, Manthri: 800, Bhatudu: 500, Donga: 0 };
const CHAIN_ORDER = ['Raju', 'Rani', 'Manthri', 'Bhatudu', 'Donga'];

// State
const rooms = {}; // { roomCode: { players: [], gameState: 'LOBBY', ... } }

const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', ({ playerName, sessionId, maxRounds }) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            code: roomCode,
            players: [{
                id: socket.id,
                sessionId, // Store stable ID
                name: playerName,
                score: 0,
                totalScore: 0,
                role: null
            }],
            gameState: 'LOBBY',
            chainIndex: 0,
            revealedRoles: {},
            message: 'Waiting for players...',
            round: 1,
            maxRounds: maxRounds || 5 // Default to 5 rounds
        };
        socket.join(roomCode);
        socket.emit('room_created', { roomCode, state: rooms[roomCode] });
    });

    socket.on('join_room', ({ roomCode, playerName, sessionId }) => {
        const room = rooms[roomCode];
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        // Check for Reconnection
        const existingPlayer = room.players.find(p => p.sessionId === sessionId);

        if (existingPlayer) {
            // RECONNECTION LOGIC
            existingPlayer.id = socket.id; // Update socket ID
            socket.join(roomCode);
            io.to(roomCode).emit('state_update', room);
            // Send existing users to the reconnected user for voice connection
            socket.emit('all_users', room.players.filter(p => p.id !== socket.id));
            console.log(`Player ${existingPlayer.name} reconnected to ${roomCode}`);
        } else if (room.gameState === 'LOBBY' && room.players.length < 5) {
            // NEW PLAYER JOIN
            const newPlayer = {
                id: socket.id,
                sessionId,
                name: playerName,
                score: 0,
                totalScore: 0,
                role: null
            };
            room.players.push(newPlayer);
            socket.join(roomCode);
            io.to(roomCode).emit('state_update', room);

            // Notify others that a new user has joined (so they can expect a signal? No, we use all_users for the joiner to initiatie)
            // actually, typical mesh: 
            // 1. Joiner gets list of all users -> Initiates call to each.
            // 2. Existing users receive 'sending_signal' and return answer.

            // Send list of *other* players to the new joiner
            const otherPlayers = room.players.filter(p => p.id !== socket.id);
            socket.emit('all_users', otherPlayers);

            // Also notify others explicitly if needed, but 'state_update' handles UI. Voice relies on signaling.
        } else {
            socket.emit('error', 'Room full or game in progress');
        }
    });

    socket.on('sending_signal', payload => {
        io.to(payload.userToSignal).emit('user_joined_signal', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on('returning_signal', payload => {
        io.to(payload.callerID).emit('receiving_returned_signal', { signal: payload.signal, id: socket.id });
    });


    socket.on('start_game', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (room && room.players.length === 5) {
            startRound(room);
            io.to(roomCode).emit('state_update', room);
        }
    });

    socket.on('make_guess', ({ roomCode, targetIndex }) => {
        const room = rooms[roomCode];
        if (!room || room.gameState !== 'PLAY') return;

        const currentRole = CHAIN_ORDER[room.chainIndex];
        const targetRole = CHAIN_ORDER[room.chainIndex + 1];

        // Find guesser (current role holder)
        const guesserIndex = room.players.findIndex(p => p.role === currentRole);
        const guesser = room.players[guesserIndex];

        // Validate that the requester is indeed the guesser
        if (guesser.id !== socket.id) return;

        const target = room.players[targetIndex];

        if (target.role === targetRole) {
            // Correct
            room.revealedRoles[targetIndex] = targetRole;

            if (room.chainIndex + 1 === 3) { // Manthri found Bhatudu -> Donga left
                const dongaIndex = room.players.findIndex(p => p.role === 'Donga');
                room.revealedRoles[dongaIndex] = 'Donga';
                finishRound(room);
            } else {
                room.chainIndex++;
                room.message = `Correct! ${target.name} is ${targetRole}. Next: ${CHAIN_ORDER[room.chainIndex]} -> ${CHAIN_ORDER[room.chainIndex + 1]}`;
            }
            io.to(roomCode).emit('correct_guess', { message: 'Correct!' });
        } else {
            // Incorrect -> Swap
            io.to(roomCode).emit('wrong_guess', { message: 'Incorrect! Swapping...' });

            // Perform Swap Logic
            const tempRole = room.players[guesserIndex].role;
            room.players[guesserIndex].role = room.players[targetIndex].role;
            room.players[targetIndex].role = tempRole;

            // Update revealed roles mapping if necessary?
            // In this game, the ROLE is what matters for the chain.
            // The player holding the role changes.
            // We need to ensure the NEW holder of the current role is revealed if the role was already revealed.
            // Raju is always revealed. So if Raju swaps, new Raju is revealed.
            // If Rani (revealed) swaps, new Rani is revealed.
            // So we basically rebuild revealedRoles based on the chain progress.

            rebuildRevealedRoles(room);

            room.message = `SWAP! ${guesser.name} and ${target.name} exchanged roles.`;
        }

        io.to(roomCode).emit('state_update', room);
    });

    socket.on('next_round', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (room) {
            if (room.round < room.maxRounds) {
                room.round++;
                startRound(room);
            } else {
                room.gameState = 'GAME_OVER';
                room.message = 'Game Over! Final Results.';
            }
            io.to(roomCode).emit('state_update', room);
        }
    });

    socket.on('leave_room', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (room) {
            // Remove player
            room.players = room.players.filter(p => p.id !== socket.id);
            socket.leave(roomCode);

            if (room.players.length === 0) {
                delete rooms[roomCode];
                console.log(`Room ${roomCode} deleted (empty)`);
            } else {
                // If game was in progress, reset to LOBBY because we need 5 players
                if (room.gameState !== 'LOBBY') {
                    room.gameState = 'LOBBY';
                    room.round = 1;
                    room.chainIndex = 0;
                    room.revealedRoles = {};
                    room.players.forEach(p => {
                        p.score = 0;
                        p.totalScore = 0;
                        p.role = null;
                    });
                    room.message = 'Mission Aborted. Player left. Waiting for crew...';
                }
                io.to(roomCode).emit('state_update', room);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // We could handle auto-leave here, but for now we rely on explicit leave 
        // or reconnection logic. If we want auto-leave on disconnect, we'd need 
        // to map socket.id to roomCode.
    });
});

function startRound(room) {
    const shuffledRoles = [...ROLES].sort(() => Math.random() - 0.5);
    room.players.forEach((p, i) => {
        p.role = shuffledRoles[i];
        p.score = 0;
    });
    room.gameState = 'PLAY';
    room.chainIndex = 0;
    room.revealedRoles = {};

    // Reveal Raju
    const rajuIndex = room.players.findIndex(p => p.role === 'Raju');
    room.revealedRoles[rajuIndex] = 'Raju';
    room.message = `Mission Start. Raju (${room.players[rajuIndex].name}) identified. Find Rani.`;
}

function rebuildRevealedRoles(room) {
    // Clear and re-establish revealed roles based on chain progress
    room.revealedRoles = {};

    // Raju is always revealed
    const rajuIndex = room.players.findIndex(p => p.role === 'Raju');
    room.revealedRoles[rajuIndex] = 'Raju';

    // Reveal others up to current chain index
    for (let i = 0; i < room.chainIndex; i++) {
        const role = CHAIN_ORDER[i + 1]; // Rani, Manthri...
        const idx = room.players.findIndex(p => p.role === role);
        room.revealedRoles[idx] = role;
    }
}

function finishRound(room) {
    room.players.forEach(p => {
        const points = SCORES[p.role];
        p.score = points;
        p.totalScore += points;
    });
    room.gameState = 'RESULT';
    room.message = 'Mission Complete. Check scores.';
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
