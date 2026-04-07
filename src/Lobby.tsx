import React, { useState, useEffect } from 'react';
import { db, generateRoomCode } from './firebase';
import { ref, get, update, set } from 'firebase/database';
import { Plus, LogIn, DownloadCloud, Loader2 } from 'lucide-react';
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
      const snapshot = await get(ref(db, `rooms/${code.trim()}`));
      if (!snapshot.exists()) return alert("החדר לא נמצא!");
      const playerId = Math.random().toString(36).substring(7);
      await update(ref(db, `rooms/${code.trim()}/players/${playerId}`), {
        id: playerId, name, score: 0, isHost: false
      });
      onJoinRoom(code.trim(), playerId, false);
    } catch (e) { alert("שגיאה בהצטרפות"); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4 text-center" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <h1 className="text-4xl font-black text-blue-800">הַמִּתְחַזֶּה</h1>
        <input
          type="text"
          placeholder="הַשֵּׁם שֶׁלְּךָ..."
          className="w-full p-5 text-2xl border-4 border-blue-100 rounded-2xl outline-none text-center"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={createNewRoom} disabled={loading} className="w-full bg-green-500 text-white font-bold py-6 rounded-2xl text-3xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Plus size={32} />} יְצִירַת חֶדֶר
        </button>
        <div className="text-gray-300 font-bold">אוֹ</div>
        <input
          type="text"
          placeholder="מִילַת הַחֶדֶר (למשל: חתול25)"
          className="w-full p-5 text-2xl border-4 border-orange-100 rounded-2xl outline-none text-center"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button onClick={joinExistingRoom} disabled={loading} className="w-full bg-orange-500 text-white font-bold py-6 rounded-2xl text-3xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <LogIn size={32} /> הִצְטָרְפוּת
        </button>
        {preloadedCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
            <DownloadCloud size={16} /> <span>טוען תמונות... ({preloadedCount}/{situations.length})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;