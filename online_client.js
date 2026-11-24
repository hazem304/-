/**
 * Socket.IO Client Adapter for Al-Abaqera 3D
 * Add <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
 * and include this file in public/index.html to enable live remote multiplayer.
 */
window.OnlineSocketAdapter = {
  socket: null,
  roomCode: null,
  mySide: null,

  connect(serverUrl = window.location.origin) {
    if (this.socket) return this.socket;
    this.socket = io(serverUrl, { transports: ['websocket', 'polling'] });
    this.socket.on('room:update', (room) => window.dispatchEvent(new CustomEvent('abaqera:roomUpdate', { detail: room })));
    this.socket.on('match:started', (data) => window.dispatchEvent(new CustomEvent('abaqera:matchStarted', { detail: data })));
    this.socket.on('game:buzzed', (data) => window.dispatchEvent(new CustomEvent('abaqera:buzzed', { detail: data })));
    this.socket.on('game:answered', (data) => window.dispatchEvent(new CustomEvent('abaqera:answered', { detail: data })));
    this.socket.on('game:jokerActivated', (data) => window.dispatchEvent(new CustomEvent('abaqera:joker', { detail: data })));
    this.socket.on('game:wheelResult', (data) => window.dispatchEvent(new CustomEvent('abaqera:wheel', { detail: data })));
    this.socket.on('game:advance', () => window.dispatchEvent(new CustomEvent('abaqera:advance')));
    return this.socket;
  },

  createRoom(teamName, pool = 'all', qdiff = 'all') {
    return new Promise((resolve) => {
      this.connect().emit('room:create', { teamName, pool, qdiff }, (res) => {
        if (res?.ok) { this.roomCode = res.code; this.mySide = res.side; }
        resolve(res);
      });
    });
  },

  joinRoom(code, teamName) {
    return new Promise((resolve) => {
      this.connect().emit('room:join', { code, teamName }, (res) => {
        if (res?.ok) { this.roomCode = res.code; this.mySide = res.side; }
        resolve(res);
      });
    });
  },

  buzz() { this.socket?.emit('game:buzz'); },
  submitAnswer(chosenIdx, isCorrect, pts) { this.socket?.emit('game:answer', { chosenIdx, isCorrect, pts }); },
  useJoker() { this.socket?.emit('game:joker'); },
  spinWheel(sliceIndex, pts, label) { this.socket?.emit('game:wheelSpin', { sliceIndex, pts, label }); },
  nextQuestion() { this.socket?.emit('game:nextQuestion'); }
};
