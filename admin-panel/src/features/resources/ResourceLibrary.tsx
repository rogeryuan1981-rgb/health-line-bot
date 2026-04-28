import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Video, Image as ImageIcon } from 'lucide-react'; // 👉 修正 4：移除未使用圖示

export default function ResourceLibrary() {
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "flowRules"), (snap) => {
      setResources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-10 h-full overflow-y-auto bg-slate-950 text-white scrollbar-hide">
      <div className="mb-10">
        <h2 className="text-4xl font-black italic tracking-tighter text-[#06C755]">RESOURCE LIBRARY</h2>
        <p className="text-slate-500 font-bold uppercase text-xs mt-2">共 {resources.length} 筆自動回覆資源</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {resources.map((res) => (
          <div key={res.id} className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden group hover:border-[#06C755]/50 transition-all shadow-xl">
            <div className="aspect-[4/3] bg-slate-800 relative">
              <img src={res.imageUrl || res.cards?.[0]?.imageUrl || "https://via.placeholder.com/400"} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Preview" />
              <div className="absolute top-4 left-4 bg-black/70 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#06C755]">
                {res.messageType || 'FLEX'}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-sm truncate text-slate-100">{res.nodeName}</h3>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {res.messageType === 'video' ? <Video size={16} className="text-red-500"/> : <ImageIcon size={16} className="text-blue-500"/>}
                  <span className="text-[10px] text-slate-600 font-mono">ID: {res.id.slice(0,6)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
