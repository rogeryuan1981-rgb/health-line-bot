import { useState, useEffect } from 'react'
import { X, Plus, Maximize2, Minimize2, Layers, MessageSquare, Youtube, Image as ImageIcon } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

interface NodeEditPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeEditPanel({ nodeId, onClose }: NodeEditPanelProps) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", messageType: 'text', cardSize: 'md', imageAspectRatio: 'rectangle',
    textContent: "", videoTitle: "", videoUrl: "", imageUrl: "",
    cards: []
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
    alert("✅ 發佈成功！");
  };

  if (!nodeId) return null;

  return (
    <div className="w-[420px] h-full bg-[#1E293B] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-bold text-sm">全能訊息配置</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
        {/* 預覽區 */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-white/5">
          <LineSimulator data={nodeData} />
        </div>

        {/* 類型與尺寸 */}
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg">
            {[{id:'text', i:<MessageSquare size={14}/>}, {id:'image', i:<ImageIcon size={14}/>}, {id:'video', i:<Youtube size={14}/>}, {id:'carousel', i:<Layers size={14}/>}].map(t => (
              <button key={t.id} onClick={() => setNodeData({...nodeData, messageType: t.id})} className={`py-2 rounded flex flex-col items-center gap-1 ${nodeData.messageType === t.id ? 'bg-slate-700 text-[#06C755]' : 'text-slate-500'}`}>
                {t.i} <span className="text-[10px] uppercase">{t.id}</span>
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setNodeData({...nodeData, cardSize: 'md'})} className={`p-2 rounded border-2 text-[10px] font-bold ${nodeData.cardSize==='md'?'border-[#06C755] bg-[#06C755]/10':'border-transparent bg-slate-800 text-slate-500'}`}><Maximize2 size={14} className="inline mr-1"/> MEGA</button>
            <button onClick={() => setNodeData({...nodeData, cardSize: 'sm'})} className={`p-2 rounded border-2 text-[10px] font-bold ${nodeData.cardSize==='sm'?'border-[#06C755] bg-[#06C755]/10':'border-transparent bg-slate-800 text-slate-500'}`}><Minimize2 size={14} className="inline mr-1"/> MICRO</button>
          </div>
        </div>

        {/* 內容編輯 */}
        <div className="space-y-4">
          <input placeholder="啟動關鍵字" value={nodeData.nodeName} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 border-none rounded-lg px-4 py-2 text-sm" />
          
          {nodeData.messageType === 'carousel' ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>卡片列表 ({nodeData.cards?.length || 0}/10)</span>
                <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), {title: "", price: "", imageUrl: ""}]})} className="text-[#06C755]"><Plus size={18}/></button>
              </div>
              {nodeData.cards?.map((card: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-800 rounded-xl space-y-2 border border-white/5">
                  <input placeholder="品名" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-2 py-1 text-xs" />
                  <input placeholder="價格" value={card.price} onChange={e => { const nc = [...nodeData.cards]; nc[idx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-2 py-1 text-[10px] text-red-400" />
                </div>
              ))}
            </div>
          ) : (
            <textarea value={nodeData.textContent} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="訊息內容..." className="w-full bg-slate-900 border-none rounded-xl p-4 text-sm min-h-[100px]" />
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all">
          儲存並全能實裝
        </button>
      </div>
    </div>
  )
}
