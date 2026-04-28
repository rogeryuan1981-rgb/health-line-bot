import { useState, useEffect } from 'react'
import { X, Save, Plus, Maximize2, Minimize2, Trash2, Library, ChevronRight } from 'lucide-react'
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
    await updateDoc(doc(db, "flowRules", nodeId), { ...nodeData, updatedAt: serverTimestamp() });
    setIsSaving(false);
    alert("✅ 終極發佈成功！");
  };

  const handleDelete = async () => {
    if (!nodeId || !window.confirm("確定要徹底刪除此節點嗎？這將無法復原。")) return;
    await deleteDoc(doc(db, "flowRules", nodeId));
    onClose();
  };

  if (!nodeId) return null;

  return (
    <div className="w-[450px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      {/* 標題區域 */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a]">COMMAND CENTER v5.0</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* 1. 預覽區 */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-white/5 shadow-2xl">
          <p className="text-[10px] font-bold text-slate-500 mb-4 uppercase">Live Preview</p>
          <LineSimulator data={nodeData} />
        </div>

        {/* 2. 核心：啟動關鍵字 */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#deff9a] uppercase tracking-widest">啟動關鍵字 (Keyword)</label>
          <input 
            value={nodeData.nodeName} 
            onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} 
            placeholder="輸入觸發對話的文字" 
            className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 ring-[#deff9a] outline-none"
          />
        </div>

        {/* 3. 回覆型態選擇 */}
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

        {/* 4. 動態內容區域 */}
        <div className="space-y-4">
          {/* 文字內容回覆 */}
          {nodeData.messageType === 'text' && (
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">回覆文字內容</label>
                <textarea 
                    value={nodeData.textContent} 
                    onChange={e => setNodeData({...nodeData, textContent: e.target.value})} 
                    placeholder="輸入機器人的回覆..." 
                    className="w-full bg-slate-900 border-none rounded-xl p-4 text-sm min-h-[120px] outline-none"
                />
            </div>
          )}

          {/* 圖片/影音來源 + 資源庫調用 */}
          {(nodeData.messageType !== 'text') && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase">素材網址 (URL)</label>
                <button onClick={() => setShowLib(!showLib)} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline">
                  <Library size={12}/> 從資源庫選取
                </button>
              </div>
              <input 
                value={nodeData.imageUrl} 
                onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} 
                className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-xs" 
                placeholder="貼上網址或從庫存調用"
              />
              {showLib && (
                <div className="bg-slate-800 rounded-xl p-3 grid gap-2 max-h-40 overflow-y-auto border border-[#deff9a]/20">
                  {library.map(item => (
                    <div key={item.id} onClick={() => { setNodeData({...nodeData, imageUrl: item.url}); setShowLib(false); }} className="p-2 bg-slate-900 rounded-lg text-xs cursor-pointer hover:bg-slate-700 flex justify-between">
                      <span>{item.name}</span> <span className="text-[#deff9a]">套用</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 輪播卡片與引導按鈕 (最多4個) */}
          {nodeData.messageType === 'carousel' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                <span>卡片列表 ({nodeData.cards?.length || 0}/10)</span>
                <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", price: "", buttons: [] }]})} className="text-[#deff9a]"><Plus size={16}/></button>
              </div>
              {nodeData.cards?.map((card: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-3 relative group">
                  <input placeholder="卡片標題" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 border-none rounded px-3 py-2 text-sm text-white" />
                  
                  {/* 引導按鈕管理 (最多4個) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span>引導按鈕 ({card.buttons?.length || 0}/4)</span>
                        <button onClick={() => { if((card.buttons?.length || 0) < 4) { const nc = [...nodeData.cards]; nc[idx].buttons = [...(card.buttons || []), {label: "", target: ""}]; setNodeData({...nodeData, cards: nc}) } }} className="text-[#deff9a]"><Plus size={14}/></button>
                    </div>
                    {card.buttons?.map((btn: any, bIdx: number) => (
                        <div key={bIdx} className="flex gap-1 items-center">
                            <input placeholder="按鈕文字" value={btn.label} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].label = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1 text-[10px]" />
                            <input placeholder="觸發關鍵字" value={btn.target} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].target = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1 text-[10px]" />
                        </div>
                    ))}
                  </div>
                  <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={10}/></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. 終極刪除按鈕 */}
        <button 
            onClick={handleDelete} 
            className="w-full flex items-center justify-center gap-2 text-red-500/50 hover:text-red-500 text-xs py-10 transition-colors uppercase font-bold tracking-widest"
        >
          <Trash2 size={14} /> 徹底刪除此對話節點
        </button>
      </div>

      {/* 底部儲存列 */}
      <div className="p-6 border-t border-white/10 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
          <Save size={18} /> {isSaving ? "同步中..." : "儲存並全武裝發佈"}
        </button>
      </div>
    </div>
  )
}
