import { useState, useEffect } from 'react'
import { X, Save, Plus, Library } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  const [nodeData, setNodeData] = useState<any>({ nodeName: "", messageType: 'text', imageUrl: "", cards: [] });
  const [library, setLibrary] = useState<any[]>([]); // 👉 資源庫清單
  const [showLib, setShowLib] = useState(false); // 👉 是否顯示資源選擇器

  useEffect(() => {
    if (!nodeId) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "flowRules", nodeId));
      if (snap.exists()) setNodeData(snap.data());
      
      // 👉 順便抓取資源庫
      const libSnap = await getDocs(collection(db, "resources"));
      setLibrary(libSnap.docs.map(d => d.data()));
    };
    fetch();
  }, [nodeId]);

  const handleApplyAsset = (url: string) => {
    setNodeData({ ...nodeData, imageUrl: url });
    setShowLib(false);
  };

  return (
    <div className="w-[420px] h-full bg-[#1E293B] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white">
      <div className="p-4 bg-slate-900/50 flex justify-between items-center border-b border-white/5">
        <h3 className="text-sm font-bold">編輯節點</h3>
        <button onClick={onClose} className="text-slate-500"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <LineSimulator data={nodeData} />

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">圖片/影片 來源配置</label>
          
          <div className="relative">
            <input 
              placeholder="貼上網址或點擊右側從資源庫選擇" 
              value={nodeData.imageUrl} 
              onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})}
              className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-xs pr-12"
            />
            <button 
              onClick={() => setShowLib(!showLib)}
              className="absolute right-3 top-2.5 text-[#06C755] hover:bg-[#06C755]/10 p-1 rounded-lg"
              title="從資源庫調用"
            >
              <Library size={18}/>
            </button>
          </div>

          {/* 資源庫調用彈窗 (極簡化版) */}
          {showLib && (
            <div className="bg-slate-800 border border-[#06C755]/30 rounded-xl p-3 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto shadow-2xl">
              <p className="text-[10px] font-bold text-[#06C755] mb-1">點擊調用資源：</p>
              {library.length === 0 && <p className="text-[10px] text-slate-500 italic">庫存目前是空的...</p>}
              {library.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleApplyAsset(item.url)}
                  className="p-2 bg-slate-900 rounded-lg text-[10px] cursor-pointer hover:bg-slate-700 flex justify-between"
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="text-slate-500">套用</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 其他編輯內容 (文字、按鈕等)... 保持之前邏輯 */}
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-900">
        <button onClick={async () => { await updateDoc(doc(db, "flowRules", nodeId!), nodeData); alert("同步成功！"); }} className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl">儲存變更</button>
      </div>
    </div>
  )
}
