import { useState, useEffect } from 'react'
import { X, Plus, Maximize2, Minimize2, MessageSquare, Image as ImageIcon, Youtube, Layers, Maximize, Square } from 'lucide-react' 
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

interface NodeEditPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeEditPanel({ nodeId, onClose }: NodeEditPanelProps) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", 
    messageType: 'text', 
    cardSize: 'md', 
    imageAspectRatio: 'rectangle',
    textContent: "",
    videoTitle: "",
    videoUrl: "",
    imageUrl: "",
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
    try {
      await updateDoc(doc(db, "flowRules", nodeId), { ...nodeData, updatedAt: serverTimestamp() });
      alert("✅ 全模式設定已發佈至 LINE！");
    } finally { setIsSaving(false); }
  };

  if (!nodeId) return null;

  return (
    <div className="w-[420px] h-full bg-[#1E293B] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-bold text-white text-sm">全功能訊息指揮中心</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide text-white">
        {/* 1. 內建模擬器 */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-white/5 shadow-inner">
          <LineSimulator data={nodeData} />
        </div>

        {/* 2. 類型選擇 */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">回覆模式</label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg">
            {[
              { id: 'text', icon: <MessageSquare size={14}/>, label: '文字' },
              { id: 'image', icon: <ImageIcon size={14}/>, label: '圖片' },
              { id: 'video', icon: <Youtube size={14}/>, label: '影片' },
              { id: 'carousel', icon: <Layers size={14}/>, label: 'FLEX' }
            ].map(t => (
              <button key={t.id} onClick={() => setNodeData({...nodeData, messageType: t.id})} className={`py-2 rounded-md flex flex-col items-center gap-1 transition-all ${nodeData.messageType === t.id ? 'bg-slate-700 text-[#06C755]' : 'text-slate-500'}`}>
                {t.icon} <span className="text-[10px] font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. 尺寸與比例控制 (僅在非純文字模式下顯示) */}
        {nodeData.messageType !== 'text' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">卡片規模</label>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
                <button onClick={() => setNodeData({...nodeData, cardSize: 'md'})} className={`flex-1 py-1.5 rounded flex justify-center ${nodeData.cardSize==='md'?'bg-slate-700 text-white':'text-slate-500'}`}><Maximize2 size={14}/></button>
                <button onClick={() => setNodeData({...nodeData, cardSize: 'sm'})} className={`flex-1 py-1.5 rounded flex justify-center ${nodeData.cardSize==='sm'?'bg-slate-700 text-white':'text-slate-500'}`}><Minimize2 size={14}/></button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">圖片比例</label>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
                <button onClick={() => setNodeData({...nodeData, imageAspectRatio: 'rectangle'})} className={`flex-1 py-1.5 rounded flex justify-center ${nodeData.imageAspectRatio==='rectangle'?'bg-slate-700 text-white':'text-slate-500'}`}><Maximize size={14}/></button>
                <button onClick={() => setNodeData({...nodeData, imageAspectRatio: 'square'})} className={`flex-1 py-1.5 rounded flex justify-center ${nodeData.imageAspectRatio==='square'?'bg-slate-700 text-white':'text-slate-500'}`}><Square size={14}/></button>
              </div>
            </div>
          </div>
        )}

        {/* 4. 動態內容編輯區 */}
        <div className="space-y-4">
          {nodeData.messageType === 'text' && (
            <textarea value={nodeData.textContent} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="請輸入回覆文字內容..." className="w-full bg-slate-900 border-none rounded-xl p-4 text-sm min-h-[120px] outline-none focus:ring-1 ring-[#06C755]" />
          )}

          {(nodeData.messageType === 'image' || nodeData.messageType === 'video') && (
            <div className="space-y-3">
              <input placeholder="卡片標題" value={nodeData.videoTitle} onChange={e => setNodeData({...nodeData, videoTitle: e.target.value})} className="w-full bg-slate-900 border-none rounded-lg px-4 py-3 text-sm outline-none" />
              <input placeholder="圖片/封面 URL" value={nodeData.imageUrl} onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-lg px-4 py-3 text-sm outline-none font-mono text-slate-500" />
              {nodeData.messageType === 'video' && <input placeholder="YouTube / 影片網址" value={nodeData.videoUrl} onChange={e => setNodeData({...nodeData, videoUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-lg px-4 py-3 text-sm outline-none" />}
            </div>
          )}

          {nodeData.messageType === 'carousel' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                <span>FLEX 輪播卡片清單 ({nodeData.cards?.length || 0}/10)</span>
                <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", price: "", imageUrl: "", buttons: [] }]})} className="text-[#06C755] bg-[#06C755]/10 p-1 rounded-full"><Plus size={16}/></button>
              </div>
              {nodeData.cards?.map((card: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2 relative group">
                  <input placeholder="品名" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-sm outline-none" />
                  <input placeholder="價格/描述" value={card.price} onChange={e => { const nc = [...nodeData.cards]; nc[idx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-xs text-red-400 outline-none" />
                  <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={async () => { if(window.confirm("確定刪除節點？")) { await deleteDoc(doc(db, "flowRules", nodeId)); onClose(); } }} className="w-full text-slate-600 text-[10px] uppercase font-bold hover:text-red-500 transition-colors py-4">Delete Node</button>
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95">
          {isSaving ? "同步中..." : "儲存並全能發佈"}
        </button>
      </div>
    </div>
  )
}
