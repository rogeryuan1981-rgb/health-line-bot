import { useState, useEffect } from 'react'
import { X, Plus, Maximize2, Minimize2 } from 'lucide-react' 
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

// 👉 修正 1：移除 onDataChange，讓這個面板完全自給自足
interface NodeEditPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeEditPanel({ nodeId, onClose }: NodeEditPanelProps) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", messageType: 'text', cardSize: 'md', textContent: "",
    cards: [{ title: "標題", price: "", imageUrl: "", buttons: [] }]
  });
  const [isSaving, setIsSaving] = useState(false);

  // 👉 修正 2：直接在本地處理預覽，不再需要 useEffect 往外傳 data

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
    try {
      await updateDoc(doc(db, "flowRules", nodeId), { ...nodeData, updatedAt: serverTimestamp() });
      alert("✅ 發佈成功！");
    } finally {
      setIsSaving(false);
    }
  };

  if (!nodeId) return null;

  return (
    <div className="w-[420px] h-full bg-[#1E293B] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-bold text-white text-sm">節點內容設定</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition-colors">
          <X size={20}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide">
        {/* 內建模擬器：不擋路，隨看隨改 */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-white/5 shadow-inner">
          <LineSimulator data={nodeData} />
        </div>

        {/* 卡片規模切換 */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">卡片規模 (Bubble Size)</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setNodeData({...nodeData, cardSize: 'md'})} className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all ${nodeData.cardSize==='md' ? 'border-[#06C755] bg-[#06C755]/10 text-[#06C755]' : 'border-transparent bg-slate-800 text-slate-400'}`}>
              <Maximize2 size={16}/> 標準尺寸
            </button>
            <button onClick={() => setNodeData({...nodeData, cardSize: 'sm'})} className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all ${nodeData.cardSize==='sm' ? 'border-[#06C755] bg-[#06C755]/10 text-[#06C755]' : 'border-transparent bg-slate-800 text-slate-400'}`}>
              <Minimize2 size={16}/> 微型 (Micro)
            </button>
          </div>
        </div>

        {/* 內容編輯區 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">輪播內容 ({nodeData.cards?.length || 0}/10)</span>
            <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", price: "", imageUrl: "", buttons: [] }]})} className="text-[#06C755] p-1 hover:bg-[#06C755]/10 rounded-full">
              <Plus size={18}/>
            </button>
          </div>
          
          {nodeData.cards?.map((card: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-3 relative group">
              <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 shadow-lg">
                <X size={10}/>
              </button>
              <input placeholder="品名" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-[#06C755]" />
              <input placeholder="價格或描述" value={card.price} onChange={e => { const nc = [...nodeData.cards]; nc[idx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-xs text-red-400 outline-none" />
              <input placeholder="圖片 URL (https://...)" value={card.imageUrl} onChange={e => { const nc = [...nodeData.cards]; nc[idx].imageUrl = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-[10px] text-slate-500 outline-none" />
            </div>
          ))}
        </div>

        <button onClick={async () => { if(window.confirm("確定要刪除這個節點嗎？")) { await deleteDoc(doc(db, "flowRules", nodeId)); onClose(); } }} className="w-full text-red-500/50 hover:text-red-500 text-xs py-4 transition-colors">
          刪除此節點
        </button>
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">
          {isSaving ? "同步中..." : "儲存並發佈"}
        </button>
      </div>
    </div>
  )
}
