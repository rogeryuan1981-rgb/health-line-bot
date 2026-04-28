import { useState, useEffect } from 'react'
import { X, Save, Youtube, MessageSquare, Image as ImageIcon, Trash2, Plus, Layers } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  const [nodeData, setNodeData] = useState<any>({ nodeName: "", messageType: 'text', cards: [] });
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
    alert("✅ 彈性內容已同步！");
  };

  if (!nodeId) return null;

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-30">
      <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/30">
        <h3 className="font-bold text-sm">節點深度編輯 (v3.0)</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
        {/* 1. 預覽區域 (解決遮擋，改放在面板內部上方) */}
        <div className="rounded-xl overflow-hidden border border-border shadow-inner bg-black/5">
          <LineSimulator data={nodeData} isEmbedded={true} />
        </div>

        {/* 2. 基本資訊 */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">關鍵字</label>
          <input value={nodeData.nodeName} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
        </div>

        {/* 3. 模式切換 */}
        <div className="grid grid-cols-4 gap-1">
          {['text', 'video', 'image', 'carousel'].map(t => (
            <button key={t} onClick={() => setMessageType(t)} className={`p-2 rounded text-[10px] flex flex-col items-center gap-1 border-2 ${nodeData.messageType === t ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary'}`}>
              {t === 'carousel' ? <Layers size={14}/> : <MessageSquare size={14}/>} {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 4. Carousel 編輯器 (多層引導核心) */}
        {nodeData.messageType === 'carousel' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">輪播卡片清單 ({nodeData.cards?.length || 0}/10)</span>
              <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", description: "", buttons: [] }]})} className="text-primary"><Plus size={16}/></button>
            </div>
            {nodeData.cards?.map((card: any, idx: number) => (
              <div key={idx} className="p-3 bg-secondary/50 rounded-lg border border-border space-y-2">
                <input placeholder="卡片標題" value={card.title} onChange={e => { const newCards = [...nodeData.cards]; newCards[idx].title = e.target.value; setNodeData({...nodeData, cards: newCards}) }} className="w-full bg-background border-none text-xs font-bold" />
                <input placeholder="圖片 URL" value={card.imageUrl} onChange={e => { const newCards = [...nodeData.cards]; newCards[idx].imageUrl = e.target.value; setNodeData({...nodeData, cards: newCards}) }} className="w-full bg-background border-none text-[10px]" />
                <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="text-destructive text-[10px]">刪除此張</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center gap-2">
          <Save size={18}/> {isSaving ? "同步中..." : "儲存並發佈"}
        </button>
      </div>
    </div>
  )
}
