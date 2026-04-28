import { useState } from 'react'
// 👉 拿掉了沒有用到的 Plus
import { X, Save, Youtube, LayoutPanelLeft, MessageSquare } from 'lucide-react'
import { collection, addDoc } from 'firebase/firestore'
// 👉 修正為正確的路徑：退回兩層就能找到 src/firebase.ts
import { db } from '../../firebase'

export default function NodeEditPanel() {
  // 👉 建立 State 來記憶使用者在輸入框打的字
  const [nodeName, setNodeName] = useState("教學影片：居家基礎伸展操");
  const [isSaving, setIsSaving] = useState(false);

  // 👉 建立通電的儲存函數
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 指示 Firebase 將資料寫入名為 "flowRules" 的資料夾 (Collection) 中
      const docRef = await addDoc(collection(db, "flowRules"), {
        nodeName: nodeName,
        messageType: "video", // 先寫死測試
        updatedAt: new Date()
      });
      
      alert(`🎉 成功通電！資料已存入 Firebase！\n雲端文件 ID: ${docRef.id}`);
    } catch (error) {
      console.error("寫入資料庫失敗:", error);
      alert("儲存失敗，請按 F12 檢查 Console 是否有權限錯誤。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20">
      
      {/* 面板標題區 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-foreground">編輯節點內容</h3>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
          <X size={18} />
        </button>
      </div>

      {/* 表單內容區 (可捲動) */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        
        {/* 節點名稱 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">節點名稱 (內部識別用)</label>
          <input 
            type="text" 
            value={nodeName} // 👉 綁定 State
            onChange={(e) => setNodeName(e.target.value)} // 👉 當使用者打字時更新 State
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* 訊息類型選擇 (維持 UI 展示) */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">回覆訊息類型</label>
          <div className="grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center justify-center gap-1 bg-secondary border-2 border-transparent hover:border-border rounded-md p-2 transition-all">
              <MessageSquare size={18} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">純文字</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 bg-primary/10 border-2 border-primary rounded-md p-2 transition-all">
              <Youtube size={18} className="text-primary" />
              <span className="text-xs text-primary font-medium">影片卡片</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 bg-secondary border-2 border-transparent hover:border-border rounded-md p-2 transition-all">
              <LayoutPanelLeft size={18} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">圖文選單</span>
            </button>
          </div>
        </div>

        {/* 影片設定區塊 (維持 UI 展示) */}
        <div className="flex flex-col gap-4 p-4 border border-border rounded-lg bg-secondary/20">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Youtube size={16} className="text-destructive" />
            影片懶人包設定
          </h4>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">卡片主標題</label>
            <input type="text" defaultValue="每天五分鐘，遠離心血管疾病" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">YouTube 影片網址</label>
            <input type="url" placeholder="https://youtube.com/..." className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

      </div>

      {/* 底部儲存區 */}
      <div className="p-4 border-t border-border bg-card">
        <button 
          onClick={handleSave} // 👉 綁定點擊事件！
          disabled={isSaving}  // 👉 儲存中鎖定按鈕防止連點
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? "努力寫入雲端中..." : "儲存節點設定"}
        </button>
      </div>

    </div>
  )
}
