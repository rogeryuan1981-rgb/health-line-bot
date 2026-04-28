import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Library, Maximize2, Minimize2 } from 'lucide-react'
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
    title: "",        // 標題 (用於圖片、影片)
    textContent: "",  // 內容/詳情 (用於文字、圖片、影片)
    imageUrl: "",     // 素材網址 (全局共用)
    videoUrl: "",     // 影片專用網址
    buttons: [],      // 引導按鈕 (用於文字、圖片、影片)
    cards: [{ title: "", price: "", imageUrl: "", buttons: [] }] // 輪播專用
  });
  
  const [library, setLibrary] = useState<any[]>([]);
  const [showLib, setShowLib] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "flowRules", nodeId));
      if (snap.exists()) setNodeData(snap.data());
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
    alert("✅ 內容與排版設定已發佈！");
  };

  const handleDelete = async () => {
    if (!nodeId || !window.confirm("確定徹底刪除此節點？")) return;
    await deleteDoc(doc(db, "flowRules", nodeId));
    onClose();
  };

  if (!nodeId) return null;

  return (
    <div className="w-[480px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a]">COMMAND CENTER</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
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
            value={nodeData.nodeName || ""} 
            onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} 
            placeholder="輸入觸發指令" 
            className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 ring-[#deff9a] outline-none"
          />
        </div>

        {/* 3. 回覆模式切換 */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">回覆模式</label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg">
            {['text', 'image', 'video', 'carousel'].map(t => (
              <button 
                key={t} onClick={() => setNodeData({...nodeData, messageType: t})}
                className={`py-2 rounded-md text-[10px] font-bold transition-all ${nodeData.messageType === t ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 4. 卡片規模 (純文字隱藏) */}
        {nodeData.messageType !== 'text' && (
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">卡片大小</label>
            <div className="flex bg-slate-900 p-1 rounded-xl">
              <button onClick={() => setNodeData({...nodeData, cardSize: 'md'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center gap-1 ${nodeData.cardSize==='md'?'bg-slate-700 text-white':'text-slate-500'}`}><Maximize2 size={12}/> 標準尺寸</button>
              <button onClick={() => setNodeData({...nodeData, cardSize: 'sm'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center gap-1 ${nodeData.cardSize==='sm'?'bg-slate-700 text-white':'text-slate-500'}`}><Minimize2 size={12}/> 微型尺寸</button>
            </div>
          </div>
        )}

        {/* 5. 全局資源庫調用 (所有模式皆可用) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">素材網址 (URL)</label>
            <button onClick={() => setShowLib(!showLib)} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline"><Library size={12}/> 從資源庫調用</button>
          </div>
          <input 
            value={nodeData.imageUrl || ""} 
            onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} 
            className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-xs outline-none" 
            placeholder="貼上網址，或點擊右上角從資源庫選取"
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

        {/* 6. 內容與按鈕設定 */}
        <div className="space-y-4 border-t border-white/5 pt-4">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">內容設定</label>
          
          {nodeData.messageType === 'carousel' ? (
            /* 輪播卡片區 */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">輪播清單 ({nodeData.cards?.length || 0}/10)</span>
                <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", price: "", imageUrl: "", buttons: [] }]})} className="text-[#deff9a]"><Plus size={16}/></button>
              </div>
              {nodeData.cards?.map((card: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-3 relative group">
                  <input placeholder="卡片標題" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded px-3 py-2 text-sm text-white outline-none" />
                  <input placeholder="詳情/價格" value={card.price} onChange={e => { const nc = [...nodeData.cards]; nc[idx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded px-3 py-2 text-xs text-slate-400 outline-none" />
                  <input placeholder="圖片網址" value={card.imageUrl} onChange={e => { const nc = [...nodeData.cards]; nc[idx].imageUrl = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded px-3 py-2 text-[10px] text-slate-500 outline-none" />
                  
                  {/* 輪播卡片內的按鈕 */}
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span>選項按鈕 ({card.buttons?.length || 0}/4)</span>
                        <button onClick={() => { if((card.buttons?.length || 0) < 4) { const nc = [...nodeData.cards]; nc[idx].buttons = [...(card.buttons || []), {label: "", target: ""}]; setNodeData({...nodeData, cards: nc}) } }} className="text-[#deff9a]"><Plus size={14}/></button>
                    </div>
                    {card.buttons?.map((btn: any, bIdx: number) => (
                        <div key={bIdx} className="flex gap-1">
                            <input placeholder="按鈕文字" value={btn.label} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].label = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1.5 text-[10px] outline-none" />
                            <input placeholder="跳轉關鍵字/URL" value={btn.target} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].target = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1.5 text-[10px] outline-none" />
                        </div>
                    ))}
                  </div>
                  <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={10}/></button>
                </div>
              ))}
            </div>
          ) : (
            /* 單一卡片區 (文字/圖片/影片共用) */
            <div className="space-y-3">
              {nodeData.messageType !== 'text' && (
                <input placeholder="主標題" value={nodeData.title || ""} onChange={e => setNodeData({...nodeData, title: e.target.value})} className="w-full bg-slate-900 rounded-xl px-4 py-2 text-sm outline-none" />
              )}
              <textarea placeholder="回覆內容或詳情描述..." value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} className="w-full bg-slate-900 rounded-xl p-4 text-sm min-h-[100px] outline-none" />
              {nodeData.messageType === 'video' && (
                <input placeholder="影片播放網址 (URL)" value={nodeData.videoUrl || ""} onChange={e => setNodeData({...nodeData, videoUrl: e.target.value})} className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs outline-none" />
              )}
              
              {/* 全局選項按鈕 (0-4個) */}
              <div className="space-y-2 mt-4 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500">附加選項按鈕 ({nodeData.buttons?.length || 0}/4)</span>
                    <button onClick={() => { if((nodeData.buttons?.length || 0) < 4) { setNodeData({...nodeData, buttons: [...(nodeData.buttons || []), {label: "", target: ""}]}) } }} className="text-[#deff9a] bg-[#deff9a]/10 p-1 rounded"><Plus size={14}/></button>
                </div>
                {nodeData.buttons?.map((btn: any, bIdx: number) => (
                    <div key={bIdx} className="flex gap-2 items-center relative group">
                        <input placeholder="按鈕文字" value={btn.label} onChange={e => { const nb = [...nodeData.buttons]; nb[bIdx].label = e.target.value; setNodeData({...nodeData, buttons: nb}) }} className="flex-1 bg-slate-900 rounded-lg p-2 text-xs outline-none" />
                        <input placeholder="觸發關鍵字或連結" value={btn.target} onChange={e => { const nb = [...nodeData.buttons]; nb[bIdx].target = e.target.value; setNodeData({...nodeData, buttons: nb}) }} className="flex-1 bg-slate-900 rounded-lg p-2 text-xs outline-none" />
                        <button onClick={() => { const nb = [...nodeData.buttons]; nb.splice(bIdx,1); setNodeData({...nodeData, buttons: nb}) }} className="text-red-400 hover:text-red-500 p-1"><X size={14}/></button>
                    </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 刪除節點按鈕 */}
        <button onClick={handleDelete} className="w-full flex justify-center gap-2 text-red-500/50 hover:text-red-500 text-[10px] py-6 transition-colors uppercase font-bold tracking-widest">
          <Trash2 size={14} /> 徹底刪除此節點
        </button>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex justify-center gap-2">
          <Save size={18} /> {isSaving ? "同步中..." : "儲存並發佈"}
        </button>
      </div>
    </div>
  )
}
