import { useState, useEffect } from 'react' // 👉 加上 useEffect
import { X, Save, Youtube, LayoutPanelLeft, MessageSquare } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore' // 👉 改用讀取與更新功能
import { db } from '../../firebase' 

// 🎯 關鍵修正：定義面板可以接收的參數 (Props)
interface NodeEditPanelProps {
  nodeId?: string | null;
}

export default function NodeEditPanel({ nodeId }: NodeEditPanelProps) {
  const [nodeName, setNodeName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 📡 當點選不同方塊時，自動抓取該方塊在 Firebase 的最新資料
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
        }
      } catch (error) {
        console.error("抓取節點失敗:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNodeData();
  }, [nodeId]);

  // ⚡ 升級儲存功能：現在會根據 nodeId 更新資料
  const handleSave = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "flowRules", nodeId);
      await updateDoc(docRef, {
        nodeName: nodeName,
        updatedAt: serverTimestamp() // 使用 Firebase 伺服器時間
      });
      alert("✅ 修改成功！畫布與 LINE 機器人都已同步更新。");
    } catch (error) {
      console.error("更新失敗:", error);
      alert("儲存失敗，請檢查網路或權限。");
    } finally {
      setIsSaving(false);
    }
  };

  if (!nodeId) return null; // 沒選方塊時不顯示面板

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20">
      {/* 標題區 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-foreground">
          {isLoading ? "載入中..." : "編輯節點內容"}
        </h3>
        <button className="text-muted-foreground hover:text-foreground p-1">
          <X size={18} />
        </button>
      </div>

      {/* 內容區 */}
      <div className="flex-1 p-5 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">節點名稱 (即 LINE 關鍵字)</label>
          <input 
            type="text" 
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            disabled={isLoading}
            placeholder="請輸入關鍵字..."
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
          />
        </div>

        {/* 類型選擇 UI (目前維持靜態展示) */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">回覆訊息類型</label>
          <div className="grid grid-cols-3 gap-2 opacity-50 grayscale cursor-not-allowed">
            <button className="flex flex-col items-center justify-center gap-1 bg-secondary border border-border rounded-md p-2">
              <MessageSquare size={18} />
              <span className="text-xs">純文字</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 bg-primary/10 border border-primary rounded-md p-2">
              <Youtube size={18} className="text-primary" />
              <span className="text-xs text-primary">影片卡片</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 bg-secondary border border-border rounded-md p-2">
              <LayoutPanelLeft size={18} />
              <span className="text-xs">圖文選單</span>
            </button>
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
