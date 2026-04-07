import React, { useEffect } from 'react';
import { BookOpen, CheckCircle, Search, Image as ImageIcon, MessageCircle, Trophy } from 'lucide-react';
import { situations } from './data';

const RulesScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  useEffect(() => {
    situations.forEach(s => { const img = new Image(); img.src = s.imageUrl; });
  }, []);

  const rules = [
    { icon: <Search size={24}/>, text: "מגלים מי המתחזה בחדר" },
    { icon: <ImageIcon size={24}/>, text: "כולם רואים תמונה - חוץ מהמתחזה" },
    { icon: <MessageCircle size={24}/>, text: "שואלים שאלות זהירות על המקום" },
    { icon: <Trophy size={24}/>, text: "הראשון ל-100 נקודות מנצח" }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center" dir="rtl">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/10 p-10 shadow-2xl">
        <div className="bg-indigo-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen size={40} className="text-indigo-400" />
        </div>
        <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase italic">איך משחקים?</h1>
        
        <div className="space-y-4 mb-10">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-right">
              <div className="text-indigo-400">{rule.icon}</div>
              <p className="text-lg font-bold text-white/80 leading-tight">{rule.text}</p>
            </div>
          ))}
        </div>

        <button onClick={onStart} className="w-full bg-white text-slate-950 py-5 rounded-2xl text-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          <CheckCircle size={28} /> הבנתי, למשחק!
        </button>
      </div>
    </div>
  );
};

export default RulesScreen;