import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Library, Maximize2, Minimize2, Smile, Search, Tag, Info, Copy } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

const EMOJI_LIST = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😮','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','😤','😢','😭','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😇','🤠','🤡','🥳','🥴','🥺','🤥','🤫','🤭','🧐','堅持','👾','🤖','💩',
  '👋','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','👍','👎','✊','👊','👏','🙌','🙏',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🔥','✨','🌟','☀️','🌙','🌈','☁️','⚡','❄️','💥','💨','💦','🍀','🌸','🍓','🍔','🍺','☕','🎮','辦公室','📱','📧','💬','📞','📌','📍','🔍','📅','💰','🎁','🚀','🏆','👑','💎',
  '0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟',
  '✅','❌','⚠️','🆗','🆙','🆕','🆓','🆘','📢','📣','🔔','🔕','🎵','🎶','💡','💢','💯','💠','🔘','🏁','🚩','⬅️','➡️','⬆️','⬇️','↩️','↪️','◀️','▶️'
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [libFilter, setLibFilter] = useState<'all' | 'image' | 'video' | 'file'>('all');

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

  const handleDuplicate = async () => {
    if (!nodeId) return;
    setIsSaving(true);
    const snap = await getDoc(doc(db, "flowRules", nodeId));
    const currentPos = snap.exists() ? snap.data().position : { x: 100, y: 100 };
    const payload = { 
        ...nodeData, 
        nodeName: `${nodeData.nodeName}_複本`,
        position: { x: currentPos.x + 40, y: currentPos.y + 40 },
        updatedAt: serverTimestamp() 
    };
    await addDoc(collection(db, "flowRules"), payload);
    setIsSaving(false);
    alert("✅ 節點已成功複製！");
  };

  const renderLibraryDropdown = (onSelect: (url: string) => void) => {
    const filteredLib = library.filter(item => {
        let matchType = true;
        if (libFilter !== 'all') {
          const t = (item.type || '').toLowerCase();
          const u = (item.url || '').toLowerCase();
          const isVideo = t === 'video' || u.includes('youtube') || u.includes('youtu.be') || u.endsWith('.mp4');
          const isFile = t === 'file' || u.endsWith('.pdf');
          if (libFilter === 'video') matchType = isVideo;
          else if (libFilter === 'file') matchType = isFile;
          else if (libFilter === 'image') matchType = !isVideo && !isFile;
        }
        return (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && matchType;
    });

    return (
        <div className="bg-slate-800 rounded-xl border border-[#deff9a]/20 mt-2 shadow-2xl z-50 overflow-hidden flex flex-col">
            <div className="flex bg-slate-900/50 p-1 border-b border-white/5">
                {['all', 'image', 'video', 'file'].map((type) => (
                    <button key={type} onClick={() => setLibFilter(type as any)} className={`flex-1 text-[10px] py-1.5 font-bold rounded ${libFilter === type ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}>
                        {type === 'all' ? '全部' : type === 'image' ? '圖片' : type === 'video' ? '影片' : '文件'}
                    </button>
                ))}
            </div>
            <div className="p-2 bg-slate-900/30 border-b border-white/5 flex items-center gap-2">
                <Search size={14} className="text-slate-500 ml-1" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜尋資源..." className="bg-transparent border-none text-xs outline-none w-full text-slate-200" />
            </div>
            <div className="max-h-60 overflow-y-auto p-2 grid gap-1">
                {filteredLib.map(item => (
                    <div key={item.id} onClick={() => { onSelect(item.url); setSearchTerm(''); }} className="p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-700 flex justify-between items-center transition-colors">
                        <span className="truncate text-xs text-slate-300">{item.name}</span>
                        <span className="text-[#deff9a] text-[10px] font-bold">選取</span>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  if (!nodeId) return null;

  return (
    <div className="w-[480px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a]">COMMAND CENTER</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
        <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="flex-[2] space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    啟動關鍵字
                    <div className="group relative flex items-center">
                        <Info size={10} className="text-slate-400 cursor-help hover:text-[#deff9a]"/>
                        <div className="absolute left-4 top-0 w-48 bg-slate-800 text-slate-300 text-[9px] p-2.5 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-white/10 font-normal">
                            使用者輸入此字將觸發本節點。若名為「預設回覆」則為查無字詞時的保底。
                        </div>
                    </div>
                </label>
                <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} placeholder="例如: 產品報價" className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Tag size={10}/> 自定義標籤</label>
                <input value={nodeData.customLabel || ""} onChange={e => setNodeData({...nodeData, customLabel: e.target.value})} placeholder="用途標註" className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-400" />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1 p-1 bg-slate-900 rounded-lg">
                {['text', 'image', 'video', 'file', 'flex', 'carousel'].map(t => (
                    <button key={t} onClick={() => setNodeData({...nodeData, messageType: t})} className={`py-2 rounded-md text-[9px] font-bold uppercase transition-all ${nodeData.messageType === t ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}>{t}</button>
                ))}
            </div>

            <div className="space-y-4 border-t border-white/5 pt-4">
                {nodeData.messageType === 'text' && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-500">回覆文字</label></div>
                        <textarea value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="回覆內容..." className="w-full bg-slate-900 rounded-xl p-4 text-sm outline-none min-h-[120px]" />
                    </div>
                )}
                {nodeData.messageType === 'image' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500">圖片網址</label>
                        <input value={nodeData.imageUrl || ""} onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} placeholder="限 https:// 網址..." className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-xs outline-none" />
                    </div>
                )}
                {(nodeData.messageType === 'flex' || nodeData.messageType === 'carousel') && (
                    <div className="space-y-4">
                         <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 flex items-start gap-1.5">
                            <Info size={12} className="text-blue-400 mt-0.5" />
                            <div className="text-[9px] text-blue-300 leading-relaxed">
                                <span className="font-bold block">小秘訣：</span>
                                • <code className="text-[#deff9a]">tel:號碼</code> 撥電話 (例: tel:0912345678)<br/>
                                • <code className="text-[#deff9a]">https://...</code> 開網頁 <span className="text-red-400 font-bold">(嚴禁 http)</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">卡片內容</label>
                            <textarea value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="卡片主文字..." className="w-full bg-slate-900 rounded-xl p-4 text-sm outline-none min-h-[80px]" />
                        </div>
                        <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span>按鈕設定 ({nodeData.buttons?.length || 0}/6)</span>
                                <button onClick={() => { if((nodeData.buttons?.length || 0) < 6) setNodeData({...nodeData, buttons: [...(nodeData.buttons || []), {label: "", target: ""}]}) }} className="text-[#deff9a]"><Plus size={14}/></button>
                            </div>
                            {nodeData.buttons?.map((btn: any, i: number) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input value={btn.label} onChange={e => { const nb = [...nodeData.buttons]; nb[i].label = e.target.value; setNodeData({...nodeData, buttons: nb}) }} placeholder="文字" className="flex-1 bg-slate-900 rounded p-2 text-xs outline-none" />
                                    <input value={btn.target} onChange={e => { const nb = [...nodeData.buttons]; nb[i].target = e.target.value; setNodeData({...nodeData, buttons: nb}) }} placeholder="關鍵字 / tel: / https://" className="flex-[1.5] bg-slate-900 rounded p-2 text-xs outline-none focus:ring-1 ring-blue-400" />
                                    <button onClick={() => { const nb = [...nodeData.buttons]; nb.splice(i,1); setNodeData({...nodeData, buttons: nb}) }} className="text-red-500 p-1"><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <button onClick={() => { if(window.confirm("刪除節點？")) deleteDoc(doc(db, "flowRules", nodeId!)); onClose(); }} className="w-full text-red-500/50 hover:text-red-500 text-[10px] py-4 uppercase font-bold tracking-widest flex items-center justify-center gap-1 transition-colors"><Trash2 size={12}/> Delete Node</button>
        </div>

        <div className="p-6 bg-slate-900/40 border-t border-white/10 mt-auto">
            <h4 className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">預覽</h4>
            <LineSimulator data={nodeData} />
        </div>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-900 flex gap-3">
        <button onClick={handleDuplicate} disabled={isSaving} className="flex-1 bg-slate-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-600"><Copy size={18}/> 複製節點</button>
        <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">儲存配置</button>
      </div>
    </div>
  )
}
