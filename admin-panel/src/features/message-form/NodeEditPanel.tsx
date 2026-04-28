import { useState, useEffect } from 'react'
import { X, Save, Youtube, MessageSquare, Image as ImageIcon, Trash2, Plus } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

interface NodeEditPanelProps {
  nodeId?: string | null;
  onClose: () => void;
  onDataChange?: (data: any) => void; // 👉 新增：讓畫布知道資料改了
}

export default function NodeEditPanel({ nodeId, onClose, onDataChange }: NodeEditPanelProps) {
  const [nodeName, setNodeName] = useState("");
  const [messageType, setMessageType] = useState('text');
  const [textContent, setTextContent] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttons, setButtons] = useState<{ label: string; target: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 當任何資料改變時，觸發回傳給模擬器
  useEffect(() => {
    if (onDataChange) {
      onDataChange({ nodeName, messageType, textContent, videoTitle, videoUrl, imageUrl, buttons });
    }
  }, [nodeName, messageType, textContent, videoTitle, videoUrl, imageUrl, buttons, onDataChange]);

  useEffect(() => {
    const fetch = async () => {
      if (!nodeId) return;
      const docSnap = await getDoc(doc(db, "flowRules", nodeId));
      if (docSnap.exists()) {
        const d = docSnap.data();
        setNodeName(d.nodeName || "");
        setMessageType(d.messageType || 'text');
        setTextContent(d.textContent || "");
        setVideoTitle(d.videoTitle || "");
        setVideoUrl(d.videoUrl || "");
        setImageUrl(d.imageUrl || "");
        setButtons(d.buttons || []);
      }
    };
    fetch();
  }, [nodeId]);

  const handleSave = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "flowRules", nodeId), {
        nodeName, messageType, textContent, videoTitle, videoUrl, imageUrl, buttons, updatedAt: serverTimestamp()
      });
      alert("✅ 儲存成功！");
    } finally { setIsSaving(false); }
  };

  if (!nodeId) return null;

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm">節點內容設定</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md transition-colors"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-thin">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">啟動關鍵字</label>
          <input type="text" value={nodeName} onChange={(e) => setNodeName(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 ring-primary outline-none" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['text', 'video', 'image'].map((t) => (
            <button key={t} onClick={() => setMessageType(t)} className={`p-2 rounded border-2 text-[10px] flex flex-col items-center gap-1 transition-all ${messageType === t ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary text-muted-foreground'}`}>
              {t === 'text' && <MessageSquare size={16} />}
              {t === 'video' && <Youtube size={16} />}
              {t === 'image' && <ImageIcon size={16} />}
              {t === 'text' ? '純文字' : t === 'video' ? '影片卡片' : '圖片卡片'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {messageType === 'text' && <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="請輸入回覆訊息..." className="w-full bg-background border border-border rounded p-2 text-sm min-h-[100px] outline-none" />}
          {messageType !== 'text' && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
              <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="卡片標題" className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="圖片網址 (https://...)" className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
              {messageType === 'video' && <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube 網址" className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">下一步引導按鈕 ({buttons.length}/5)</label>
            <button onClick={() => buttons.length < 5 && setButtons([...buttons, { label: "", target: "" }])} className="text-primary p-1 hover:bg-primary/10 rounded-full"><Plus size={18} /></button>
          </div>
          {buttons.map((btn, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-lg relative group">
              <button onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
              <input placeholder="按鈕文字" value={btn.label} onChange={(e) => { const nb = [...buttons]; nb[i].label = e.target.value; setButtons(nb); }} className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
              <input placeholder="跳轉關鍵字" value={btn.target} onChange={(e) => { const nb = [...buttons]; nb[i].target = e.target.value; setButtons(nb); }} className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
            </div>
          ))}
        </div>

        <button onClick={async () => { if(window.confirm("確定刪除？")) { await deleteDoc(doc(db, "flowRules", nodeId)); onClose(); } }} className="mt-auto flex items-center justify-center gap-2 text-destructive text-xs py-2 hover:bg-destructive/5 rounded-md"><Trash2 size={14} /> 刪除節點</button>
      </div>

      <div className="p-4 border-t border-border">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
          <Save size={18} /> {isSaving ? "儲存中..." : "儲存並發佈"}
        </button>
      </div>
    </div>
  )
}
