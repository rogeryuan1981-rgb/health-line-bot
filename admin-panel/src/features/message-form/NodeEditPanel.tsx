import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Library, Maximize2, Minimize2, Smile, Search, Tag, Info, Copy } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

// 為了節省篇幅，EMOJI_LIST 維持不變，以下直接展示主組件
export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", customLabel: "", messageType: 'text', cardSize: 'md', 
    btnStyle: 'primary', textContent: "", imageUrl: "", imageUrls: [], videoUrl: "", fileUrl: "", 
    buttons: [], cards: []
  });
  
  const [library, setLibrary] = useState<any[]>([]);
  const [activeLib, setActiveLib] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
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
    alert("✅ 配置已儲存！");
  };

  if (!nodeId) return null;
  const isGroup = nodeData.messageType === 'group_box';

  return (
    <div className="w-[480px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a]">
            {isGroup ? 'GROUP SETTINGS' : 'COMMAND CENTER'}
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col p-6 space-y-6">
          {!isGroup && (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex gap-4">
                  <div className="flex-[2] space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        啟動關鍵字
                        <div className="group relative flex items-center">
                            <Info size={10} className="text-slate-400 cursor-help hover:text-[#deff9a] transition-colors"/>
                            <div className="absolute left-4 top-0 w-64 bg-slate-800 text-slate-300 text-[9px] p-2.5 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-white/10 font-normal normal-case leading-relaxed">
                                <span className="text-[#deff9a] font-bold">多重匹配規則：</span><br/>
                                • 使用逗號 <code className="bg-black px-1 text-yellow-400">,</code> 分隔多個關鍵字。<br/>
                                  例如：<code className="bg-black px-1 text-yellow-400">謝謝,感謝,謝啦,感恩</code><br/>
                                • 只要用戶輸入其中一個詞，即會觸發回覆。<br/>
                                • <span className="text-[#deff9a] font-bold">預設回覆：</span>此名稱為全域保底節點。
                            </div>
                        </div>
                    </label>
                    <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" placeholder="例如: 謝謝,感謝,謝啦" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Tag size={10}/> 自定義標籤</label>
                    <input value={nodeData.customLabel || ""} onChange={e => setNodeData({...nodeData, customLabel: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-400" placeholder="用途標註" />
                  </div>
                </div>

                {/* 訊息類型選擇器 */}
                <div className="grid grid-cols-6 gap-1 p-1 bg-slate-900 rounded-lg">
                    {['text', 'image', 'video', 'file', 'flex', 'carousel'].map(t => (
                        <button key={t} onClick={() => setNodeData({...nodeData, messageType: t})} className={`py-2 rounded-md text-[9px] font-bold uppercase transition-all ${nodeData.messageType === t ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}>{t}</button>
                    ))}
                </div>

                {/* 內容編輯區 (Text) */}
                {nodeData.messageType === 'text' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">回覆文字</label>
                        <textarea value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} className="w-full bg-slate-900 rounded-xl p-4 text-sm outline-none min-h-[120px] leading-relaxed" placeholder="請輸入回覆文字..." />
                    </div>
                )}
                
                {/* 其他類型的編輯器 (Image, Video, Flex... 略，請沿用您原本的實現) */}
            </div>
          )}

          <button onClick={() => { if(window.confirm(`確定刪除？`)) deleteDoc(doc(db, "flowRules", nodeId!)); onClose(); }} className="w-full text-red-500/50 hover:text-red-500 text-[10px] py-4 uppercase font-bold tracking-widest border-t border-white/5 mt-4 transition-colors">
            Delete Node
          </button>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-900 flex gap-3">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            {isSaving ? "處理中..." : "儲存配置"}
        </button>
      </div>
    </div>
  )
}
