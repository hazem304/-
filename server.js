const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = new Map();

function generateCode() {
  let code = '';
  do {
    code = 'ABQ-' + Math.floor(100 + Math.random() * 899);
  } while (rooms.has(code));
  return code;
}

io.on('connection', (socket) => {
  // Create a new room (Host = Team A)
  socket.on('room:create', ({ teamName, pool = 'all', qdiff = 'all' } = {}, cb) => {
    const code = generateCode();
    const room = {
      code,
      pool,
      qdiff,
      hostId: socket.id,
      players: {
        A: { id: socket.id, name: teamName || 'الفريق الأزرق', score: 0, joker: true },
        B: null
      },
      buzzerLockedBy: null,
      status: 'waiting'
    };
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.side = 'A';
    if (cb) cb({ ok: true, code, side: 'A', room });
    io.to(code).emit('room:update', room);
  });

  // Join an existing room by code (Guest = Team B)
  socket.on('room:join', ({ code, teamName } = {}, cb) => {
    const cleanCode = String(code || '').trim().toUpperCase();
    const room = rooms.get(cleanCode);
    if (!room) return cb && cb({ ok: false, error: 'كود الغرفة غير موجود' });
    if (room.players.B && room.players.B.id !== socket.id) {
      return cb && cb({ ok: false, error: 'الغرفة ممتلئة بالفعل (فريقان فقط)' });
    }
    room.players.B = { id: socket.id, name: teamName || 'الفريق الذهبي', score: 0, joker: true };
    room.status = 'ready';
    socket.join(cleanCode);
    socket.data.roomCode = cleanCode;
    socket.data.side = 'B';
    if (cb) cb({ ok: true, code: cleanCode, side: 'B', room });
    io.to(cleanCode).emit('room:update', room);
  });

  // Host starts the match & broadcasts deterministic seed/question order
  socket.on('match:start', ({ seed } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.status = 'playing';
    room.buzzerLockedBy = null;
    io.to(room.code).emit('match:started', { seed: seed || Date.now(), room });
  });

  // Server-authoritative Buzzer Race (first millisecond wins!)
  socket.on('game:buzz', () => {
    const room = rooms.get(socket.data.roomCode);
    const side = socket.data.side;
    if (!room || !side || room.buzzerLockedBy) return;
    room.buzzerLockedBy = side;
    io.to(room.code).emit('game:buzzed', { side, teamName: room.players[side]?.name });
  });

  // Sync Answer, Joker, Wheel Spin, and Next Question
  socket.on('game:answer', ({ chosenIdx, isCorrect, pts }) => {
    const room = rooms.get(socket.data.roomCode);
    const side = socket.data.side;
    if (!room || !side) return;
    if (isCorrect && room.players[side]) {
      room.players[side].score += Number(pts) || 10;
    }
    room.buzzerLockedBy = null;
    io.to(room.code).emit('game:answered', { side, chosenIdx, isCorrect, pts, players: room.players });
  });

  socket.on('game:joker', () => {
    const room = rooms.get(socket.data.roomCode);
    const side = socket.data.side;
    if (!room || !side || !room.players[side]?.joker) return;
    room.players[side].joker = false;
    io.to(room.code).emit('game:jokerActivated', { side, players: room.players });
  });

  socket.on('game:wheelSpin', ({ sliceIndex, pts, label }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    io.to(room.code).emit('game:wheelResult', { side: socket.data.side, sliceIndex, pts, label });
  });

  socket.on('game:nextQuestion', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.buzzerLockedBy = null;
    io.to(room.code).emit('game:advance');
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    if (room.hostId === socket.id) {
      io.to(code).emit('room:closed', { reason: 'غادر منشئ الغرفة' });
      rooms.delete(code);
    } else if (room.players.B && room.players.B.id === socket.id) {
      room.players.B = null;
      room.status = 'waiting';
      io.to(code).emit('room:update', room);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Al-Abaqera 3D Online Server running on http://localhost:${PORT}`);
});
