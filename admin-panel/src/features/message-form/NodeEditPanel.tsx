import { useState, useEffect } from 'react'
import { X, Save, Youtube, MessageSquare, Image as ImageIcon, Trash2, Plus, Maximize2, Minimize2 } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export default function NodeEditPanel({ nodeId, onClose, onDataChange }: { nodeId: string | null, onClose: () => void, onDataChange?: (data: any) => void }) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "",
    messageType: 'carousel',
    cardSize: 'md', // 👉 'md' 為標準, 'sm' 為微型 (Micro)
    cards: [{ title: "標題", price: "NT$ 100", imageUrl: "", buttons: [{label: "訂購", target: ""}] }]
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (onDataChange) onDataChange(nodeData);
  }, [nodeData, onDataChange]);

  useEffect(() => {
    const fetch = async () => {
      if (!nodeId) return;
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
    alert("✅ 專業級 Flex 卡片已發佈！");
  };

  if (!nodeId) return null;

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-30">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-bold text-sm">Flex 卡片進階編輯</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 尺寸選擇器 */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">卡片規模 (Bubble Size)</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setNodeData({...nodeData, cardSize: 'md'})}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${nodeData.cardSize === 'md' ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary'}`}
            >
              <Maximize2 size={16} /> 標準尺寸
            </button>
            <button 
              onClick={() => setNodeData({...nodeData, cardSize: 'sm'})}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${nodeData.cardSize === 'sm' ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary'}`}
            >
              <Minimize2 size={16} /> 微型 (Micro)
            </button>
          </div>
        </div>

        {/* 卡片內容編輯 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-foreground">輪播卡片內容</span>
            <button onClick={() => setNodeData({...nodeData, cards: [...nodeData.cards, {title: "", price: "", imageUrl: "", buttons: []}]})} className="text-primary hover:bg-primary/10 p-1 rounded-full"><Plus size={18}/></button>
          </div>
          
          {nodeData.cards.map((card: any, idx: number) => (
            <div key={idx} className="p-4 bg-secondary/40 rounded-2xl border border-border space-y-3 relative group">
              <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
              <input placeholder="品名 (如: 排骨)" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
              <input placeholder="價格 (如: NT$ 100)" value={card.price} onChange={e => { const nc = [...nodeData.cards]; nc[idx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-red-500 font-bold" />
              <input placeholder="圖片網址" value={card.imageUrl} onChange={e => { const nc = [...nodeData.cards]; nc[idx].imageUrl = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-background border border-border rounded px-2 py-1 text-[10px]" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 rounded-xl shadow-lg transition-all">
          <Save size={18} className="inline mr-2" /> 儲存並發佈至 LINE
        </button>
      </div>
    </div>
  )
}
