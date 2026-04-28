import { useState, useEffect } from 'react'
import { X, Save, Plus, MessageSquare, Image as ImageIcon, Youtube, Layers, Maximize, Square, Minimize2, Maximize2, Library } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", messageType: 'text', cardSize: 'md', imageAspectRatio: 'rectangle',
    textContent: "", videoTitle: "", videoUrl: "", imageUrl: "", cards: []
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
      setLibrary(libSnap.docs.map(d => d.data()));
    };
    fetch();
  }, [nodeId]);

  const handleSave = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    await updateDoc(doc(db, "flowRules", nodeId), { ...nodeData, updatedAt: serverTimestamp() });
    setIsSaving(false);
    alert("✅ 指揮中心：全功能配置已同步發佈！");
  };

  if (!nodeId) return null;

  return (
    <div className="w-[450px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#06C755]">COMMAND CENTER v4.0</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* 1. 即時模擬器：置頂且顯目 */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-white/5 shadow-2xl ring-1 ring-white/10">
          <p className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest">Live Sync Simulator</p>
          <LineSimulator data={nodeData} />
        </div>

        {/* 2. 全中文化回覆型態切換 */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">1. 選擇回覆種類</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'text', icon: <MessageSquare size={18}/>, label: '純文字模式', desc: '簡單文字回覆' },
              { id: 'video', icon: <Youtube size={18}/>, label: '影音卡片', desc: 'Youtube 教學引導' },
              { id: 'image', icon: <ImageIcon size={18}/>, label: '圖片訊息', desc: '懶人包直接發送' },
              { id: 'carousel', icon: <Layers size={18}/>, label: '輪播選單', desc: '多層級引導選單' }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setNodeData({...nodeData, messageType: t.id})}
                className={`p-4 rounded-2xl flex flex-col items-start gap-2 border-2 transition-all duration-300 ${nodeData.messageType === t.id ? 'border-[#06C755] bg-[#06C755]/10 shadow-[0_0_15px_rgba(6,199,85,0.2)]' : 'border-transparent bg-slate-800/50 hover:bg-slate-800'}`}
              >
                <div className={`${nodeData.messageType === t.id ? 'text-[#06C755]' : 'text-slate-500'}`}>{t.icon}</div>
                <div className="text-left">
                  <div className={`text-xs font-bold ${nodeData.messageType === t.id ? 'text-white' : 'text-slate-400'}`}>{t.label}</div>
                  <div className="text-[9px] text-slate-500">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. 尺寸與比例：顯目中文按鈕 */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">卡片規模</label>
              <div className="flex bg-slate-900 p-1 rounded-xl">
                <button onClick={() => setNodeData({...nodeData, cardSize: 'md'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${nodeData.cardSize==='md'?'bg-slate-700 text-white':'text-slate-500'}`}><Maximize2 size={12}/> 標準</button>
                <button onClick={() => setNodeData({...nodeData, cardSize: 'sm'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${nodeData.cardSize==='sm'?'bg-slate-700 text-white':'text-slate-500'}`}><Minimize2 size={12}/> 微型</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">顯示比例</label>
              <div className="flex bg-slate-900 p-1 rounded-xl">
                <button onClick={() => setNodeData({...nodeData, imageAspectRatio: 'rectangle'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${nodeData.imageAspectRatio==='rectangle'?'bg-slate-700 text-white':'text-slate-500'}`}><Maximize size={12}/> 長方</button>
                <button onClick={() => setNodeData({...nodeData, imageAspectRatio: 'square'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${nodeData.imageAspectRatio==='square'?'bg-slate-700 text-white':'text-slate-500'}`}><Square size={12}/> 正方</button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 資源調用與網址輸入 */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">2. 配置內容素材</label>
          <div className="relative group">
            <input 
              placeholder="貼上網址或點擊右側庫存圖標" 
              value={nodeData.imageUrl} 
              onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})}
              className="w-full bg-slate-900 border-none rounded-2xl px-4 py-3 text-xs pr-12 focus:ring-2 ring-[#06C755] transition-all"
            />
            <button 
              onClick={() => setShowLib(!showLib)}
              className="absolute right-3 top-2.5 text-[#06C755] hover:bg-[#06C755]/20 p-1.5 rounded-xl transition-all"
            >
              <Library size={20}/>
            </button>
          </div>
          {showLib && (
            <div className="bg-slate-800 border border-[#06C755]/30 rounded-2xl p-4 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-bold text-[#06C755] mb-2 uppercase">從資源庫存調用資源：</p>
              {library.map((item, idx) => (
                <div key={idx} onClick={() => { setNodeData({...nodeData, imageUrl: item.url}); setShowLib(false); }} className="p-3 bg-slate-900 rounded-xl text-xs cursor-pointer hover:bg-slate-700 flex justify-between items-center transition-colors">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-[9px] bg-[#06C755]/20 text-[#06C755] px-2 py-0.5 rounded-full">調用</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(6,199,85,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2">
          <Save size={20} /> {isSaving ? "同步發佈中..." : "儲存並全能發佈"}
        </button>
      </div>
    </div>
  )
}
