import React, { useEffect } from 'react';
import { BookOpen, CheckCircle, Search, Image as ImageIcon, MessageCircle, Trophy, Target } from 'lucide-react';
import { situations } from './data';

const RulesScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  useEffect(() => {
    // Preload images for better performance
    situations.forEach(s => { const img = new Image(); img.src = s.imageUrl; });
  }, []);

  const rules = [
    { 
      icon: <ImageIcon size={24}/>, 
      title: "הזהות הסודית", 
      text: "כולם רואים את המיקום והתמונה - חוץ מהמתחזה." 
    },
    { 
      icon: <MessageCircle size={24}/>, 
      title: "החקירה", 
      text: "שואלים שאלות זהירות אחד את השני כדי לנסות להבין מי משקר." 
    },
    { 
      icon: <Search size={24}/>, 
      title: "מטרת הצוות", 
      text: "לחשוף את המתחזה. זיהוי נכון יעניק לכם 40+ נקודות. טעות בזיהוי תעלה לכם ב-20- נקודות והדחה מהסיבוב." 
    },
    { 
      icon: <Target size={24}/>, 
      title: "מטרת המתחזה", 
      text: "להבין את הסיטואציה ולנחש את המקום. ניחוש נכון או הישרדות יעניקו לך 40+ נקודות. טעות בניחוש תעלה לך ב-20- נקודות." 
    },
    { 
      icon: <Trophy size={24}/>, 
      title: "הניצחון", 
      text: "השחקן הראשון שצובר 100 נקודות מנצח במשחק כולו." 
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <img src="/icon.png" className="w-24 h-24 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-2 border-white/10" alt="logo" />
          <h1 className="text-3xl font-black text-white tracking-tighter italic">הַמִּתְחַזֶּה</h1>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="bg-indigo-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={32} className="text-indigo-400" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase italic border-b border-white/5 pb-4">איך משחקים?</h2>
          
          <div className="space-y-6 mb-10">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex flex-col gap-2 text-right">
                <div className="flex items-center gap-3">
                    <div className="text-indigo-400 shrink-0 p-2 bg-white/5 rounded-xl">{rule.icon}</div>
                    <p className="text-xl font-black text-white leading-tight">{rule.title}</p>
                </div>
                <p className="text-base font-medium text-white/60 leading-relaxed pr-2">{rule.text}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={onStart} 
            className="w-full bg-white text-slate-950 py-5 rounded-2xl text-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 sticky bottom-0"
          >
            <CheckCircle size={28} /> הבנתי, למשחק!
          </button>
        </div>
        
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">גרסה 2.0.1 • 2026</p>
      </div>
    </div>
  );
};

export default RulesScreen;