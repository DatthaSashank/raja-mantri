export const ROLES = {
    RAJU: 'Raju',
    RANI: 'Rani',
    MANTHRI: 'Manthri',
    BHATUDU: 'Bhatudu',
    DONGA: 'Donga'
};

export const CHAIN_ORDER = [ROLES.RAJU, ROLES.RANI, ROLES.MANTHRI, ROLES.BHATUDU, ROLES.DONGA];

export const GAME_STATE = {
    LOBBY: 'LOBBY',
    PLAYING: 'PLAYING',
    RESULT: 'RESULT',
    GAME_OVER: 'GAME_OVER'
};

export const SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    CREATE_ROOM: 'create_room',
    JOIN_ROOM: 'join_room',
    ROOM_CREATED: 'room_created',
    STATE_UPDATE: 'state_update',
    START_GAME: 'start_game',
    GAME_STARTED: 'game_started',
    MAKE_GUESS: 'make_guess',
    CORRECT_GUESS: 'correct_guess',
    WRONG_GUESS: 'wrong_guess',
    NEXT_ROUND: 'next_round',
    LEAVE_ROOM: 'leave_room'
};
