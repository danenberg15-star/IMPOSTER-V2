import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import { situations } from './data';
import { Users, Play, Share2 } from 'lucide-react';

interface WaitingRoomProps { roomId: string; playerId: string; isHost: boolean; }

const WaitingRoom: React.FC<WaitingRoomProps> = ({ roomId, isHost }) => {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    const playersRef = ref(db, `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) setPlayers(Object.values(snapshot.val()));
    });
  }, [roomId]);

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/?room=${roomId}`;
    const text = `בואו לשחק איתי "המתחזה"! \nקוד החדר: *${roomId}*\n\nלהצטרפות:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const startGame = async () => {
    if (players.length < 3) return alert("צריך לפחות 3 שחקנים!");
    const randomSituation = situations[Math.floor(Math.random() * situations.length)];
    const imposterId = players[Math.floor(Math.random() * players.length)].id;
    const roles: any = {};
    players.forEach(p => {
      if (p.id === imposterId) roles[p.id] = { role: "הַמִּתְחַזֶּה", isImposter: true };
      else roles[p.id] = { role: randomSituation.roles[Math.floor(Math.random() * randomSituation.roles.length)], isImposter: false };
    });
    await update(ref(db, `rooms/${roomId}`), { "meta/status": 'playing', "meta/currentSituation": randomSituation, "game": { roles, playersOut: {} } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center" dir="rtl">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/10 p-10 shadow-2xl">
        <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] mb-2">קוד החדר שלך</p>
        
        <button onClick={shareWhatsApp} className="w-full py-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 text-5xl font-black mb-10 flex items-center justify-center gap-4 hover:bg-emerald-500/20 active:scale-95 transition-all group">
          {roomId}
          <Share2 size={32} className="group-hover:rotate-12 transition-transform" />
        </button>

        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-2 text-white/40 font-bold text-sm uppercase tracking-widest px-2">
            <Users size={16} /> שחקנים בחדר ({players.length})
          </div>
          <div className="grid gap-2">
            {players.map(p => (
              <div key={p.id} className="bg-white/5 p-4 rounded-2xl text-xl font-bold border border-white/5 text-white flex justify-between items-center px-6">
                {p.name} {p.isHost && <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-lg">מנהל</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button onClick={startGame} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl text-2xl font-black shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">
            <Play size={28} fill="currentColor" /> התחלת משימה
          </button>
        ) : (
          <div className="text-white/20 italic animate-pulse py-4 font-medium">ממתינים לפקודת המנהל...</div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;