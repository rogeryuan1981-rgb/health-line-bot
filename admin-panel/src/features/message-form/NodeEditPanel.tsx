import { useState, useEffect } from 'react'
import { X, Save, Youtube } from 'lucide-react' // 👉 刪除了未使用的 LayoutPanelLeft 和 MessageSquare
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

interface NodeEditPanelProps {
  nodeId?: string | null;
}

export default function NodeEditPanel({ nodeId }: NodeEditPanelProps) {
  const [nodeName, setNodeName] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 📡 當 nodeId 改變時，自動從 Firebase 抓取資料
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
      } catch (error) {
        console.error("抓取失敗:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNodeData();
  }, [nodeId]);

  // ⚡ 儲存更新後的影片資料
  const handleSave = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "flowRules", nodeId);
      await updateDoc(docRef, {
        nodeName: nodeName,
        videoTitle: videoTitle,
        videoUrl: videoUrl,
        messageType: "video",
        updatedAt: serverTimestamp()
      });
      alert("✅ 儲存成功！影片資料已同步至 LINE 機器人。");
    } catch (error) {
      console.error("更新失敗:", error);
      alert("儲存失敗，請檢查權限設定。");
    } finally {
      setIsSaving(false);
    }
  };

  if (!nodeId) return null;

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20">
      {/* 標題區 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-foreground">
          {isLoading ? "載入中..." : "編輯節點內容"}
        </h3>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-md">
          <X size={18} />
        </button>
      </div>

      {/* 表單內容 */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {/* 啟動關鍵字 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">啟動關鍵字 (LINE 輸入)</label>
          <input 
            type="text" 
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            disabled={isLoading}
            placeholder="例如：運動教學"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring outline-none"
          />
        </div>

        {/* 影片卡片詳細設定 */}
        <div className="flex flex-col gap-4 p-4 border border-border rounded-lg bg-secondary/20">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Youtube size={16} className="text-destructive" />
            影片卡片設定
          </h4>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">卡片主標題</label>
            <input 
              type="text" 
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              disabled={isLoading}
              placeholder="例如：五分鐘居家伸展操"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">YouTube 影片連結</label>
            <input 
              type="url" 
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isLoading}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
        </div>
      </div>

      {/* 底部按鈕 */}
      <div className="p-4 border-t border-border bg-card">
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? "更新中..." : "儲存並同步"}
        </button>
      </div>
    </div>
  )
}
