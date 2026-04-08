import React, { useState, useEffect } from 'react';
import { db, generateRoomCode } from './firebase';
import { ref, get, update, set } from 'firebase/database';
import { Plus, LogIn, DownloadCloud, Loader2, Camera } from 'lucide-react';
import { situations } from './data';

interface LobbyProps {
  onJoinRoom: (roomId: string, playerId: string, isHost: boolean) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) setCode(roomFromUrl);
  }, []);

  useEffect(() => {
    if (name.length >= 2 && preloadedCount === 0) {
      situations.forEach((sit) => {
        const img = new Image();
        img.src = sit.imageUrl;
        img.onload = () => setPreloadedCount(prev => prev + 1);
      });
    }
  }, [name]);

  const createNewRoom = async () => {
    if (!name.trim()) return alert("נא להכניס שם!");
    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      const playerId = Math.random().toString(36).substring(7);
      await set(ref(db, `rooms/${roomCode}`), {
        meta: { status: 'waiting', hostId: playerId },
        players: { [playerId]: { id: playerId, name, score: 0, isHost: true } }
      });
      onJoinRoom(roomCode, playerId, true);
    } catch (e) { alert("שגיאה בחיבור"); }
    setLoading(false);
  };

  const joinExistingRoom = async () => {
    if (!name.trim() || !code.trim()) return alert("שם ומילה חובה!");
    setLoading(true);
    try {
      const roomCode = code.trim();
      const isQA = roomCode === 'עומר';
      const playerId = Math.random().toString(36).substring(7);

      if (isQA) {
        const dummy1Id = 'qa1_' + Math.random().toString(36).substring(7);
        const dummy2Id = 'qa2_' + Math.random().toString(36).substring(7);
        await set(ref(db, `rooms/${roomCode}`), {
          meta: { status: 'waiting', hostId: playerId },
          players: {
            [playerId]: { id: playerId, name, score: 0, isHost: true },
            [dummy1Id]: { id: dummy1Id, name: 'בוט בדיקות 1', score: 0, isHost: false },
            [dummy2Id]: { id: dummy2Id, name: 'בוט בדיקות 2', score: 0, isHost: false }
          }
        });
        onJoinRoom(roomCode, playerId, true);
      } else {
        const snapshot = await get(ref(db, `rooms/${roomCode}`));
        if (!snapshot.exists()) { setLoading(false); return alert("החדר לא נמצא!"); }
        await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { id: playerId, name, score: 0, isHost: false });
        onJoinRoom(roomCode, playerId, false);
      }
    } catch (e) { alert("שגיאה בהצטרפות"); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center" dir="rtl">
      <div className="w-full max-w-md space-y-10">
        <div className="flex flex-col items-center gap-6">
          <img src="/icon.png" className="w-48 h-48 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/10" alt="logo" />
          <h1 className="text-5xl font-black text-white tracking-tighter italic">הַמִּתְחַזֶּה</h1>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 shadow-2xl space-y-6">
          <input
            type="text"
            placeholder="איך קוראים לך?"
            className="w-full p-5 text-xl bg-white/5 border border-white/10 rounded-2xl outline-none text-center text-white placeholder-white/20 focus:border-indigo-500/50 transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={createNewRoom} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl text-2xl shadow-lg active:scale-95 flex items-center justify-center gap-3 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Plus size={28} />} יצירת חדר
          </button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-slate-900 px-3 text-white/20 font-bold">או הצטרפות</span></div>
          </div>

          <input
            type="text"
            placeholder="קוד חדר"
            className="w-full p-5 text-xl bg-white/5 border border-white/10 rounded-2xl outline-none text-center text-white placeholder-white/20 focus:border-amber-500/50 transition-all"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={joinExistingRoom} disabled={loading} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl text-2xl border border-white/10 shadow-lg active:scale-95 flex items-center justify-center gap-3 transition-all">
            <LogIn size={28} /> כניסה לחדר
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {preloadedCount > 0 && preloadedCount < situations.length && (
            <div className="flex items-center justify-center gap-2 text-white/20 text-xs font-bold uppercase tracking-widest">
              <DownloadCloud size={14} className="animate-bounce" /> <span>טוען משאבים... {preloadedCount}/{situations.length}</span>
            </div>
          )}
          
          {/* Pixabay Attribution */}
          <div className="flex items-center gap-2 text-white/10 text-[10px] font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-100">
            <Camera size={12} />
            <span>תודה ל-Pixabay על התמונות המדהימות</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;