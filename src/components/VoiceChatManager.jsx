import { Buffer } from 'buffer';

// Polyfill Buffer for simple-peer
if (!window.Buffer) {
    window.Buffer = Buffer;
}

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
                // alert("Could not access microphone. Voice chat disabled."); 
                // Alert removed to avoid annoyance if they just deny it
            });

        return () => {
            // Cleanup: Remove listeners and destroy peers
            socket.off("all_users");
            socket.off("user_joined_signal");
            socket.off("receiving_returned_signal");

            peersRef.current.forEach(({ peer }) => {
                if (peer) peer.destroy();
            });
            peersRef.current = [];
            setPeers([]);

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomCode]); // Re-run if room changes

    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    };

    function createPeer(userToSignal, callerID, stream) {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
            config: rtcConfig
        });

        peer.on("signal", signal => {
            console.log("VC: Sending Signal", { userToSignal, callerID });
            socket.emit("sending_signal", { userToSignal, callerID, signal });
        });

        peer.on("connect", () => console.log("VC: Peer Connected!"));
        peer.on("error", err => console.error("VC: Peer Error", err));

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream,
            config: rtcConfig
        });

        peer.on("signal", signal => {
            console.log("VC: Returning Signal", { callerID });
            socket.emit("returning_signal", { signal, callerID });
        });

        peer.on("connect", () => console.log("VC: Peer Connected!"));
        peer.on("error", err => console.error("VC: Peer Error", err));

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
        <>
            <button
                className="mute-btn"
                onClick={toggleMute}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
                style={{
                    position: 'absolute',
                    top: '30px',
                    left: '90px', // Position next to the Sound button (30px + 50px width + 10px gap)
                    background: isMuted ? 'rgba(255, 68, 68, 0.2)' : 'rgba(0,0,0,0.5)',
                    borderColor: isMuted ? '#ff4444' : 'var(--neon-gold)',
                    color: isMuted ? '#ff4444' : 'var(--neon-gold)',
                    zIndex: 1000
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
        </>
    );
};

const AudioPlayer = ({ peer }) => {
    const ref = useRef();
    const [volume, setVolume] = useState(0);

    useEffect(() => {
        const handleStream = (stream) => {
            console.log("VC: Received Remote Stream ID:", stream.id);
            if (ref.current) {
                ref.current.srcObject = stream;

                // Attempt to play
                ref.current.play().catch(e => console.error("VC: Play failed (Autoplay limit?):", e));

                // Visualize Audio
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaStreamSource(stream);
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);

                    const updateVolume = () => {
                        analyser.getByteFrequencyData(dataArray);
                        // Get average volume
                        const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                        setVolume(avg);
                        requestAnimationFrame(updateVolume);
                    };
                    updateVolume();
                } catch (err) {
                    console.error("VC: AudioContext Error", err);
                }
            }
        };

        peer.on("stream", handleStream);

        return () => {
            // Cleanup handled by ref/peer
        };
    }, [peer]);

    // Visual indicator of audio
    return (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 2000 }}>
            <audio playsInline autoPlay ref={ref} controls={false} />
            <div style={{
                width: '20px',
                height: '60px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid #00f2ff',
                borderRadius: '5px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end'
            }}>
                <div style={{
                    width: '100%',
                    height: `${Math.min(volume, 100)}%`,
                    background: '#00f2ff',
                    transition: 'height 0.1s'
                }} />
            </div>
            <div style={{ color: 'white', fontSize: '10px' }}>Remote</div>
        </div>
    );
};

export default VoiceChatManager;
