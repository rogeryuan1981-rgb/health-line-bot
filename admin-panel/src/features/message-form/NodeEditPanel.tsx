import { useState, useEffect } from 'react'
import { X, Save, Youtube, MessageSquare, Image as ImageIcon, Trash2 } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

interface NodeEditPanelProps {
  nodeId?: string | null;
  onClose: () => void;
}

type MessageType = 'text' | 'video' | 'image';

export default function NodeEditPanel({ nodeId, onClose }: NodeEditPanelProps) {
  const [nodeName, setNodeName] = useState("");
  const [messageType, setMessageType] = useState<MessageType>('text');
  
  // 各類型內容 State
  const [textContent, setTextContent] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNodeData = async () => {
      if (!nodeId) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, "flowRules", nodeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNodeName(data.nodeName || "");
          setMessageType(data.messageType || 'text');
          setTextContent(data.textContent || "");
          setVideoTitle(data.videoTitle || "");
          setVideoUrl(data.videoUrl || "");
          setImageUrl(data.imageUrl || "");
        }
      } finally { setIsLoading(false); }
    };
    fetchNodeData();
  }, [nodeId]);

  const handleSave = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "flowRules", nodeId), {
        nodeName,
        messageType,
        textContent,
        videoTitle,
        videoUrl,
        imageUrl,
        updatedAt: serverTimestamp()
      });
      alert("✅ 全功能同步成功！");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!nodeId || !window.confirm("確定刪除此節點？")) return;
    await deleteDoc(doc(db, "flowRules", nodeId));
    onClose();
  };

  if (!nodeId) return null;

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20 text-foreground">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold">{isLoading ? "載入中..." : "節點進階設定"}</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {/* 啟動關鍵字 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">啟動關鍵字</label>
          <input type="text" value={nodeName} onChange={(e) => setNodeName(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-primary" />
        </div>

        {/* 類型選擇器 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">回覆類型</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setMessageType('text')}
              className={`flex flex-col items-center gap-1 p-2 rounded-md border-2 transition-all ${messageType === 'text' ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'}`}
            >
              <MessageSquare size={18} /> <span className="text-[10px]">純文字</span>
            </button>
            <button 
              onClick={() => setMessageType('video')}
              className={`flex flex-col items-center gap-1 p-2 rounded-md border-2 transition-all ${messageType === 'video' ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'}`}
            >
              <Youtube size={18} /> <span className="text-[10px]">影片卡片</span>
            </button>
            <button 
              onClick={() => setMessageType('image')}
              className={`flex flex-col items-center gap-1 p-2 rounded-md border-2 transition-all ${messageType === 'image' ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'}`}
            >
              <ImageIcon size={18} /> <span className="text-[10px]">圖片訊息</span>
            </button>
          </div>
        </div>

        {/* 動態表單內容 */}
        <div className="space-y-4">
          {messageType === 'text' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">回覆文字內容</label>
              <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-primary" placeholder="請輸入回覆文字..." />
            </div>
          )}

          {messageType === 'video' && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
              <input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="卡片標題" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none" />
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube 連結" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none" />
            </div>
          )}

          {messageType === 'image' && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="圖片網址 (需為 https)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none" />
              <p className="text-[10px] text-muted-foreground">提示：請使用直接圖檔連結 (如 .jpg, .png)</p>
            </div>
          )}
        </div>

        <button onClick={handleDelete} className="mt-auto flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 py-2 rounded-md transition-colors text-sm font-medium">
          <Trash2 size={16} /> 刪除節點
        </button>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
          <Save size={18} /> {isSaving ? "同步中..." : "儲存並發佈"}
        </button>
      </div>
    </div>
  )
}
