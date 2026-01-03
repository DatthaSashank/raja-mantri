import React, { useState, useEffect } from 'react';
import GameController from './components/GameController';
import Lobby from './components/Lobby';
import soundManager from './utils/SoundManager';
import { Volume2, VolumeX } from 'lucide-react';
import { useSocket } from './context/SocketContext';
import { getSessionId, saveRoomCode, clearRoomCode } from './utils/session';
import { SOCKET_EVENTS, GAME_STATE } from './utils/constants';

import VoiceChatManager from './components/VoiceChatManager';

function App() {
  const { socket } = useSocket();
  const [isMuted, setIsMuted] = useState(false);
  const [room, setRoom] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

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

    if (socket.connected) {
      handleConnect();
    }

    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
    socket.on(SOCKET_EVENTS.STATE_UPDATE, handleStateUpdate);
    socket.on(SOCKET_EVENTS.ERROR, handleError);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
      socket.off(SOCKET_EVENTS.STATE_UPDATE, handleStateUpdate);
      socket.off(SOCKET_EVENTS.ERROR, handleError);
    };
  }, [socket, isReconnecting]);

  const handleExit = () => {
    if (room && socket) {
      if (confirm("Are you sure you want to leave the game?")) {
        socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode: room.code });
        clearRoomCode();
        setRoom(null);
        window.location.href = window.location.origin;
      }
    }
  };

  return (
    <div className="app-container">
      <button
        className="mute-btn"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX /> : <Volume2 />}
      </button>

      <VoiceChatManager />

      {room && (
        <button
          className="exit-btn-corner"
          onClick={handleExit}
          title="Leave Game"
          style={{ position: 'fixed', top: '30px', right: '30px', zIndex: 1000 }}
        >
          EXIT ROOM
        </button>
      )}

      {/* Render logic: If no room, show Lobby. If room, show GameController (which handles Game LOBBY, PLAY, RESULT) */}
      {!room ? (
        <>
          {isReconnecting && <div className="notification">Rejoining Game...</div>}
          <Lobby />
        </>
      ) : (
        <GameController room={room} setRoom={setRoom} />
      )}
    </div>
  );
}

export default App;
