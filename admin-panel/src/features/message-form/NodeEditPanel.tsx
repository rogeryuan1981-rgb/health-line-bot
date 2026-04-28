import { useState, useEffect } from 'react'
import { X, Save, Youtube, MessageSquare, Image as ImageIcon, Trash2, Plus } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

interface NodeEditPanelProps {
  nodeId?: string | null;
  onClose: () => void;
}

// 定義按鈕的結構
interface GuideButton {
  label: string;
  target: string;
}

export default function NodeEditPanel({ nodeId, onClose }: NodeEditPanelProps) {
  const [nodeName, setNodeName] = useState("");
  const [messageType, setMessageType] = useState('text');
  const [textContent, setTextContent] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // 👉 動態按鈕陣列
  const [buttons, setButtons] = useState<GuideButton[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNodeData = async () => {
      if (!nodeId) return;
      setIsLoading(true);
      try {
        const docSnap = await getDoc(doc(db, "flowRules", nodeId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNodeName(data.nodeName || "");
          setMessageType(data.messageType || 'text');
          setTextContent(data.textContent || "");
          setVideoTitle(data.videoTitle || "");
          setVideoUrl(data.videoUrl || "");
          setImageUrl(data.imageUrl || "");
          setButtons(data.buttons || []); // 載入按鈕陣列
        }
      } finally { setIsLoading(false); }
    };
    fetchNodeData();
  }, [nodeId]);

  // 新增按鈕邏輯
  const handleAddButton = () => {
    if (buttons.length >= 4) {
      alert("最多只能設定 4 個按鈕喔！");
      return;
    }
    setButtons([...buttons, { label: "", target: "" }]);
  };

  // 刪除特定按鈕
  const handleRemoveButton = (index: number) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    setButtons(newButtons);
  };

  // 更新按鈕內容
  const handleUpdateButton = (index: number, field: keyof GuideButton, value: string) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    setButtons(newButtons);
  };

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
        buttons, // 👉 儲存整個按鈕陣列
        updatedAt: serverTimestamp()
      });
      alert("✅ 多層引導規則已全數同步！");
    } finally { setIsSaving(false); }
  };

  if (!nodeId) return null;

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-2xl absolute right-0 top-0 z-20 text-foreground">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold">{isLoading ? "載入中..." : "編輯對話節點"}</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">關鍵字名稱</label>
          <input type="text" value={nodeName} onChange={(e) => setNodeName(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
        </div>

        {/* 類型切換 UI */}
        <div className="grid grid-cols-3 gap-2">
          {(['text', 'video', 'image'] as const).map((type) => (
            <button key={type} onClick={() => setMessageType(type)} className={`p-2 rounded border-2 text-[10px] flex flex-col items-center gap-1 ${messageType === type ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'}`}>
              {type === 'text' && <MessageSquare size={16} />}
              {type === 'video' && <Youtube size={16} />}
              {type === 'image' && <ImageIcon size={16} />}
              {type === 'text' ? '純文字' : type === 'video' ? '影片' : '圖片'}
            </button>
          ))}
        </div>

        {/* 動態內容輸入 */}
        <div className="space-y-3">
          {messageType === 'text' && <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="文字回覆..." className="w-full bg-background border border-border rounded p-2 text-sm" rows={3} />}
          {messageType === 'video' && <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube 連結" className="w-full bg-background border border-border rounded p-2 text-sm" />}
          {messageType === 'image' && <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="圖片網址" className="w-full bg-background border border-border rounded p-2 text-sm" />}
        </div>

        {/* 👉 引導按鈕管理區 */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">引導按鈕 ({buttons.length}/5)</label>
            <button onClick={handleAddButton} className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors">
              <Plus size={18} />
            </button>
          </div>
          
          <div className="space-y-3">
            {buttons.map((btn, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-lg relative group">
                <button onClick={() => handleRemoveButton(index)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <X size={12} />
                </button>
                <input 
                  placeholder="按鈕顯示文字 (如: 下一步)" 
                  value={btn.label} 
                  onChange={(e) => handleUpdateButton(index, 'label', e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                />
                <input 
                  placeholder="觸發關鍵字 (如: step2)" 
                  value={btn.target} 
                  onChange={(e) => handleUpdateButton(index, 'target', e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                />
              </div>
            ))}
          </div>
        </div>

        <button onClick={async () => { if(window.confirm("確定刪除？")) { await deleteDoc(doc(db, "flowRules", nodeId)); onClose(); } }} className="mt-auto flex items-center justify-center gap-2 text-destructive text-xs py-4 hover:bg-destructive/5 rounded">
          <Trash2 size={14} /> 刪除此節點
        </button>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
          <Save size={18} /> {isSaving ? "同步中..." : "儲存所有設定"}
        </button>
      </div>
    </div>
  )
}
