import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Library, Maximize2, Minimize2, Smile, Search, Tag, Info, Copy } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator' // 👉 確保這行被讀取

const EMOJI_LIST = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😮','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','😤','😢','😭','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😇','🤠','🤡','🥳','🥴','🥺','🤥','🤫','🤭','🧐','🤓','👾','🤖','💩',
  '👋','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','👍','👎','✊','👊','👏','🙌','🙏',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🔥','✨','🌟','☀️','🌙','🌈','☁️','⚡','❄️','💥','💨','💦','🍀','🌸','🍓','🍔','🍺','☕','🎮','辦公室','📱','📧','💬','📞','📌','📍','🔍','📅','💰','🎁','🚀','🏆','👑','💎',
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
          const isVideo = t === 'video' || u.includes('youtube') || u.endsWith('.mp4');
          const isFile = t === 'file' || u.endsWith('.pdf');
          if (libFilter === 'video') matchType = isVideo;
          else if (libFilter === 'file') matchType = isFile;
          else if (libFilter === 'image') matchType = !isVideo && !isFile;
        }
        return (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && matchType;
    });

    return (
        <div className="bg-slate-800 rounded-xl border border-[#deff9a]/20 mt-2 shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex bg-slate-900/50 p-1 border-b border-white/5">
                {['all', 'image', 'video', 'file'].map((type) => (
                    <button key={type} onClick={() => setLibFilter(type as any)} className={`flex-1 text-[10px] py-1.5 font-bold rounded ${libFilter === type ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}>
                        {type === 'all' ? '全部' : type === 'image' ? '圖片' : type === 'video' ? '影片' : '文件'}
                    </button>
                ))}
            </div>
            <div className="p-2 bg-slate-900/30 border-b border-white/5 flex items-center gap-2">
                <Search size={14} className="text-slate-500 ml-1" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜尋資源庫..." className="bg-transparent border-none text-xs outline-none w-full text-slate-200" />
            </div>
            <div className="max-h-48 overflow-y-auto p-2 grid gap-1">
                {filteredLib.map(item => (
                    <div key={item.id} onClick={() => { onSelect(item.url); setActiveLib(null); }} className="p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-700 flex justify-between items-center transition-colors">
                        <span className="truncate text-xs text-slate-300">{item.name}</span>
                        <span className="text-[#deff9a] text-[10px] font-bold">選取</span>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderMultiImagePicker = () => {
    const urls = (nodeData.imageUrls && nodeData.imageUrls.length > 0) ? nodeData.imageUrls : (nodeData.imageUrl ? [nodeData.imageUrl] : ['']);
    return (
        <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-white/5 animate-in fade-in">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>多圖連發 (上限 5 張) ({urls.length}/5)</span>
                <button onClick={() => { if(urls.length < 5) setNodeData({...nodeData, imageUrls: [...urls, '']}) }} className="text-[#deff9a] hover:bg-slate-700 p-1 rounded transition-colors"><Plus size={14}/></button>
            </div>
            {urls.map((url: string, idx: number) => (
                <div key={idx} className="space-y-2 border-b border-white/5 pb-3 last:border-0">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">第 {idx + 1} 張圖</label>
                        <button onClick={() => setActiveLib(activeLib === `image-${idx}` ? null : `image-${idx}`)} className="text-[#deff9a] text-[10px] flex items-center gap-1 hover:underline"><Library size={12}/> 資源庫</button>
                    </div>
                    <div className="flex gap-2">
                        <input value={url} onChange={e => { const newUrls = [...urls]; newUrls[idx] = e.target.value; setNodeData({...nodeData, imageUrls: newUrls, imageUrl: newUrls[0]}); }} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none placeholder:text-slate-600" placeholder="圖片網址 (限 https://)" />
                        {urls.length > 1 && <button onClick={() => { const newUrls = [...urls]; newUrls.splice(idx, 1); setNodeData({...nodeData, imageUrls: newUrls, imageUrl: newUrls[0]}); }} className="text-red-500 p-2 hover:bg-red-500/20 rounded-xl transition-colors"><Trash2 size={14}/></button>}
                    </div>
                    {activeLib === `image-${idx}` && renderLibraryDropdown((selectedUrl) => { const newUrls = [...urls]; newUrls[idx] = selectedUrl; setNodeData({...nodeData, imageUrls: newUrls, imageUrl: newUrls[0]}); })}
                </div>
            ))}
        </div>
    );
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
          {isGroup ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">區塊標題 (Title)</label>
                    <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-white/5 focus:ring-[#deff9a]" placeholder="例如：主流程、售後區..." />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">區塊狀態 (Status)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: '規劃中', color: 'bg-blue-600' },
                            { id: '待處理', color: 'bg-amber-600' },
                            { id: '已完成', color: 'bg-emerald-600' }
                        ].map(status => (
                            <button 
                                key={status.id}
                                onClick={() => setNodeData({...nodeData, customLabel: status.id})}
                                className={`py-3 rounded-xl text-[10px] font-black border transition-all ${nodeData.customLabel === status.id ? 'border-white bg-slate-700 shadow-lg' : 'border-transparent bg-slate-900 text-slate-500'}`}
                            >
                                <div className={`w-2 h-2 rounded-full inline-block mr-2 ${status.color}`}></div>
                                {status.id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex gap-4">
                  <div className="flex-[2] space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        啟動關鍵字
                        <div className="group relative flex items-center">
                            <Info size={10} className="text-slate-400 cursor-help hover:text-[#deff9a] transition-colors"/>
                            <div className="absolute left-4 top-0 w-48 bg-slate-800 text-slate-300 text-[9px] p-2.5 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-white/10 font-normal normal-case">
                                使用者輸入此字將觸發。若名為 <span className="text-[#deff9a] font-bold">預設回覆</span> 則為保底。
                            </div>
                        </div>
                    </label>
                    <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" placeholder="例如: 產品報價" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Tag size={10}/> 自定義標籤</label>
                    <input value={nodeData.customLabel || ""} onChange={e => setNodeData({...nodeData, customLabel: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-400" placeholder="用途標註" />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-1 p-1 bg-slate-900 rounded-lg">
                    {['text', 'image', 'video', 'file', 'flex', 'carousel'].map(t => (
                        <button key={t} onClick={() => setNodeData({...nodeData, messageType: t})} className={`py-2 rounded-md text-[9px] font-bold uppercase transition-all ${nodeData.messageType === t ? 'bg-slate-700 text-[#deff9a]' : 'text-slate-500'}`}>{t}</button>
                    ))}
                </div>

                {(nodeData.messageType === 'flex' || nodeData.messageType === 'carousel') && (
                    <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
                      <button onClick={() => setNodeData({...nodeData, cardSize: 'md'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 ${nodeData.cardSize==='md'?'bg-slate-700 text-white':'text-slate-500'}`}><Maximize2 size={12}/> 標準尺寸</button>
                      <button onClick={() => setNodeData({...nodeData, cardSize: 'sm'})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 ${nodeData.cardSize==='sm'?'bg-slate-700 text-white':'text-slate-500'}`}><Minimize2 size={12}/> 微型尺寸</button>
                    </div>
                )}

                <div className="space-y-4 border-t border-white/5 pt-4">
                    {nodeData.messageType === 'text' && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">回覆內容文字</label>
                                <button onClick={() => setShowEmoji(!showEmoji)} className={`text-[10px] px-2 py-1 rounded transition-colors ${showEmoji ? 'bg-[#deff9a] text-black font-bold' : 'text-[#deff9a] bg-slate-800'}`}><Smile size={12}/> 符號</button>
                            </div>
                            {showEmoji && (
                                <div className="grid grid-cols-8 gap-1 bg-slate-900 p-2 rounded-xl max-h-32 overflow-y-auto scrollbar-hide border border-white/5">
                                    {EMOJI_LIST.map(e => <button key={e} onClick={() => setNodeData({...nodeData, textContent: (nodeData.textContent||"") + e})} className="hover:bg-white/10 p-1 rounded text-lg">{e}</button>)}
                                </div>
                            )}
                            <textarea value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} className="w-full bg-slate-900 rounded-xl p-4 text-sm outline-none min-h-[120px] leading-relaxed placeholder:text-slate-600" placeholder="請輸入回覆文字..." />
                        </div>
                    )}

                    {nodeData.messageType === 'image' && renderMultiImagePicker()}

                    {nodeData.messageType === 'video' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">預覽封面 (HTTPS)</label>
                                <button onClick={() => setActiveLib(activeLib==='vCover'?'null':'vCover')} className="text-[#deff9a] text-[10px] flex items-center gap-1"><Library size={12}/> 資源庫</button>
                              </div>
                              <input value={nodeData.imageUrl || ""} onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" placeholder="封面圖網址 (https://)..." />
                              {activeLib==='vCover' && renderLibraryDropdown((url)=>setNodeData({...nodeData, imageUrl:url}))}
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">影片連結 (HTTPS)</label>
                              <input value={nodeData.videoUrl || ""} onChange={e => setNodeData({...nodeData, videoUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" placeholder="影片網址 (https://)..." />
                            </div>
                        </div>
                    )}

                    {nodeData.messageType === 'file' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">檔案網址 (限 HTTPS) <Info size={10} className="text-blue-400"/></label>
                              <input value={nodeData.fileUrl || ""} onChange={e => setNodeData({...nodeData, fileUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">顯示檔名</label>
                              <input value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-xs outline-none" placeholder="例如: 產品目錄.pdf" />
                            </div>
                        </div>
                    )}

                    {(nodeData.messageType === 'flex' || nodeData.messageType === 'carousel') && (
                        <div className="space-y-4">
                             <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 flex items-start gap-1.5 relative group">
                                <Info size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="text-[9.5px] text-blue-300 leading-relaxed">
                                    <span className="font-bold block">操作秘訣：</span>
                                    • <code className="text-[#deff9a]">tel:號碼</code> 撥電話<br/>
                                    • <code className="text-[#deff9a]">https://...</code> 開網頁 <span className="text-red-400 font-bold">(限 https)</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">卡片圖片 (選填)</label>
                                <button onClick={() => setActiveLib(activeLib==='fImg'?'null':'fImg')} className="text-[#deff9a] text-[10px] flex items-center gap-1 hover:underline"><Library size={12}/> 資源庫</button>
                              </div>
                              <input value={nodeData.imageUrl || ""} onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" placeholder="圖片網址 (限 https://)" />
                              {activeLib==='fImg' && renderLibraryDropdown((url)=>setNodeData({...nodeData, imageUrl:url}))}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">卡片內文</label>
                                <textarea value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="卡片主文字..." className="w-full bg-slate-900 rounded-xl p-4 text-sm outline-none min-h-[80px]" />
                            </div>
                            <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                    <span>按鈕設定 ({nodeData.buttons?.length || 0}/6)</span>
                                    <button onClick={() => { if((nodeData.buttons?.length || 0) < 6) setNodeData({...nodeData, buttons: [...(nodeData.buttons || []), {label: "", target: ""}]}) }} className="text-[#deff9a] hover:bg-slate-700 p-1 rounded transition-colors"><Plus size={14}/></button>
                                </div>
                                {nodeData.buttons?.map((btn: any, i: number) => (
                                    <div key={i} className="flex gap-2 items-center animate-in slide-in-from-right-2 transition-all">
                                        <input value={btn.label} onChange={e => { const nb = [...nodeData.buttons]; nb[i].label = e.target.value; setNodeData({...nodeData, buttons: nb}) }} placeholder="按鈕文字" className="flex-1 bg-slate-900 rounded p-2 text-xs outline-none ring-1 ring-white/5 focus:ring-blue-400" />
                                        <input value={btn.target} onChange={e => { const nb = [...nodeData.buttons]; nb[i].target = e.target.value; setNodeData({...nodeData, buttons: nb}) }} placeholder="關鍵字 / tel: / https://" className="flex-[1.5] bg-slate-900 rounded p-2 text-xs outline-none focus:ring-1 ring-blue-400" />
                                        <button onClick={() => { const nb = [...nodeData.buttons]; nb.splice(i,1); setNodeData({...nodeData, buttons: nb}) }} className="text-red-500 p-1 hover:bg-red-500/10 rounded-full transition-colors"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          )}

          <button onClick={() => { if(window.confirm(`確定刪除此${isGroup ? '區塊' : '節點'}？`)) deleteDoc(doc(db, "flowRules", nodeId!)); onClose(); }} className="w-full text-red-500/50 hover:text-red-500 text-[10px] py-4 uppercase font-bold tracking-widest flex items-center justify-center gap-1 mt-4 transition-colors border-t border-white/5 pt-8">
            <Trash2 size={12}/> Delete {isGroup ? 'Group' : 'Node'}
          </button>
      </div>

      {/* 👉 補回被讀取的實機預覽區塊 */}
      {!isGroup && (
        <div className="px-6 pb-6 bg-[#1e293b] border-t border-white/5">
            <h4 className="text-[10px] font-bold text-slate-500 mt-6 mb-4 uppercase tracking-widest">實機預覽</h4>
            <LineSimulator data={nodeData} />
        </div>
      )}

      <div className="p-6 border-t border-white/10 bg-slate-900 flex gap-3 z-50">
        {!isGroup && (
            <button onClick={handleDuplicate} disabled={isSaving} className="flex-1 bg-slate-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-600">
                <Copy size={18}/> 複製
            </button>
        )}
        <button onClick={handleSave} disabled={isSaving} className={`${isGroup ? 'w-full' : 'flex-[2]'} bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all hover:brightness-110`}>
            {isSaving ? "處理中..." : `儲存${isGroup ? '區塊' : '配置'}`}
        </button>
      </div>
    </div>
  )
}
