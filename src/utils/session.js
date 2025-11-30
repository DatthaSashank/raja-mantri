export const getSessionId = () => {
    let sessionId = localStorage.getItem('rm_sessionId');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('rm_sessionId', sessionId);
    }
    return sessionId;
};

export const saveRoomCode = (code) => {
    localStorage.setItem('rm_lastRoom', code);
};

export const getLastRoomCode = () => {
    return localStorage.getItem('rm_lastRoom');
};

export const clearRoomCode = () => {
    localStorage.removeItem('rm_lastRoom');
};
