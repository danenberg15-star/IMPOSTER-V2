import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { AlertTriangle, Lightbulb, EyeOff, Trophy, Users, X, Play } from 'lucide-react';
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

          // תיקון קריטי: רק מנהל החדר מריץ את הניצחון כדי למנוע חלוקת ניקוד כפולה
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
        "meta/lastWinner": 'הַמִּתְחַזֶּה נִיצֵּחַ! כֻּלָּם טָעוּ בַּדֶּרֶךְ.'
      });
    }
  };

  if (!gameData || !gameData.game?.roles) return <div className="p-10 text-center text-2xl font-bold">טּוֹעֵן...</div>;

  const myRole = gameData.game.roles[playerId];
  const isOut = gameData.game.playersOut?.[playerId];
  const situation = gameData.meta.currentSituation;
  const players = Object.values(gameData.players) as any[];
  
  // תיקון: אם כמה הגיעו ל-100, המנצח הוא זה עם הניקוד הגבוה ביותר
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
    
    if (isTargetImposter) {
      const currentScore = gameData.players[playerId].score || 0;
      await update(ref(db, `rooms/${roomId}`), {
        [`players/${playerId}/score`]: currentScore + 40,
        [`game/roundDeltas/${playerId}`]: 40,
        "meta/status": 'round_over',
        "meta/lastWinner": `כָּל הַכָּבוֹד לְ-${gameData.players[playerId].name}! הַמִּתְחַזֶּה נִתְפַּס!`
      });
    } else {
      const currentScore = gameData.players[playerId].score || 0;
      await update(ref(db, `rooms/${roomId}`), {
        // הוסר עיגול הניקוד לאפס - הניקוד יכול לרדת למינוס
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
        "meta/lastWinner": 'הַמִּתְחַזֶּה נִיצֵּחַ! הוּא יָדַע אֶת הַמָּקוֹם.'
      });
    } else {
      const updates: any = {
        "meta/status": 'round_over',
        "meta/lastWinner": 'הַמִּתְחַזֶּה טָעָה בַּמָּקוֹם! הַשְּׁאָר נִיצְּחוּ.',
        // הוסר עיגול הניקוד לאפס - הניקוד יכול לרדת למינוס
        [`players/${playerId}/score`]: currentScore - 20,
        [`game/roundDeltas/${playerId}`]: -20
      };

      players.forEach(p => {
        // תיקון קריטי: מעניקים 10+ רק למי שאינו המתחזה, ורק למי שלא נפסל קודם לכן בסיבוב
        if (p.id !== playerId && !gameData.game.playersOut?.[p.id]) {
          const pScore = p.score || 0;
          updates[`players/${p.id}/score`] = pScore + 10;
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
      <div className="fixed inset-0 bg-yellow-400 flex flex-col items-center justify-center p-6 z-[100] text-center" dir="rtl">
        <Trophy size={140} className="text-white animate-bounce mb-6" />
        <h1 className="text-6xl font-black text-white mb-4 italic">נִיצָּחוֹן!</h1>
        <p className="text-5xl font-bold text-yellow-900 mb-10">{winner.name} נִיצֵּחַ!</p>
        <button onClick={handleFinalExit} className="bg-white/30 text-white font-black text-2xl py-4 px-10 rounded-3xl shadow-xl active:scale-95 transition-all">
          סַיֵּם מִשְׂחָק וַחֲזוֹר לַלּוֹבִּי
        </button>
      </div>
    );
  }

  if (gameData.meta.status === 'round_over') {
    return (
      <div className="min-h-screen bg-blue-700 flex flex-col items-center justify-center p-4 text-white relative" dir="rtl">
        <div className="w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl text-blue-900">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-blue-500 mb-2 italic">{gameData.meta.lastWinner}</h2>
            <h1 className="text-5xl font-black italic">טַבְלַת הַנִּקּוּד</h1>
          </div>
          <div className="space-y-4 mb-8">
            {players.sort((a,b) => (b.score || 0) - (a.score || 0)).map((p, idx) => {
              const delta = gameData.game.roundDeltas?.[p.id] || 0;
              return (
                <div key={p.id} className="flex justify-between items-center bg-blue-50 p-5 rounded-2xl border-2 border-blue-100">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black opacity-30">{idx + 1}</span>
                    <span className="text-3xl font-bold">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    {delta !== 0 && (
                      <div className={`px-3 py-1 rounded-full font-black text-xl text-white ${delta > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                        {delta > 0 ? `+${delta}` : delta}
                      </div>
                    )}
                    <span className="text-4xl font-black text-blue-800">{p.score || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {isHost ? (
            <button onClick={startNewRound} className="w-full bg-green-500 text-white py-6 rounded-3xl text-3xl font-black shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all">
              <Play size={32} fill="currentColor" /> הַמְשֵׁךְ לַסִּיבּוּב הַבָּא
            </button>
          ) : (
            <p className="text-2xl font-bold text-center text-blue-300 animate-pulse italic mt-4">
              מְחַכִּים שֶׁהַמְּנַהֵל יַמְשִׁיךְ...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isOut) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl">
          <X size={140} className="text-red-500 mb-6 mx-auto" />
          <h1 className="text-6xl font-black text-red-600 mb-4">אוֹי! טָעִיתָ!</h1>
          <p className="text-3xl text-red-400 font-bold">נַחְכֶּה לַסִּיבּוּב הַבָּא...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-white p-4" dir="rtl">
      <div className="w-full max-w-2xl aspect-video rounded-[40px] overflow-hidden shadow-2xl mb-6 border-8 border-blue-100 flex items-center justify-center bg-gray-50">
        {!myRole.isImposter ? (
          <img src={situation.imageUrl} className="w-full h-full object-cover" alt="situation" />
        ) : (
          <div className="text-center">
            <EyeOff size={100} className="text-red-400 mx-auto" />
            <h2 className="text-4xl font-black text-red-600 italic">הַמָּקוֹם סוֹדִי!</h2>
          </div>
        )}
      </div>
      <div className="text-center w-full max-w-md">
        {!myRole.isImposter && <h1 className="text-6xl font-black text-blue-900 mb-6">{situation.name}</h1>}
        <div className={`p-8 rounded-[40px] shadow-lg border-4 ${myRole.isImposter ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-2xl font-bold mb-1 opacity-60 italic">הַתַּפְקִיד שֶׁלְּךָ:</p>
          <p className={`text-6xl font-black ${myRole.isImposter ? 'text-red-600' : 'text-green-700'}`}>
            {myRole.role}
          </p>
        </div>
        <div className="mt-8 grid gap-4">
          {!myRole.isImposter ? (
            <button onClick={() => setShowVoteModal(true)} className="bg-red-500 text-white py-6 rounded-3xl text-4xl font-black shadow-xl">
              <AlertTriangle size={40} className="inline ml-2" /> חֲשׂוֹף מִתְחַזֶּה!
            </button>
          ) : (
            <button onClick={() => setShowGuessModal(true)} className="bg-yellow-400 text-yellow-900 py-6 rounded-3xl text-4xl font-black shadow-xl">
              <Lightbulb size={40} className="inline ml-2" /> אֲנִי יוֹדֵעַ אֶת הַמָּקוֹם!
            </button>
          )}
        </div>
      </div>

      {showVoteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-black mb-6 text-blue-800">מִי הַמִּתְחַזֶּה?</h2>
            <div className="grid gap-3">
              {players.filter(p => p.id !== playerId && !gameData.game.playersOut?.[p.id]).map(p => (
                <button key={p.id} onClick={() => handleAccuse(p.id)} className="bg-blue-50 p-6 rounded-2xl text-3xl font-bold hover:bg-blue-100 flex items-center justify-center gap-3">
                  <Users size={28} /> {p.name}
                </button>
              ))}
              <button onClick={() => setShowVoteModal(false)} className="text-gray-400 font-bold underline mt-6 text-xl">בִּיטּוּל</button>
            </div>
          </div>
        </div>
      )}

      {showGuessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 text-center flex flex-col max-h-[85vh] shadow-2xl">
            <h2 className="text-4xl font-black mb-6 text-orange-600 italic">אֵיפֹה אֲנַחְנוּ?</h2>
            <div className="grid gap-2 overflow-y-auto pr-2">
              {situations.map(s => (
                <button key={s.id} onClick={() => handleGuessLocation(s.id)} className="bg-orange-50 p-5 rounded-2xl text-2xl font-bold border-2 border-orange-100 hover:bg-orange-200">
                  {s.name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowGuessModal(false)} className="mt-6 text-gray-400 font-bold underline text-xl">סְגִירָה</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;