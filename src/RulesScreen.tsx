import React, { useEffect } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import { situations } from './data';

const RulesScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  useEffect(() => {
    // טעינת תמונות ברקע ברגע שהמסך עולה
    situations.forEach(s => {
      const img = new Image();
      img.src = s.imageUrl;
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-600 p-6 text-white text-center" dir="rtl">
      <div className="bg-white text-blue-900 rounded-3xl p-8 shadow-2xl max-w-md w-full">
        <BookOpen size={60} className="mx-auto mb-4 text-blue-500" />
        <h1 className="text-4xl font-black mb-6">אֵיךְ מְשַׂחֲקִים?</h1>
        <ul className="text-2xl space-y-4 mb-8 text-right font-bold">
          <li>🕵️‍♂️ מְגַלִּים מִי הַמִּתְחַזֶּה.</li>
          <li>🖼️ כֻּלָּם רוֹאִים תְּמוּנָה - חוּץ מֵהַמִּתְחַזֶּה!</li>
          <li>❓ שׁוֹאֲלִים שְׁאֵלוֹת עַל הַמָּקוֹם.</li>
          <li>🏆 הָרִאשׁוֹן שֶׁמַּגִּיעַ לְ-100 נְצַח!</li>
        </ul>
        <button onClick={onStart} className="w-full bg-green-500 text-white py-6 rounded-2xl text-3xl font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
          <CheckCircle size={32} /> הֵבַנְתִּי, לַמִּשְׁחָק!
        </button>
      </div>
    </div>
  );
};

export default RulesScreen;