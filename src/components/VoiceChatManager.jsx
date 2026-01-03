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

    // We store peers in a ref for direct access during signal handling,
    // but we also keep them in state for rendering.
    // The Ref will store: { peerID, peer }
    const peersRef = useRef([]);

    useEffect(() => {
        // 1. Get User Media
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then(currentStream => {
                setStream(currentStream);

                // 2. Listen for 'all_users' to initiate calls
                // This event is sent by server immediately after we join/reconnect
                socket.on("all_users", (users) => {
                    // Destroy existing peers to avoid duplicates/leaks
                    peersRef.current.forEach(({ peer }) => {
                        if (peer) peer.destroy();
                    });
                    peersRef.current = [];

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
                            remoteStream: null // Initialize with null stream
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
                    // Add to state
                    setPeers(prev => [...prev, { peerID: payload.callerID, peer, remoteStream: null }]);
                });

                // 4. Listen for returned signals (answer to our offer)
                socket.on("receiving_returned_signal", payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                });

                // Now that we are ready, ask for users
                console.log("VC: Requesting users for room", roomCode);
                socket.emit("join_voice", { roomCode });
            })
            .catch(err => {
                console.error("Voice Chat Error:", err);
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
                setStream(null);
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

        peer.on("stream", remoteStream => {
            console.log("VC: Initiator received stream", remoteStream.id);
            // Update state with the received stream
            setPeers(prev => prev.map(p =>
                p.peerID === userToSignal ? { ...p, remoteStream } : p
            ));
        });

        peer.on("connect", () => console.log("VC: Peer Connected!"));
        peer.on("error", err => console.error("VC: Peer Error", err));

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            // Even if we are receiver, we must pass our stream to send audio back
            stream,
            config: rtcConfig
        });

        peer.on("signal", signal => {
            console.log("VC: Returning Signal", { callerID });
            socket.emit("returning_signal", { signal, callerID });
        });

        peer.on("stream", remoteStream => {
            console.log("VC: Receiver received stream", remoteStream.id);
            // Update state with the received stream
            setPeers(prev => prev.map(p =>
                p.peerID === callerID ? { ...p, remoteStream } : p
            ));
        });

        peer.on("connect", () => console.log("VC: Peer Connected!"));
        peer.on("error", err => console.error("VC: Peer Error", err));

        peer.signal(incomingSignal);

        return peer;
    }

    const toggleMute = () => {
        if (stream) {
            const track = stream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!isMuted);
            }
        }
    };

    return (
        <>
            <button
                className="mute-btn"
                onClick={toggleMute}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
                style={{
                    position: 'fixed',
                    top: '80px',
                    left: '20px',
                    background: isMuted ? 'rgba(255, 68, 68, 0.2)' : 'rgba(0,0,0,0.5)',
                    borderColor: isMuted ? '#ff4444' : 'var(--neon-gold)',
                    color: isMuted ? '#ff4444' : 'var(--neon-gold)',
                    zIndex: 1000,
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid'
                }}
            >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Render Audio Elements for Peers */}
            {peers.map((p, index) => {
                return (
                    <AudioPlayer
                        key={p.peerID}
                        stream={p.remoteStream}
                        index={index}
                    />
                );
            })}
        </>
    );
};

const AudioPlayer = ({ stream, index }) => {
    const ref = useRef();
    const [volume, setVolume] = useState(0);

    useEffect(() => {
        console.log(`VC AudioPlayer[${index}]: Stream prop changed`, stream ? stream.id : 'null');

        if (ref.current && stream) {
            ref.current.srcObject = stream;

            const playPromise = ref.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.error("VC: Play failed:", e));
            }

            // Visualize Audio
            let audioContext;
            let analyser;
            let animationFrame;
            let source;

            const setupAudio = async () => {
                try {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    // Resume context if suspended (common in browsers)
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }

                    source = audioContext.createMediaStreamSource(stream);
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);

                    const updateVolume = () => {
                        analyser.getByteFrequencyData(dataArray);
                        const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                        setVolume(avg);
                        animationFrame = requestAnimationFrame(updateVolume);
                    };
                    updateVolume();
                } catch (err) {
                    console.error("VC: AudioContext Error", err);
                }
            };

            setupAudio();

            return () => {
                if (animationFrame) cancelAnimationFrame(animationFrame);
                if (audioContext && audioContext.state !== 'closed') {
                    audioContext.close();
                }
                // Do NOT stop the tracks here, as the stream belongs to the peer, not this component
            };
        }
    }, [stream, index]);

    // Even if no stream, we might want to occupy space? No, hide if no stream.
    if (!stream) return null;

    // Position players: 
    // They are fixed at bottom right.
    // Stack them up from the bottom.
    const bottomOffset = 20 + (index * 80);

    return (
        <div style={{
            position: 'fixed',
            bottom: `${bottomOffset}px`,
            right: '20px',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <audio playsInline autoPlay ref={ref} controls={false} />
            <div style={{
                width: '30px',
                height: '50px',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid #00f2ff',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                boxShadow: '0 0 10px rgba(0, 242, 255, 0.3)'
            }}>
                <div style={{
                    width: '100%',
                    height: `${Math.min(volume * 2, 100)}%`, // Amplify visual
                    background: 'linear-gradient(to top, #00f2ff, #00ff9d)',
                    transition: 'height 0.1s ease-out'
                }} />
            </div>
            <div style={{
                color: '#00f2ff',
                fontSize: '10px',
                marginTop: '4px',
                textShadow: '0 0 2px black',
                fontWeight: 'bold',
                background: 'rgba(0,0,0,0.5)',
                padding: '2px 4px',
                borderRadius: '4px'
            }}>
                Player {index + 1}
            </div>
        </div>
    );
};

export default VoiceChatManager;
