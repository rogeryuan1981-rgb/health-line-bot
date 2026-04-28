import { useState, useEffect } from 'react'
import { X, Save, Youtube, MessageSquare, Image as ImageIcon, Trash2, Plus, Maximize, Square } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'

interface NodeEditPanelProps {
  nodeId?: string | null;
  onClose: () => void;
  onDataChange?: (data: any) => void;
}

export default function NodeEditPanel({ nodeId, onClose, onDataChange }: NodeEditPanelProps) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "",
    messageType: 'text',
    textContent: "",
    videoTitle: "",
    videoUrl: "",
    imageUrl: "",
    imageAspectRatio: 'rectangle', // 👉 預設長方形
    buttons: []
  });
  const [isSaving, setIsSaving] = useState(false);

  // 📡 當任何欄位改變，同步給模擬器
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
    alert("✅ 設定已更新，模擬器與 LINE 同步生效！");
  };

  if (!nodeId) return null;

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-bold text-sm">進階設定</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 基本設定 */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">啟動關鍵字</label>
          <input 
            type="text" 
            value={nodeData.nodeName} 
            onChange={(e) => setNodeData({...nodeData, nodeName: e.target.value})} 
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-primary text-foreground" 
          />
        </div>

        {/* 1. 比例選擇 (尺寸控制項) */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">卡片顯示比例</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setNodeData({...nodeData, imageAspectRatio: 'rectangle'})}
              className={`flex items-center justify-center gap-2 p-2 rounded border-2 transition-all text-xs font-bold ${nodeData.imageAspectRatio === 'rectangle' ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary text-muted-foreground'}`}
            >
              <Maximize size={14} /> 長方形 (1.51:1)
            </button>
            <button 
              onClick={() => setNodeData({...nodeData, imageAspectRatio: 'square'})}
              className={`flex items-center justify-center gap-2 p-2 rounded border-2 transition-all text-xs font-bold ${nodeData.imageAspectRatio === 'square' ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary text-muted-foreground'}`}
            >
              <Square size={14} /> 正方形 (1:1)
            </button>
          </div>
        </div>

        {/* 類型切換 (簡化顯示) */}
        <div className="flex gap-1">
          {['text', 'video', 'image'].map((t) => (
            <button key={t} onClick={() => setNodeData({...nodeData, messageType: t})} className={`flex-1 p-2 rounded text-[10px] border-2 transition-all ${nodeData.messageType === t ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-secondary text-muted-foreground'}`}>
              {t === 'text' ? '純文字' : t === 'video' ? '影音' : '圖片'}
            </button>
          ))}
        </div>

        {/* 內容設定 */}
        <div className="space-y-4">
          {nodeData.messageType !== 'text' && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
              <input placeholder="卡片標題" value={nodeData.videoTitle} onChange={(e) => setNodeData({...nodeData, videoTitle: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground" />
              <input placeholder="圖片/封面網址" value={nodeData.imageUrl} onChange={(e) => setNodeData({...nodeData, imageUrl: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground" />
            </div>
          )}
          {nodeData.messageType === 'text' && <textarea value={nodeData.textContent} onChange={(e) => setNodeData({...nodeData, textContent: e.target.value})} placeholder="文字內容..." className="w-full bg-background border border-border rounded p-2 text-sm min-h-[100px] text-foreground" />}
        </div>

        {/* 引導按鈕 (限制最多5個) */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">引導按鈕 ({nodeData.buttons?.length || 0}/5)</label>
            <button onClick={() => { if((nodeData.buttons?.length || 0) < 5) setNodeData({...nodeData, buttons: [...(nodeData.buttons || []), {label: "", target: ""}]}) }} className="text-primary p-1 hover:bg-primary/10 rounded-full"><Plus size={18} /></button>
          </div>
          {nodeData.buttons?.map((btn: any, i: number) => (
            <div key={i} className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-lg relative">
              <input placeholder="按鈕文字" value={btn.label} onChange={(e) => { const nb = [...nodeData.buttons]; nb[i].label = e.target.value; setNodeData({...nodeData, buttons: nb}); }} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground" />
              <input placeholder="觸發關鍵字" value={btn.target} onChange={(e) => { const nb = [...nodeData.buttons]; nb[i].target = e.target.value; setNodeData({...nodeData, buttons: nb}); }} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground" />
              <button onClick={() => { const nb = nodeData.buttons.filter((_:any, idx:number) => idx !== i); setNodeData({...nodeData, buttons: nb}); }} className="absolute -top-1 -right-1 text-destructive hover:bg-red-50 rounded-full"><X size={14} /></button>
            </div>
          ))}
        </div>

        <button onClick={async () => { if(window.confirm("確定刪除？")) { await deleteDoc(doc(db, "flowRules", nodeId)); onClose(); } }} className="mt-10 w-full flex items-center justify-center gap-2 text-destructive text-xs py-2 hover:bg-destructive/5 rounded-md"><Trash2 size={14} /> 刪除節點</button>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
          <Save size={18} /> {isSaving ? "儲存中..." : "儲存設定"}
        </button>
      </div>
    </div>
  )
}
