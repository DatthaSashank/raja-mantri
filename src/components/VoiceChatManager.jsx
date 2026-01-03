import React, { useEffect, useState, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '../context/SocketContext';
import { Mic, MicOff } from 'lucide-react';

const VoiceChatManager = ({ roomCode }) => {
    const { socket, socketId } = useSocket();
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const peersRef = useRef([]); // Keep track of peer objects { peerID, peer }

    useEffect(() => {
        // 1. Get User Media
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then(currentStream => {
                setStream(currentStream);

                // 2. Listen for 'all_users' to initiate calls
                // This event is sent by server immediately after we join/reconnect
                socket.on("all_users", (users) => {
                    // Filter out self just in case, though server does it
                    const peersList = [];
                    users.forEach(user => {
                        const peer = createPeer(user.id, socketId, currentStream);
                        peersRef.current.push({
                            peerID: user.id,
                            peer,
                        });
                        peersList.push({
                            peerID: user.id,
                            peer,
                        });
                    });
                    setPeers(peersList);
                });

                // 3. Listen for incoming signals (someone else joined and is calling us)
                socket.on("user_joined_signal", payload => {
                    const peer = addPeer(payload.signal, payload.callerID, currentStream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    });
                    setPeers(prev => [...prev, { peerID: payload.callerID, peer }]);
                });

                // 4. Listen for returned signals (answer to our offer)
                socket.on("receiving_returned_signal", payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                });
            })
            .catch(err => {
                console.error("Voice Chat Error:", err);
                alert("Could not access microphone. Voice chat disabled.");
            });

        return () => {
            // Cleanup handled by dependency unmounting, but we should destroy peers
            // However, strictly unmounting might kill the stream.
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomCode]); // Re-run if room changes? mostly just on mount

    function createPeer(userToSignal, callerID, stream) {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.emit("sending_signal", { userToSignal, callerID, signal });
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.emit("returning_signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="voice-controls" style={{ position: 'fixed', top: '30px', left: '100px', zIndex: 1000 }}>
            <button
                className="mute-btn"
                onClick={toggleMute}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
                style={{
                    left: '90px', // Position next to the Sound button (30px + 50px width + 10px gap)
                    background: isMuted ? 'rgba(255, 68, 68, 0.2)' : 'rgba(0,0,0,0.5)',
                    borderColor: isMuted ? '#ff4444' : 'var(--neon-gold)',
                    color: isMuted ? '#ff4444' : 'var(--neon-gold)'
                }}
            >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Render Audio Elements for Peers */}
            {peers.map((p, index) => {
                return (
                    <AudioPlayer key={p.peerID} peer={p.peer} />
                );
            })}
        </div>
    );
};

const AudioPlayer = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        });
    }, [peer]);

    return (
        <audio playsInline autoPlay ref={ref} />
    );
};

export default VoiceChatManager;
