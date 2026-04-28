import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Maximize2, Minimize2, Layers, MessageSquare, Youtube, Image as ImageIcon } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", messageType: 'text', cardSize: 'md', textContent: "",
    cards: [{ title: "標題", price: "", imageUrl: "", buttons: [] }]
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "flowRules", nodeId));
      if (snap.exists()) setNodeData(snap.data());
    };
    fetch();
  }, [nodeId]);

  const handleSave = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    await updateDoc(doc(db, "flowRules", nodeId), { ...nodeData, updatedAt: serverTimestamp() });
    setIsSaving(false);
    alert("✅ 內容已全球發佈！");
  };

  if (!nodeId) return null;

  return (
    <div className="w-[420px] h-full bg-[#1E293B] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-bold text-white">對話配置中心 v3.0</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide">
        {/* 內建模擬器：解決遮擋問題 */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-white/5 shadow-inner">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Live Preview</p>
          <LineSimulator data={nodeData} />
        </div>

        {/* 模式與尺寸 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setNodeData({...nodeData, cardSize: 'md'})} className={`p-3 rounded-xl border-2 flex items-center gap-2 text-xs font-bold ${nodeData.cardSize==='md' ? 'border-[#06C755] bg-[#06C755]/10 text-[#06C755]' : 'border-transparent bg-slate-800 text-slate-400'}`}>
              <Maximize2 size={16}/> 標準尺寸
            </button>
            <button onClick={() => setNodeData({...nodeData, cardSize: 'sm'})} className={`p-3 rounded-xl border-2 flex items-center gap-2 text-xs font-bold ${nodeData.cardSize==='sm' ? 'border-[#06C755] bg-[#06C755]/10 text-[#06C755]' : 'border-transparent bg-slate-800 text-slate-400'}`}>
              <Minimize2 size={16}/> 微型 (Micro)
            </button>
          </div>
        </div>

        {/* 類型切換 */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg">
          {['text', 'video', 'image', 'carousel'].map(t => (
            <button key={t} onClick={() => setNodeData({...nodeData, messageType: t})} className={`flex-1 py-2 rounded-md text-[10px] font-bold transition-all ${nodeData.messageType === t ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 卡片陣列編輯器 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
            <span>輪播卡片內容 ({nodeData.cards?.length || 0}/10)</span>
            <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", price: "", imageUrl: "", buttons: [] }]})} className="text-[#06C755]"><Plus size={18}/></button>
          </div>
          {nodeData.cards?.map((card: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-800/50 rounded-xl border border-white/5 space-y-3 relative group">
              <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={12}/></button>
              <input placeholder="卡片標題" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-sm text-white" />
              <input placeholder="描述/價格" value={card.price} onChange={e => { const nc = [...nodeData.cards]; nc[idx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-xs text-red-400" />
              <input placeholder="圖片網址" value={card.imageUrl} onChange={e => { const nc = [...nodeData.cards]; nc[idx].imageUrl = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-[10px] text-slate-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">
          <Save size={18} className="inline mr-2" /> {isSaving ? "同步中..." : "儲存並發佈"}
        </button>
      </div>
    </div>
  )
}
