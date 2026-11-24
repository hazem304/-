/**
 * Zero-Server Firebase Realtime Database Adapter for Al-Abaqera 3D
 * Ideal for hosting directly on GitHub Pages without a Node.js server!
 * Replace firebaseConfig below with your project's config from console.firebase.google.com.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, set, get, update, onValue, runTransaction } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID'
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const FirebaseRoomSync = {
  roomCode: null,
  mySide: null,

  async createRoom(teamName) {
    const code = 'ABQ-' + Math.floor(100 + Math.random() * 899);
    await set(ref(db, `rooms/${code}`), {
      code,
      status: 'waiting',
      buzzerLockedBy: '',
      players: {
        A: { name: teamName || 'الفريق الأزرق', score: 0, joker: true },
        B: null
      },
      updatedAt: Date.now()
    });
    this.roomCode = code;
    this.mySide = 'A';
    return code;
  },

  async joinRoom(code, teamName) {
    const clean = String(code || '').trim().toUpperCase();
    const snap = await get(ref(db, `rooms/${clean}`));
    if (!snap.exists()) throw new Error('كود الغرفة غير موجود');
    await update(ref(db, `rooms/${clean}`), {
      'players/B': { name: teamName || 'الفريق الذهبي', score: 0, joker: true },
      status: 'ready',
      updatedAt: Date.now()
    });
    this.roomCode = clean;
    this.mySide = 'B';
    return clean;
  },

  // Atomic transaction guarantees only the fastest buzzer click wins!
  async buzz() {
    if (!this.roomCode || !this.mySide) return false;
    const buzzRef = ref(db, `rooms/${this.roomCode}/buzzerLockedBy`);
    const result = await runTransaction(buzzRef, (current) => (current ? undefined : this.mySide));
    return result.committed;
  },

  subscribe(code, onChange) {
    return onValue(ref(db, `rooms/${code}`), (snap) => {
      if (snap.exists()) onChange(snap.val());
    });
  }
};
