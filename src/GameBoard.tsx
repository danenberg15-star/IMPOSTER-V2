import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { AlertTriangle, Lightbulb, EyeOff, Trophy, Users, X, Play, ShieldCheck } from 'lucide-react';
import { situations } from './data';

interface GameBoardProps { roomId: string; playerId: string; isHost: boolean; }

const GameBoard: React.FC<GameBoardProps> = ({ roomId, playerId, isHost }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showGuessModal, setShowGuessModal] = useState(false);

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}`);
    return onValue(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setGameData(data);
        if (data.meta.status === 'playing') {
          const playersArr = Object.values(data.players || {});
          const outCount = Object.keys(data.game?.playersOut || {}).length;
          const activeCount = playersArr.length - outCount;
          if (isHost && activeCount <= 2 && data.meta.status !== 'round_over') {
            handleImposterWinByElimination(data);
          }
        }
      }
    });
  }, [roomId, isHost]);

  const handleImposterWinByElimination = async (data: any) => {
    const imposterId = Object.keys(data.game.roles).find(id => data.game.roles[id].isImposter);
    if (imposterId) {
      const currentScore = data.players[imposterId].score || 0;
      await update(ref(db, `rooms/${roomId}`), {
        [`players/${imposterId}/score`]: currentScore + 40,
        [`game/roundDeltas/${imposterId}`]: 40,
        "meta/status": 'round_over',
        "meta/lastWinner": 'הַמִּתְחַזֶּה נִיצֵּחַ! הַצַּוָּת חוּסַל.'
      });
    }
  };

  if (!gameData || !gameData.game?.roles) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xl animate-pulse italic">טוען נתונים...</div>;

  const myRole = gameData.game.roles[playerId];
  const isOut = gameData.game.playersOut?.[playerId];
  const situation = gameData.meta.currentSituation;
  const players = Object.values(gameData.players) as any[];
  const winner = players.filter(p => (p.score || 0) >= 100).sort((a,b) => (b.score || 0) - (a.score || 0))[0];

  const startNewRound = async () => {
    const randomSituation = situations[Math.floor(Math.random() * situations.length)];
    const imposterId = players[Math.floor(Math.random() * players.length)].id;
    const roles: any = {};
    players.forEach(p => {
      if (p.id === imposterId) roles[p.id] = { role: "הַמִּתְחַזֶּה", isImposter: true };
      else roles[p.id] = { role: randomSituation.roles[Math.floor(Math.random() * randomSituation.roles.length)], isImposter: false };
    });
    await update(ref(db, `rooms/${roomId}`), {
      "meta/status": 'playing',
      "meta/currentSituation": randomSituation,
      "meta/lastWinner": null,
      "game/roles": roles,
      "game/playersOut": null,
      "game/roundDeltas": null
    });
  };

  const handleAccuse = async (targetId: string) => {
    setShowVoteModal(false);
    const isTargetImposter = gameData.game.roles[targetId].isImposter;
    const currentScore = gameData.players[playerId].score || 0;
    if (isTargetImposter) {
      // Updated scoring for successful accusation: +10 instead of +40
      await update(ref(db, `rooms/${roomId}`), {
        [`players/${playerId}/score`]: currentScore + 10,
        [`game/roundDeltas/${playerId}`]: 10,
        "meta/status": 'round_over',
        "meta/lastWinner": `הַמִּתְחַזֶּה נֶחְשַׂף עַל יְדֵי ${gameData.players[playerId].name}!`
      });
    } else {
      await update(ref(db, `rooms/${roomId}`), {
        [`players/${playerId}/score`]: currentScore - 20,
        [`game/roundDeltas/${playerId}`]: -20,
        [`game/playersOut/${playerId}`]: true
      });
    }
  };

  const handleGuessLocation = async (sitId: number) => {
    setShowGuessModal(false);
    const isCorrect = sitId === situation.id;
    const currentScore = gameData.players[playerId].score || 0;
    if (isCorrect) {
      await update(ref(db, `rooms/${roomId}`), {
        [`players/${playerId}/score`]: currentScore + 40,
        [`game/roundDeltas/${playerId}`]: 40,
        "meta/status": 'round_over',
        "meta/lastWinner": 'הַמִּתְחַזֶּה נִיצֵּחַ! הוּא יָדַע בְּדִיּוּק אֵיפֹה אַתֶּם.'
      });
    } else {
      const updates: any = {
        "meta/status": 'round_over',
        "meta/lastWinner": 'הַמִּתְחַזֶּה טָעָה בַּמָּקוֹם! נִיצָּחוֹן לַצֶּוֶת.',
        [`players/${playerId}/score`]: currentScore - 20,
        [`game/roundDeltas/${playerId}`]: -20
      };
      players.forEach(p => {
        if (p.id !== playerId && !gameData.game.playersOut?.[p.id]) {
          updates[`players/${p.id}/score`] = (p.score || 0) + 10;
          updates[`game/roundDeltas/${p.id}`] = 10;
        }
      });
      await update(ref(db, `rooms/${roomId}`), updates);
    }
  };

  const handleFinalExit = async () => {
    await remove(ref(db, `rooms/${roomId}`));
    localStorage.removeItem('imposter_session');
    window.location.reload();
  };

  if (winner) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-[100] text-center" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none"></div>
        <Trophy size={120} className="text-amber-400 mb-6 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">הַמְּנַצֵּחַ הַגָּדוֹל</h1>
        <p className="text-6xl font-bold text-amber-400 mb-12 drop-shadow-sm">{winner.name}</p>
        <button onClick={handleFinalExit} className="relative z-10 bg-white text-slate-950 font-bold text-xl py-4 px-12 rounded-full shadow-2xl active:scale-95 transition-all">סיום משחק</button>
      </div>
    );
  }

  if (gameData.meta.status === 'round_over') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white" dir="rtl">
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <p className="text-amber-400 font-medium mb-2 tracking-wide uppercase text-sm">{gameData.meta.lastWinner}</p>
            <h1 className="text-4xl font-black tracking-tight italic">טבלת ניקוד</h1>
          </div>
          <div className="space-y-3 mb-10">
            {players.sort((a,b) => (b.score || 0) - (a.score || 0)).map((p, idx) => {
              const delta = gameData.game.roundDeltas?.[p.id] || 0;
              return (
                <div key={p.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-white/20">#{idx + 1}</span>
                    <span className="text-xl font-bold">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {delta !== 0 && (
                      <span className={`text-sm font-bold ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    )}
                    <span className="text-2xl font-black text-white">{p.score || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {isHost ? (
            <button onClick={startNewRound} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl text-xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95">
              <Play size={24} fill="currentColor" /> סיבוב הבא
            </button>
          ) : (
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/5 text-white/40 italic">ממתינים למנהל...</div>
          )}
        </div>
      </div>
    );
  }

  if (isOut) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="w-full max-w-xs bg-rose-500/10 border border-rose-500/20 p-10 rounded-[3rem] backdrop-blur-md">
          <div className="bg-rose-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={60} className="text-rose-500" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">הוּדַחְתָּ!</h1>
          <p className="text-rose-200/60 font-medium italic text-lg">טעות בזיהוי עלתה לך ביוקר...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-950 p-4 pb-10" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between py-4 px-2 mb-2">
        <div className="flex items-center gap-2">
           <img src="/icon.png" className="w-8 h-8 rounded-lg" alt="logo" />
           <span className="text-white font-black tracking-tighter text-xl">הַמִּתְחַזֶּה</span>
        </div>
        <div className="bg-white/5 px-4 py-1 rounded-full border border-white/10">
           <span className="text-white/60 text-xs font-bold uppercase tracking-widest">משימה פעילה</span>
        </div>
      </div>

      {/* תמונת המיקום / תצוגת מתחזה - מקסימום שטח לאייקון */}
      <div className="w-full max-w-md aspect-square rounded-[3rem] overflow-hidden shadow-2xl mb-6 border border-white/10 bg-slate-900 relative">
        {!myRole.isImposter ? (
          <>
            <img src={situation.imageUrl} className="w-full h-full object-cover opacity-80" alt="situation" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center">
               <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">{situation.name}</h1>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 bg-rose-950/20">
            {/* האייקון הוגדל למקסימום המקום בתוך המסגרת ללא טקסט */}
            <img 
              src="/icon.png" 
              className="w-full h-full max-w-[85%] max-h-[85%] object-contain rounded-[3.5rem] shadow-[0_0_60px_rgba(225,29,72,0.4)] border-2 border-rose-500/20 animate-pulse" 
              alt="imposter icon" 
            />
          </div>
        )}
      </div>

      {/* כרטיס תפקיד - מרכוז מלא */}
      <div className="w-full max-w-md">
        <div className={`relative p-8 rounded-[3rem] border backdrop-blur-md overflow-hidden text-center ${
          myRole.isImposter 
          ? 'bg-rose-500/5 border-rose-500/20 text-rose-500 shadow-[inset_0_0_30px_rgba(225,29,72,0.1)]' 
          : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400 shadow-[inset_0_0_30px_rgba(99,102,241,0.1)]'
        }`}>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 mb-1">הזהות הסודית שלך</p>
            <div className="flex items-center justify-center gap-4">
              <p className="text-4xl font-black tracking-tighter leading-tight text-white">{myRole.role}</p>
              <div className={`p-2 rounded-xl ${myRole.isImposter ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                {myRole.isImposter ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
              </div>
            </div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="mt-8 grid gap-4">
          {!myRole.isImposter ? (
            <button onClick={() => setShowVoteModal(true)} className="bg-white text-slate-950 py-5 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              <AlertTriangle size={24} /> חשיפת המתחזה
            </button>
          ) : (
            <button onClick={() => setShowGuessModal(true)} className="bg-amber-400 text-amber-950 py-5 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              <Lightbulb size={24} /> ניחוש המקום
            </button>
          )}
        </div>
      </div>

      {/* מודאלים */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-white text-center italic tracking-tighter uppercase">בחר את החשוד</h2>
            <div className="grid gap-2 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
              {players.filter(p => p.id !== playerId && !gameData.game.playersOut?.[p.id]).map(p => (
                <button key={p.id} onClick={() => handleAccuse(p.id)} className="bg-white/5 p-5 rounded-2xl text-xl font-bold text-white hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between">
                  {p.name} <Users size={20} className="text-white/20" />
                </button>
              ))}
            </div>
            <button onClick={() => setShowVoteModal(false)} className="w-full text-white/30 font-bold mt-6 text-sm hover:text-white/60 transition-colors">בטל פעולה</button>
          </div>
        </div>
      )}

      {showGuessModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-slate-900 w-full max-w-md rounded-[3rem] p-8 flex flex-col max-h-[80vh] border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-amber-400 text-center uppercase italic tracking-tighter">לאן הגענו?</h2>
            <div className="grid gap-2 overflow-y-auto pr-2 custom-scrollbar">
              {situations.map(s => (
                <button key={s.id} onClick={() => handleGuessLocation(s.id)} className="bg-white/5 p-4 rounded-xl text-lg font-bold text-white hover:bg-white/10 border border-white/5 transition-all">
                  {s.name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowGuessModal(false)} className="mt-6 text-white/30 font-bold text-sm hover:text-white/60">חזור למשחק</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;