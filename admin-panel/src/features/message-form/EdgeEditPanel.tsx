import { useState, useEffect } from 'react'
import { X, Trash2, Palette, Type, Sliders } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'

const COLORS = [
    { label: '螢光綠', value: '#deff9a' },
    { label: '科技藍', value: '#38bdf8' },
    { label: '珊瑚紅', value: '#fb7185' },
    { label: '琥珀金', value: '#fbbf24' },
    { label: '極致白', value: '#ffffff' },
    { label: '低調灰', value: '#64748b' }
];

export default function EdgeEditPanel({ edgeId, onClose }: { edgeId: string | null, onClose: () => void }) {
  // 👉 修正：移除了沒用到的 isSaving 變數
  const [edgeData, setEdgeData] = useState<any>({ color: '#deff9a', strokeWidth: 2, dashed: true });

  useEffect(() => {
    if (!edgeId) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "flowEdges", edgeId));
      if (snap.exists()) setEdgeData(snap.data());
    };
    fetch();
  }, [edgeId]);

  const handleUpdate = async (updates: any) => {
    if (!edgeId) return;
    const newData = { ...edgeData, ...updates };
    setEdgeData(newData);
    await updateDoc(doc(db, "flowEdges", edgeId), updates);
  };

  if (!edgeId) return null;

  return (
    <div className="w-[400px] h-full bg-[#0F172A] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-40 text-white p-6 font-sans">
      <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-5">
        <div className="flex items-center gap-2">
            <Palette className="text-[#deff9a]" size={20} />
            <h3 className="font-black text-sm italic tracking-tighter text-[#deff9a]">LINE STYLE EDITOR</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
      </div>

      <div className="space-y-10 flex-1">
        <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Type size={12}/> 連線顏色 (Color)
            </label>
            <div className="grid grid-cols-3 gap-2">
                {COLORS.map(c => (
                    <button 
                        key={c.value} 
                        onClick={() => handleUpdate({ color: c.value })}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${edgeData.color === c.value ? 'border-[#deff9a] bg-[#deff9a]/10' : 'border-white/5 bg-slate-900'}`}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }}></div>
                        <span className="text-[10px] font-bold">{c.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Sliders size={12}/> 線條粗細 (Width)
            </label>
            <input 
                type="range" min="1" max="10" step="1" 
                value={edgeData.strokeWidth || 2} 
                onChange={(e) => handleUpdate({ strokeWidth: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#deff9a]"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1px</span>
                <span className="text-[#deff9a] font-bold">{edgeData.strokeWidth}px</span>
                <span>10px</span>
            </div>
        </div>

        <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                線條類型 (Type)
            </label>
            <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
                <button 
                    onClick={() => handleUpdate({ dashed: false })}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${!edgeData.dashed ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500'}`}
                >
                    實線 (Solid)
                </button>
                <button 
                    onClick={() => handleUpdate({ dashed: true })}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${edgeData.dashed ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500'}`}
                >
                    虛線 (Dashed)
                </button>
            </div>
        </div>
      </div>

      <div className="pt-10 border-t border-white/5">
        <button 
            onClick={async () => { if(window.confirm("移除這條連線？")) { await deleteDoc(doc(db, "flowEdges", edgeId)); onClose(); } }}
            className="w-full py-4 text-red-500/50 hover:text-red-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors"
        >
            <Trash2 size={14}/> Remove Connection
        </button>
      </div>
    </div>
  )
}
