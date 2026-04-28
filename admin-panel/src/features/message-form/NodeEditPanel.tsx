import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Library } from 'lucide-react' 
// 👉 修正：移除了未使用的 Maximize2, Minimize2, ChevronRight
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

interface NodeEditPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeEditPanel({ nodeId, onClose }: NodeEditPanelProps) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "",  
    messageType: 'text', 
    cardSize: 'md', 
    textContent: "",
    imageUrl: "", 
    cards: [{ title: "", price: "", imageUrl: "", buttons: [] }]
  });
  const [library, setLibrary] = useState<any[]>([]);
  const [showLib, setShowLib] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "flowRules", nodeId));
      if (snap.exists()) setNodeData(snap.data());
      // 預加載資源庫
      const libSnap = await getDocs(collection(db, "resources"));
      setLibrary(libSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetch();
  }, [nodeId]);

  const handleSave = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "flowRules", nodeId), { ...nodeData, updatedAt: serverTimestamp() });
      alert("✅ 內容已同步發佈！");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nodeId || !window.confirm("確定要刪除此節點嗎？此動作不可復原。")) return;
    await deleteDoc(doc(db, "flowRules", nodeId));
    onClose();
  };

  if (!nodeId) return null;

  return (
    <div className="w-[450px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      {/* 標題區 */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a]">COMMAND CENTER v5.1</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* 1. 預覽區 */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-white/5 shadow-2xl">
          <LineSimulator data={nodeData} />
        </div>

        {/* 2. 關鍵字設定 */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#deff9a] uppercase tracking-widest">啟動關鍵字</label>
          <input 
            value={nodeData.nodeName} 
            onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} 
            placeholder="輸入觸發指令 (例如: 開始)" 
            className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 ring-[#deff9a] outline-none"
          />
        </div>

        {/* 3. 類型切換 */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">回覆模式</label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg">
            {['text', 'image', 'video', 'carousel'].map(t => (
              <button 
                key={t} 
                onClick={() => setNodeData({...nodeData, messageType: t})}
                className={`py-2 rounded-md text-[10px] font-bold transition-all ${nodeData.messageType === t ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 4. 內容編輯區 */}
        <div className="space-y-4">
          {/* 文字模式 */}
          {nodeData.messageType === 'text' && (
            <textarea 
                value={nodeData.textContent} 
                onChange={e => setNodeData({...nodeData, textContent: e.target.value})} 
                placeholder="輸入機器人的回覆文字..." 
                className="w-full bg-slate-900 border-none rounded-xl p-4 text-sm min-h-[120px] outline-none"
            />
          )}

          {/* 圖片/影音模式 - 含資源調用 */}
          {(nodeData.messageType === 'image' || nodeData.messageType === 'video') && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500">素材網址 (URL)</label>
                <button onClick={() => setShowLib(!showLib)} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline">
                  <Library size={12}/> 從庫存選擇
                </button>
              </div>
              <input 
                value={nodeData.imageUrl} 
                onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} 
                className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-xs" 
                placeholder="貼上 URL 或從資源庫調用"
              />
              {showLib && (
                <div className="bg-slate-800 rounded-xl p-3 grid gap-2 max-h-40 overflow-y-auto border border-[#deff9a]/20 shadow-2xl">
                  {library.map(item => (
                    <div key={item.id} onClick={() => { setNodeData({...nodeData, imageUrl: item.url}); setShowLib(false); }} className="p-2 bg-slate-900 rounded-lg text-xs cursor-pointer hover:bg-slate-700 flex justify-between">
                      <span>{item.name}</span> <span className="text-[#deff9a]">套用</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 輪播選單模式 (支援多卡片與 4 個按鈕) */}
          {nodeData.messageType === 'carousel' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>輪播卡片清單 ({nodeData.cards?.length || 0}/10)</span>
                <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", price: "", buttons: [] }]})} className="text-[#deff9a]"><Plus size={16}/></button>
              </div>
              {nodeData.cards?.map((card: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-3 relative group">
                  <input placeholder="卡片標題" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-sm text-white outline-none" />
                  
                  {/* 按鈕管理 (最大 4 個) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span>引導按鈕 ({card.buttons?.length || 0}/4)</span>
                        <button onClick={() => { if((card.buttons?.length || 0) < 4) { const nc = [...nodeData.cards]; nc[idx].buttons = [...(card.buttons || []), {label: "", target: ""}]; setNodeData({...nodeData, cards: nc}) } }} className="text-[#deff9a]"><Plus size={14}/></button>
                    </div>
                    {card.buttons?.map((btn: any, bIdx: number) => (
                        <div key={bIdx} className="flex gap-1 items-center">
                            <input placeholder="按鈕顯示文字" value={btn.label} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].label = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1 text-[10px] outline-none" />
                            <input placeholder="下一層關鍵字" value={btn.target} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].target = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1 text-[10px] outline-none" />
                        </div>
                    ))}
                  </div>
                  <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. 刪除節點按鈕 */}
        <button 
            onClick={handleDelete} 
            className="w-full flex items-center justify-center gap-2 text-red-500/30 hover:text-red-500 text-[10px] py-12 transition-colors uppercase font-bold tracking-widest"
        >
          <Trash2 size={14} /> 徹底刪除此節點
        </button>
      </div>

      {/* 底部儲存 */}
      <div className="p-6 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
          <Save size={18} /> {isSaving ? "同步中..." : "儲存並發佈"}
        </button>
      </div>
    </div>
  )
}
