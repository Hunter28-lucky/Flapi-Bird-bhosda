// Peer-to-peer multiplayer using WebRTC
// No server needed - uses public STUN servers

type PeerConnection = {
  id: string;
  name: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
};

type GameState = {
  playerId: string;
  playerName: string;
  birdY: number;
  velocity: number;
  score: number;
  isAlive: boolean;
};

type MultiplayerCallbacks = {
  onPlayerJoined: (playerId: string, playerName: string) => void;
  onPlayerLeft: (playerId: string) => void;
  onGameStateUpdate: (playerId: string, state: GameState) => void;
  onRoomReady: () => void;
};

class P2PMultiplayer {
  private peers: Map<string, PeerConnection> = new Map();
  private myId: string;
  private myName: string;
  private roomCode: string;
  private callbacks: MultiplayerCallbacks;
  private isHost: boolean;

  // Free public STUN servers
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  constructor(roomCode: string, playerName: string, callbacks: MultiplayerCallbacks, isHost: boolean = false) {
    this.myId = Math.random().toString(36).substr(2, 9);
    this.myName = playerName;
    this.roomCode = roomCode;
    this.callbacks = callbacks;
    this.isHost = isHost;
  }

  // Create a connection to another peer
  async createConnection(peerId: string, peerName: string): Promise<RTCPeerConnection> {
    const connection = new RTCPeerConnection({ iceServers: this.iceServers });
    const dataChannel = connection.createDataChannel('game');

    const peerConnection: PeerConnection = {
      id: peerId,
      name: peerName,
      connection,
      dataChannel,
    };

    this.setupDataChannel(dataChannel, peerId);
    this.peers.set(peerId, peerConnection);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          from: this.myId,
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    return connection;
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      console.log(`Connected to peer: ${peerId}`);
      this.callbacks.onPlayerJoined(peerId, this.peers.get(peerId)?.name || 'Unknown');
    };

    channel.onclose = () => {
      console.log(`Disconnected from peer: ${peerId}`);
      this.callbacks.onPlayerLeft(peerId);
      this.peers.delete(peerId);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'game-state') {
          this.callbacks.onGameStateUpdate(peerId, data.state);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }

  // Send game state to all connected peers
  sendGameState(state: Omit<GameState, 'playerId' | 'playerName'>) {
    const message = JSON.stringify({
      type: 'game-state',
      state: {
        playerId: this.myId,
        playerName: this.myName,
        ...state,
      },
    });

    this.peers.forEach((peer) => {
      if (peer.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(message);
      }
    });
  }

  // Simple signaling using localStorage and polling
  // In a real app, you'd use a WebSocket server
  private sendSignal(signal: any) {
    const signals = JSON.parse(localStorage.getItem(`signals_${this.roomCode}`) || '[]');
    signals.push({ ...signal, timestamp: Date.now() });
    // Keep only last 50 signals
    if (signals.length > 50) signals.shift();
    localStorage.setItem(`signals_${this.roomCode}`, JSON.stringify(signals));
  }

  private pollSignals() {
    setInterval(() => {
      const signals = JSON.parse(localStorage.getItem(`signals_${this.roomCode}`) || '[]');
      const mySignals = signals.filter((s: any) => s.to === this.myId && !s.processed);

      mySignals.forEach(async (signal: any) => {
        await this.handleSignal(signal);
        // Mark as processed
        signal.processed = true;
      });

      if (mySignals.length > 0) {
        localStorage.setItem(`signals_${this.roomCode}`, JSON.stringify(signals));
      }
    }, 500);
  }

  private async handleSignal(signal: any) {
    switch (signal.type) {
      case 'offer':
        await this.handleOffer(signal);
        break;
      case 'answer':
        await this.handleAnswer(signal);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(signal);
        break;
    }
  }

  private async handleOffer(signal: any) {
    const connection = new RTCPeerConnection({ iceServers: this.iceServers });
    
    const peerConnection: PeerConnection = {
      id: signal.from,
      name: signal.fromName,
      connection,
      dataChannel: null,
    };

    connection.ondatachannel = (event) => {
      peerConnection.dataChannel = event.channel;
      this.setupDataChannel(event.channel, signal.from);
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          from: this.myId,
          to: signal.from,
          candidate: event.candidate,
        });
      }
    };

    this.peers.set(signal.from, peerConnection);

    await connection.setRemoteDescription(new RTCSessionDescription(signal.offer));
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    this.sendSignal({
      type: 'answer',
      from: this.myId,
      fromName: this.myName,
      to: signal.from,
      answer,
    });
  }

  private async handleAnswer(signal: any) {
    const peer = this.peers.get(signal.from);
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(signal.answer));
    }
  }

  private async handleIceCandidate(signal: any) {
    const peer = this.peers.get(signal.from);
    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  }

  // Create room (host)
  async createRoom() {
    localStorage.setItem(`room_${this.roomCode}`, JSON.stringify({
      hostId: this.myId,
      hostName: this.myName,
      created: Date.now(),
    }));

    this.pollSignals();
    this.callbacks.onRoomReady();
  }

  // Join room (guest)
  async joinRoom() {
    const roomData = JSON.parse(localStorage.getItem(`room_${this.roomCode}`) || 'null');
    
    if (!roomData) {
      throw new Error('Room not found');
    }

    const connection = await this.createConnection(roomData.hostId, roomData.hostName);
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    this.sendSignal({
      type: 'offer',
      from: this.myId,
      fromName: this.myName,
      to: roomData.hostId,
      offer,
    });

    this.pollSignals();
    this.callbacks.onRoomReady();
  }

  // Cleanup
  disconnect() {
    this.peers.forEach((peer) => {
      peer.dataChannel?.close();
      peer.connection.close();
    });
    this.peers.clear();

    if (this.isHost) {
      localStorage.removeItem(`room_${this.roomCode}`);
      localStorage.removeItem(`signals_${this.roomCode}`);
    }
  }
}

export default P2PMultiplayer;
export type { GameState, MultiplayerCallbacks };
