import { useState, useEffect } from 'react';
import Lobby from './Lobby';
import WaitingRoom from './WaitingRoom';
import GameBoard from './GameBoard';
import RulesScreen from './RulesScreen';
import { db } from './firebase';
import { ref, onValue, remove } from 'firebase/database';

function App() {
  const [showRules, setShowRules] = useState(() => !localStorage.getItem('imposter_rules_seen'));
  const [roomData, setRoomData] = useState<{ roomId: string; playerId: string; isHost: boolean } | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'round_over' | 'finished'>('waiting');

  useEffect(() => {
    const saved = localStorage.getItem('imposter_session');
    if (saved) setRoomData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (roomData?.roomId) {
      return onValue(ref(db, `rooms/${roomData.roomId}/meta/status`), (snap) => {
        setGameStatus(snap.val() || 'waiting');
      });
    }
  }, [roomData?.roomId]);

  const handleExit = async () => {
    if (!roomData) return;
    if (roomData.isHost) {
      await remove(ref(db, `rooms/${roomData.roomId}`));
    } else {
      await remove(ref(db, `rooms/${roomData.roomId}/players/${roomData.playerId}`));
    }
    localStorage.removeItem('imposter_session');
    setRoomData(null);
    window.location.reload();
  };

  if (showRules) return <RulesScreen onStart={() => {
    localStorage.setItem('imposter_rules_seen', 'true');
    setShowRules(false);
  }} />;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* כפתור יציאה - עבר לצד שמאל למטה */}
      {roomData && (
        <button 
          onClick={handleExit} 
          className="fixed bottom-6 left-6 z-[150] bg-red-100 text-red-600 p-4 rounded-2xl font-black border-2 border-red-200 shadow-lg active:scale-95 transition-all"
        >
          יְצִיאָה
        </button>
      )}

      {!roomData ? (
        <Lobby onJoinRoom={(r, p, h) => {
          const data = { roomId: r, playerId: p, isHost: h };
          setRoomData(data);
          localStorage.setItem('imposter_session', JSON.stringify(data));
        }} />
      ) : (
        gameStatus === 'waiting' ? (
          <WaitingRoom roomId={roomData.roomId} playerId={roomData.playerId} isHost={roomData.isHost} />
        ) : (
          <GameBoard roomId={roomData.roomId} playerId={roomData.playerId} />
        )
      )}
    </div>
  );
}

export default App;