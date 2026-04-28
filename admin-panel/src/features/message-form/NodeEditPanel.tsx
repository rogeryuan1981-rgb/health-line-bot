import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Library } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", messageType: 'text', 
    btnStyle: 'primary', 
    textContent: "", imageUrl: "", videoUrl: "", 
    buttons: [], cards: []
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
    const payload = { ...nodeData, updatedAt: serverTimestamp() };
    delete payload.position; 
    await updateDoc(doc(db, "flowRules", nodeId), payload);
    setIsSaving(false);
    alert("✅ 防呆機制配置成功！");
  };

  // 👉 解決 3：獨立且穩固的刪除邏輯
  const handleDelete = async () => {
    if (!nodeId || !window.confirm("確定徹底刪除此節點？")) return;
    await deleteDoc(doc(db, "flowRules", nodeId));
    onClose(); // 通知 FlowEditor 收起面板
  };

  const renderResourcePicker = (field: 'imageUrl' | 'videoUrl', placeholder: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-slate-500 uppercase">{field === 'imageUrl' ? '圖片網址' : '影片網址'}</label>
        {field === 'imageUrl' && (
            <button onClick={() => setShowLib(!showLib)} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline">
            <Library size={12}/> 從資源庫調用
            </button>
        )}
      </div>
      <input 
        value={nodeData[field] || ""} 
        onChange={e => setNodeData({...nodeData, [field]: e.target.value})} 
        className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" 
        placeholder={placeholder} 
      />
      {showLib && field === 'imageUrl' && (
        <div className="bg-slate-800 rounded-xl p-2 grid gap-1 border border-[#deff9a]/20 max-h-40 overflow-y-auto">
            {library.map(item => (
                <div key={item.id} onClick={() => { setNodeData({...nodeData, imageUrl: item.url}); setShowLib(false); }} className="p-2 bg-slate-900 rounded text-xs cursor-pointer hover:bg-slate-700 flex justify-between">
                    <span>{item.name}</span> <span className="text-[#deff9a]">選取</span>
                </div>
            ))}
        </div>
      )}
    </div>
  );

  if (!nodeId) return null;

  return (
    <div className="w-[480px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a]">COMMAND CENTER</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <LineSimulator data={nodeData} />

        <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} placeholder="啟動關鍵字" className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" />

        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg">
            {['text', 'image', 'video', 'flex'].map(t => (
                <button key={t} onClick={() => setNodeData({...nodeData, messageType: t})} className={`py-2 rounded-md text-[10px] font-bold uppercase transition-all ${nodeData.messageType === t ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}>{t}</button>
            ))}
        </div>

        <div className="space-y-4 border-t border-white/5 pt-4">
            {nodeData.messageType === 'text' && (
                <textarea value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="純文字回覆內容..." className="w-full bg-slate-900 rounded-xl p-4 text-sm min-h-[120px] outline-none" />
            )}

            {nodeData.messageType === 'image' && renderResourcePicker('imageUrl', '請輸入圖片網址...')}

            {nodeData.messageType === 'video' && (
                <>
                    {renderResourcePicker('imageUrl', '影片預覽封面網址...')}
                    {renderResourcePicker('videoUrl', '影片播放網址 (YouTube等)...')}
                </>
            )}

            {nodeData.messageType === 'flex' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button onClick={() => setNodeData({...nodeData, btnStyle: 'primary'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${nodeData.btnStyle==='primary'?'border-[#06C755] bg-[#06C755]/10 text-[#06C755]':'border-transparent bg-slate-800 text-slate-500'}`}>綠色實心按鈕</button>
                        <button onClick={() => setNodeData({...nodeData, btnStyle: 'link'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${nodeData.btnStyle==='link'?'border-[#06C755] bg-[#06C755]/10 text-[#06C755]':'border-transparent bg-slate-800 text-slate-500'}`}>透明文字連結</button>
                    </div>
                    
                    {renderResourcePicker('imageUrl', '圖片網址 (選填，不填則為純文字卡片)')}
                    
                    <textarea value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="卡片主體文字 (支援換行)..." className="w-full bg-slate-900 rounded-xl p-4 text-sm min-h-[80px] outline-none" />
                    
                    <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>卡片按鈕 ({nodeData.buttons?.length || 0}/4)</span>
                            <button onClick={() => { if((nodeData.buttons?.length || 0) < 4) setNodeData({...nodeData, buttons: [...(nodeData.buttons || []), {label: "", target: ""}]}) }} className="text-[#deff9a]"><Plus size={14}/></button>
                        </div>
                        {nodeData.buttons?.map((btn: any, i: number) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input value={btn.label} onChange={e => { const nb = [...nodeData.buttons]; nb[i].label = e.target.value; setNodeData({...nodeData, buttons: nb}) }} placeholder="按鈕文字" className="flex-1 bg-slate-900 rounded p-2 text-xs outline-none" />
                                <input value={btn.target} onChange={e => { const nb = [...nodeData.buttons]; nb[i].target = e.target.value; setNodeData({...nodeData, buttons: nb}) }} placeholder="觸發關鍵字" className="flex-1 bg-slate-900 rounded p-2 text-xs outline-none" />
                                <button onClick={() => { const nb = [...nodeData.buttons]; nb.splice(i,1); setNodeData({...nodeData, buttons: nb}) }} className="text-red-500 hover:bg-red-500/20 p-1 rounded-full"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* 綁定 handleDelete */}
        <button onClick={handleDelete} className="w-full text-red-500/50 hover:text-red-500 text-[10px] py-4 uppercase font-bold tracking-widest flex items-center justify-center gap-1">
          <Trash2 size={12}/> Delete Node
        </button>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">儲存配置</button>
      </div>
    </div>
  )
}
