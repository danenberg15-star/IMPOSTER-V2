import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import { situations } from './data';
import { Users, Play, Copy, Check } from 'lucide-react';

interface WaitingRoomProps {
  roomId: string;
  playerId: string;
  isHost: boolean;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ roomId, isHost }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const playersRef = ref(db, `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlayers(Object.values(snapshot.val()));
      }
    });
  }, [roomId]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (players.length < 3) return alert("צָרִיךְ לְפָחוֹת 3 שַׂחְקָנִים!");
    
    const randomSituation = situations[Math.floor(Math.random() * situations.length)];
    const imposterId = players[Math.floor(Math.random() * players.length)].id;
    
    const roles: any = {};
    players.forEach(p => {
      if (p.id === imposterId) {
        roles[p.id] = { role: "הַמִּתְחַזֶּה", isImposter: true };
      } else {
        const randomRole = randomSituation.roles[Math.floor(Math.random() * randomSituation.roles.length)];
        roles[p.id] = { role: randomRole, isImposter: false };
      }
    });

    await update(ref(db, `rooms/${roomId}`), {
      "meta/status": 'playing',
      "meta/currentSituation": randomSituation,
      "game": { roles, playersOut: {} }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-6" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl text-center border-b-8 border-blue-100">
        <h2 className="text-3xl font-bold text-gray-400 mb-2 italic">מִילַת הַחֶדֶר:</h2>
        <button onClick={copyCode} className="flex items-center justify-center gap-3 bg-blue-100 text-blue-700 w-full py-6 rounded-3xl text-5xl font-black mb-8 border-4 border-blue-200 active:scale-95 transition-all">
          {roomId} {copied ? <Check size={40} className="text-green-500" /> : <Copy size={40} />}
        </button>

        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-2 text-2xl font-bold text-gray-500 mb-4">
            <Users /> שַׂחְקָנִים בַּחֶדֶר ({players.length}):
          </div>
          <div className="grid grid-cols-1 gap-3">
            {players.map(p => (
              <div key={p.id} className="bg-gray-50 p-4 rounded-2xl text-2xl font-black border-2 border-gray-100 text-blue-800">
                {p.name} {p.isHost && "👑"}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button onClick={startGame} className="w-full bg-green-500 text-white py-6 rounded-3xl text-4xl font-black shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all">
            <Play size={40} fill="currentColor" /> הַתְחָלָה!
          </button>
        ) : (
          <div className="text-2xl font-bold text-orange-400 animate-pulse italic">
            מְחַכִּים שֶׁהַמְּנַהֵל יַתְחִיל...
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;