import { useState, useEffect } from 'react'
import { X, Save, Youtube, Trash2 } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

interface NodeEditPanelProps {
  nodeId?: string | null;
  onClose: () => void;
}

export default function NodeEditPanel({ nodeId, onClose }: NodeEditPanelProps) {
  const [nodeName, setNodeName] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
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
          setVideoTitle(data.videoTitle || "");
          setVideoUrl(data.videoUrl || "");
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
        nodeName, videoTitle, videoUrl, messageType: "video", updatedAt: serverTimestamp()
      });
      alert("✅ 儲存成功");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!nodeId || !window.confirm("確定要刪除這個關鍵字嗎？這將導致 LINE 機器人無法回應該訊息。")) return;
    try {
      await deleteDoc(doc(db, "flowRules", nodeId));
      onClose(); // 關閉面板
    } catch (error) { alert("刪除失敗"); }
  };

  if (!nodeId) return null;

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold">{isLoading ? "載入中..." : "編輯節點"}</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">關鍵字</label>
          <input type="text" value={nodeName} onChange={(e) => setNodeName(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-primary" />
        </div>

        <div className="p-4 border border-border rounded-lg bg-secondary/20 flex flex-col gap-4">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Youtube size={16} className="text-red-500" />影片設定</h4>
          <input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="影片標題" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none" />
          <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube 連結" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none" />
        </div>

        <button onClick={handleDelete} className="mt-auto flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 py-2 rounded-md transition-colors text-sm font-medium">
          <Trash2 size={16} /> 刪除此節點
        </button>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
          <Save size={18} /> {isSaving ? "儲存中..." : "儲存變更"}
        </button>
      </div>
    </div>
  )
}
