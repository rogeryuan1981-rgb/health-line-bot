import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Library, Maximize2, Minimize2, Smile } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

const EMOJI_LIST = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😮','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','😤','😢','😭','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😇','🤠','🤡','🥳','🥴','🥺','🤥','🤫','🤭','🧐','🤓','👾','🤖','💩',
  '👋','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','👍','👎','✊','👊','👏','🙌','🙏',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🔥','✨','🌟','☀️','🌙','🌈','☁️','⚡','❄️','💥','💨','💦','🍀','🌸','🍓','🍔','🍺','☕','🎮','💻','📱','📧','💬','📞','📌','📍','🔍','📅','💰','🎁','🚀','🏆','👑','💎',
  '0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟',
  '✅','❌','⚠️','🆗','🆙','🆕','🆓','🆘','📢','📣','🔔','🔕','🎵','🎶','💡','💢','💯','💠','🔘','🏁','🚩','⬅️','➡️','⬆️','⬇️','↩️','↪️','◀️','▶️'
];

export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  const [nodeData, setNodeData] = useState<any>({
    nodeName: "", messageType: 'text', cardSize: 'md', 
    btnStyle: 'primary', textContent: "", imageUrl: "", imageUrls: [], videoUrl: "", fileUrl: "", 
    buttons: [], cards: []
  });
  
  const [library, setLibrary] = useState<any[]>([]);
  const [activeLib, setActiveLib] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 👉 新增：控制資源庫選單的分類過濾器
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

  const getResourceBadge = (item: any) => {
    const t = (item.type || '').toLowerCase();
    const u = (item.url || '').toLowerCase();
    
    if (t === 'video' || u.includes('youtube') || u.includes('youtu.be') || u.endsWith('.mp4') || u.endsWith('.mov')) {
        return <span className="w-9 flex justify-center bg-rose-500/20 text-rose-400 px-1 py-0.5 rounded text-[8px] mr-2 font-bold border border-rose-500/30 flex-shrink-0">VIDEO</span>;
    }
    if (t === 'file' || t === 'pdf' || u.endsWith('.pdf')) {
        return <span className="w-9 flex justify-center bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded text-[8px] mr-2 font-bold border border-blue-500/30 flex-shrink-0">FILE</span>;
    }
    return (
        <div className="w-9 h-9 mr-2 rounded bg-slate-950 overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
            <img src={item.url} alt="thumb" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
    );
  };

  // 👉 核心升級：帶有分類過濾按鈕的下拉選單
  const renderLibraryDropdown = (onSelect: (url: string) => void) => {
    const filteredLib = library.filter(item => {
        if (libFilter === 'all') return true;
        const t = (item.type || '').toLowerCase();
        const u = (item.url || '').toLowerCase();
        const isVideo = t === 'video' || u.includes('youtube') || u.includes('youtu.be') || u.endsWith('.mp4') || u.endsWith('.mov');
        const isFile = t === 'file' || t === 'pdf' || u.endsWith('.pdf');
        
        if (libFilter === 'video') return isVideo;
        if (libFilter === 'file') return isFile;
        if (libFilter === 'image') return !isVideo && !isFile;
        return true;
    });

    return (
        <div className="bg-slate-800 rounded-xl border border-[#deff9a]/20 mt-2 shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* 分類按鈕區塊 */}
            <div className="flex bg-slate-900/50 p-1 border-b border-white/5">
                <button onClick={() => setLibFilter('all')} className={`flex-1 text-[10px] py-1.5 font-bold rounded transition-colors ${libFilter==='all'?'bg-slate-700 text-white':'text-slate-500 hover:text-slate-300'}`}>全部</button>
                <button onClick={() => setLibFilter('image')} className={`flex-1 text-[10px] py-1.5 font-bold rounded transition-colors ${libFilter==='image'?'bg-slate-700 text-white':'text-slate-500 hover:text-slate-300'}`}>圖片</button>
                <button onClick={() => setLibFilter('video')} className={`flex-1 text-[10px] py-1.5 font-bold rounded transition-colors ${libFilter==='video'?'bg-slate-700 text-white':'text-slate-500 hover:text-slate-300'}`}>影片</button>
                <button onClick={() => setLibFilter('file')} className={`flex-1 text-[10px] py-1.5 font-bold rounded transition-colors ${libFilter==='file'?'bg-slate-700 text-white':'text-slate-500 hover:text-slate-300'}`}>文件</button>
            </div>
            
            {/* 列表區塊 */}
            <div className="max-h-60 overflow-y-auto p-2 grid gap-1">
                {filteredLib.map(item => (
                    <div key={item.id} onClick={() => onSelect(item.url)} className="p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-700 flex justify-between items-center transition-colors group">
                        <div className="flex items-center overflow-hidden pr-2">
                            {getResourceBadge(item)}
                            <span className="truncate text-xs text-slate-300 group-hover:text-white" title={item.name}>{item.name}</span>
                        </div>
                        <span className="text-[#deff9a] text-[10px] font-bold flex-shrink-0 opacity-80 group-hover:opacity-100 bg-slate-800 px-2 py-1 rounded">選取</span>
                    </div>
                ))}
                {filteredLib.length === 0 && <div className="text-center text-xs text-slate-500 py-6">無符合的資源</div>}
            </div>
        </div>
    );
  };

  const renderResourcePicker = (field: 'videoUrl' | 'fileUrl', label: string, placeholder: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
        <button onClick={() => setActiveLib(activeLib === field ? null : field)} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline">
          <Library size={12}/> 從資源庫調用
        </button>
      </div>
      <input 
        value={nodeData[field] || ""} 
        onChange={e => setNodeData({...nodeData, [field]: e.target.value})} 
        className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" 
        placeholder={placeholder} 
      />
      {activeLib === field && renderLibraryDropdown((url) => { 
          setNodeData({...nodeData, [field]: url}); 
          setActiveLib(null); 
      })}
    </div>
  );

  const renderMultiImagePicker = () => {
    const urls = (nodeData.imageUrls && nodeData.imageUrls.length > 0) ? nodeData.imageUrls : (nodeData.imageUrl ? [nodeData.imageUrl] : ['']);
    
    return (
        <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>多圖連發 (上限 5 張) ({urls.length}/5)</span>
                <button onClick={() => { if(urls.length < 5) setNodeData({...nodeData, imageUrls: [...urls, '']}) }} className="text-[#deff9a] bg-slate-800 p-1 rounded hover:bg-slate-700 transition-colors"><Plus size={14}/></button>
            </div>
            {urls.map((url: string, idx: number) => (
                <div key={idx} className="space-y-2 border-b border-white/5 pb-3 last:border-0">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">第 {idx + 1} 張圖</label>
                        <button onClick={() => setActiveLib(activeLib === `image-${idx}` ? null : `image-${idx}`)} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline">
                            <Library size={12}/> 調用資源
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input value={url} onChange={e => { 
                            const newUrls = [...urls]; 
                            newUrls[idx] = e.target.value; 
                            setNodeData({...nodeData, imageUrls: newUrls, ...(idx === 0 ? {imageUrl: e.target.value} : {})}); 
                        }} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" placeholder="圖片 JPG/PNG 網址..." />
                        {urls.length > 1 && (
                            <button onClick={() => { 
                                const newUrls = [...urls]; 
                                newUrls.splice(idx, 1); 
                                setNodeData({...nodeData, imageUrls: newUrls, ...(idx === 0 && newUrls.length > 0 ? {imageUrl: newUrls[0]} : {})}); 
                            }} className="text-red-500 hover:bg-red-500/20 p-2 rounded-xl transition-colors"><Trash2 size={14}/></button>
                        )}
                    </div>
                    {activeLib === `image-${idx}` && renderLibraryDropdown((selectedUrl) => { 
                        const newUrls = [...urls]; 
                        newUrls[idx] = selectedUrl; 
                        setNodeData({...nodeData, imageUrls: newUrls, ...(idx === 0 ? {imageUrl: selectedUrl} : {})}); 
                        setActiveLib(null); 
                    })}
                </div>
            ))}
        </div>
    )
  };

  const renderTextContentInput = (placeholder: string, minHeight: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-slate-500 uppercase">回覆內容文字</label>
        <button onClick={() => setShowEmoji(!showEmoji)} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors ${showEmoji ? 'bg-[#deff9a] text-black font-bold' : 'text-[#deff9a] bg-slate-800 hover:bg-slate-700'}`}>
          <Smile size={12}/> 選擇符號
        </button>
      </div>
      {showEmoji && (
        <div className="bg-slate-800 p-3 rounded-xl flex flex-wrap gap-1.5 border border-white/10 animate-in fade-in zoom-in duration-200 max-h-60 overflow-y-auto scrollbar-hide shadow-inner">
            {EMOJI_LIST.map((emoji, idx) => (
                <button key={idx} onClick={() => setNodeData({...nodeData, textContent: (nodeData.textContent || '') + emoji})} className="w-9 h-9 flex items-center justify-center hover:bg-slate-700 active:scale-90 rounded text-xl transition-all">{emoji}</button>
            ))}
        </div>
      )}
      <textarea 
        value={nodeData.textContent || ""} 
        onChange={e => setNodeData({...nodeData, textContent: e.target.value})} 
        placeholder={placeholder} 
        className={`w-full bg-slate-900 rounded-xl p-4 text-sm outline-none leading-relaxed ${minHeight}`} 
      />
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
            
            {nodeData.messageType === 'text' && renderTextContentInput('純文字回覆內容...', 'min-h-[120px]')}

            {nodeData.messageType === 'image' && renderMultiImagePicker()}

            {nodeData.messageType === 'video' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">預覽封面 (Cover)</label>
                        <button onClick={() => setActiveLib(activeLib === 'cover' ? null : 'cover')} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline">
                          <Library size={12}/> 從資源庫調用
                        </button>
                      </div>
                      <input value={nodeData.imageUrl || ""} onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" placeholder="影片預覽封面網址..." />
                      {activeLib === 'cover' && renderLibraryDropdown((url) => { setNodeData({...nodeData, imageUrl: url}); setActiveLib(null); })}
                    </div>
                    {renderResourcePicker('videoUrl', '影片來源 (Source)', '影片播放網址...')}
                    {renderTextContentInput('影片下方說明文字 (選填)...', 'min-h-[80px]')}
                </div>
            )}

            {nodeData.messageType === 'file' && (
                <div className="space-y-4">
                    {renderResourcePicker('fileUrl', '檔案來源網址', '請輸入 PDF/檔案 網址 (必須為 HTTPS)...')}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">檔案顯示名稱 (FileName)</label>
                        <input value={nodeData.textContent || ""} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} placeholder="例如: 2026產品型錄.pdf" className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-xs outline-none" />
                    </div>
                </div>
            )}

            {nodeData.messageType === 'flex' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">卡片圖片 (選填)</label>
                        <button onClick={() => setActiveLib(activeLib === 'flexImg' ? null : 'flexImg')} className="text-[#deff9a] flex items-center gap-1 text-[10px] hover:underline">
                          <Library size={12}/> 從資源庫調用
                        </button>
                      </div>
                      <input value={nodeData.imageUrl || ""} onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none" placeholder="圖片網址 (不填則為純文字卡片)" />
                      {activeLib === 'flexImg' && renderLibraryDropdown((url) => { setNodeData({...nodeData, imageUrl: url}); setActiveLib(null); })}
                    </div>
                    {renderTextContentInput('卡片主體文字 (支援換行)...', 'min-h-[80px]')}
                    
                    <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>卡片按鈕設定 ({nodeData.buttons?.length || 0}/6)</span>
                            <button onClick={() => { if((nodeData.buttons?.length || 0) < 6) setNodeData({...nodeData, buttons: [...(nodeData.buttons || []), {label: "", target: ""}]}) }} className="text-[#deff9a]"><Plus size={14}/></button>
                        </div>
                        <div className="flex gap-2 pb-2 border-b border-white/5">
                            <button onClick={() => setNodeData({...nodeData, btnStyle: 'primary'})} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${nodeData.btnStyle==='primary'?'border-[#06C755] bg-[#06C755]/10 text-[#06C755]':'border-transparent bg-slate-800 text-slate-500'}`}>綠色實心按鈕</button>
                            <button onClick={() => setNodeData({...nodeData, btnStyle: 'link'})} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${nodeData.btnStyle==='link'?'border-[#06C755] bg-[#06C755]/10 text-[#06C755]':'border-transparent bg-slate-800 text-slate-500'}`}>透明文字連結</button>
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

            {nodeData.messageType === 'carousel' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>輪播卡片 ({nodeData.cards?.length || 0}/10)</span>
                        <button onClick={() => setNodeData({...nodeData, cards: [...(nodeData.cards || []), { title: "", price: "", imageUrl: "", buttons: [] }]})} className="text-[#deff9a]"><Plus size={16}/></button>
                    </div>
                    <div className="flex gap-2 bg-slate-800/50 p-2 rounded-xl border border-white/5">
                        <button onClick={() => setNodeData({...nodeData, btnStyle: 'primary'})} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${nodeData.btnStyle==='primary'?'border-[#06C755] bg-[#06C755]/10 text-[#06C755]':'border-transparent bg-slate-900 text-slate-500'}`}>統一使用: 綠色按鈕</button>
                        <button onClick={() => setNodeData({...nodeData, btnStyle: 'link'})} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${nodeData.btnStyle==='link'?'border-[#06C755] bg-[#06C755]/10 text-[#06C755]':'border-transparent bg-slate-900 text-slate-500'}`}>統一使用: 透明連結</button>
                    </div>
                    {nodeData.cards?.map((card: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-xl border border-white/5 space-y-2 relative group">
                            <input placeholder="卡片標題" value={card.title} onChange={e => { const nc = [...nodeData.cards]; nc[idx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded px-3 py-2 text-sm outline-none" />
                            <input placeholder="內容/價格" value={card.price} onChange={e => { const nc = [...nodeData.cards]; nc[idx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded px-3 py-2 text-xs outline-none" />
                            
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase mt-2">
                                <span>輪播圖片</span>
                                <button onClick={() => setActiveLib(activeLib === `carouselImg-${idx}` ? null : `carouselImg-${idx}`)} className="text-[#deff9a] flex items-center gap-1 hover:underline">
                                  <Library size={12}/> 調用資源
                                </button>
                            </div>
                            <input placeholder="圖片網址" value={card.imageUrl || ""} onChange={e => { const nc = [...nodeData.cards]; nc[idx].imageUrl = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded px-3 py-2 text-[10px] outline-none" />
                            {activeLib === `carouselImg-${idx}` && renderLibraryDropdown((url) => { 
                                const nc = [...nodeData.cards]; 
                                nc[idx].imageUrl = url; 
                                setNodeData({...nodeData, cards: nc}); 
                                setActiveLib(null); 
                            })}
                            
                            <div className="pt-2 border-t border-white/5 mt-2">
                                <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1">
                                    <span>按鈕 ({card.buttons?.length || 0}/6)</span>
                                    <button onClick={() => { if((card.buttons?.length || 0) < 6) { const nc = [...nodeData.cards]; nc[idx].buttons = [...(card.buttons || []), {label: "", target: ""}]; setNodeData({...nodeData, cards: nc}) } }} className="text-[#deff9a]"><Plus size={12}/></button>
                                </div>
                                {card.buttons?.map((btn: any, bIdx: number) => (
                                    <div key={bIdx} className="flex gap-1 mb-1">
                                        <input placeholder="按鈕文字" value={btn.label} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].label = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1.5 text-[10px] outline-none" />
                                        <input placeholder="關鍵字" value={btn.target} onChange={e => { const nc = [...nodeData.cards]; nc[idx].buttons[bIdx].target = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-900 rounded p-1.5 text-[10px] outline-none" />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { const nc = [...nodeData.cards]; nc.splice(idx,1); setNodeData({...nodeData, cards: nc}) }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={10}/></button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <button onClick={() => { if(window.confirm("刪除節點？")) deleteDoc(doc(db, "flowRules", nodeId!)); onClose(); }} className="w-full text-red-500/50 hover:text-red-500 text-[10px] py-4 uppercase font-bold tracking-widest flex items-center justify-center gap-1"><Trash2 size={12}/> Delete Node</button>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-900">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">儲存配置</button>
      </div>
    </div>
  )
}
