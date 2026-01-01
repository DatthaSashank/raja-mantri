import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_EVENTS } from '../utils/constants';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    // Initialize socket once
    const [socket] = useState(() => {
        const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
        return io(SERVER_URL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    });

    const [isConnected, setIsConnected] = useState(false);
    const [socketId, setSocketId] = useState(null);

    useEffect(() => {
        if (!socket) return;

        const onConnect = () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
            setSocketId(socket.id);
        };

        const onDisconnect = () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on(SOCKET_EVENTS.CONNECT, onConnect);
        socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);

        return () => {
            socket.off(SOCKET_EVENTS.CONNECT, onConnect);
            socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
            // Do not disconnect here if we want to persist across re-renders of Provider (though Provider usually sits at top)
            // But if Provider unmounts, we should disconnect.
            socket.disconnect();
        };
    }, [socket]);

    const value = {
        socket,
        isConnected,
        socketId
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
