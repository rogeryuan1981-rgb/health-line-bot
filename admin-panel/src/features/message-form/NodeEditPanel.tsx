import { useState, useEffect } from "react";
import { X, Plus, Trash2, Library, Maximize2, Minimize2, Smile, Search, Tag, Info, Copy, ChevronDown, ChevronUp, Globe, Clock, CalendarDays, AlertTriangle } from "lucide-react";
import { doc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import LineSimulator from "../simulator/LineSimulator";

const EMOJI_LIST = [
  "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","😘","🥰","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😮","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🤑","😲","☹️","😤","😢","😭","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","😡","😠","🤬","😇","🤠","🤡","🥳","🥴","🥺","🤥","🤫","🤭","🧐","🤓","👾","🤖","💩",
  "👋","👌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","👍","👎","✊","👊","👏","🙌","🙏",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","🔥","✨","🌟","☀️","🌙","🌈","☁️","⚡","❄️","💥","💨","💦","🍀","🌸","🍓","🍔","🍺","☕","🎮","辦公室","📱","📧","💬","📞","📌","📍","🔍","📅","💰","🎁","🚀","🏆","👑","💎",
  "✅","❌","⚠️","🆗","🆙","🆕","🆓","🆘","📢","📣","🔔","🔕","🎵","🎶","💡","💢","💯","💠","🔘","🏁","🚩","⬅️","➡️","⬆️","⬇️","↩️","↪️","◀️","▶️"
];

const WEEKDAYS = [
    { id: 1, label: "一" }, { id: 2, label: "二" }, { id: 3, label: "三" },
    { id: 4, label: "四" }, { id: 5, label: "五" }, { id: 6, label: "六" }, { id: 0, label: "日" }
];

export default function NodeEditPanel({ nodeId, onClose, isReadOnly = false, sourceCollection = "flowRules" }: { nodeId: string | null, onClose: () => void, isReadOnly?: boolean, sourceCollection?: string }) {
  const [nodeData, setNodeData] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [activeLib, setActiveLib] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [libFilter, setLibFilter] = useState<"all" | "image" | "video" | "file">("all");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    let unsub: any = null;

    const fetchLib = async () => {
      const libSnap = await getDocs(collection(db, "resources"));
      setLibrary(libSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchLib();

    // 🚀 強制使用 onSnapshot 即時監聽，解決面板死當
    if (sourceCollection === "botConfig/production") {
        unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
            if (snap.exists()) {
                const foundNode = snap.data().nodes.find((n: any) => n.id === nodeId);
                let data = foundNode ? foundNode.data : null;
                if (data) {
                    if (data.messageType === "time_router" && !data.config) {
                        data.config = { startTime: "09:00", endTime: "18:00", workDays: [1,2,3,4,5], forceOffHours: false };
                    }
                    data.isGlobal = data.isGlobal || false;
                    setNodeData(data);
                }
            }
        });
    } else {
        unsub = onSnapshot(doc(db, sourceCollection, nodeId), (snap) => {
            if (snap.exists()) {
                let data = snap.data();
                if (data) {
                    if (data.messageType === "time_router" && !data.config) {
                        data.config = { startTime: "09:00", endTime: "18:00", workDays: [1,2,3,4,5], forceOffHours: false };
                    }
                    data.isGlobal = data.isGlobal || false;
                    setNodeData(data);
                }
            }
        });
    }

    return () => { if (unsub) unsub(); };
  }, [nodeId, sourceCollection]);

  const handleSave = async () => {
    if (!nodeId || isReadOnly) return;
    setIsSaving(true);
    const payload = { ...nodeData, updatedAt: serverTimestamp() };
    delete payload.position; 
    await updateDoc(doc(db, "flowRules", nodeId), payload);

    let allButtons = nodeData.buttons || [];
    if (nodeData.messageType === "carousel") {
        allButtons = (nodeData.cards || []).flatMap((c: any) => c.buttons || []);
    }

    if (allButtons.length > 0 && nodeData.messageType !== "time_router") {
      try {
        const edgesSnap = await getDocs(collection(db, "flowEdges"));
        const allEdges = edgesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const hasExistingOutEdges = allEdges.some((e: any) => e.source === nodeId);

        if (!hasExistingOutEdges) {
          const rulesSnap = await getDocs(collection(db, "flowRules"));
          const allNodes: any[] = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          for (const [index, btn] of allButtons.entries()) {
            const targetKeyword = btn.target?.trim();
            if (!targetKeyword || targetKeyword.startsWith("http") || targetKeyword.startsWith("tel:")) continue;
            const matchedNodes = allNodes.filter(n => {
              if (n.id === nodeId) return false;
              const keywords = (n.nodeName || "").split(",").map((k: string) => k.trim());
              return keywords.includes(targetKeyword) || (n.isGlobal && n.nodeName === targetKeyword);
            });
            if (matchedNodes.length > 0) {
              const targetNodeId = matchedNodes[0].id;
              const dynamicSourceHandle = "opt_" + index;
              const specificEdgeExists = allEdges.some((e: any) => e.source === nodeId && e.sourceHandle === dynamicSourceHandle);
              if (!specificEdgeExists) {
                await addDoc(collection(db, "flowEdges"), {
                  source: nodeId, target: targetNodeId, sourceHandle: dynamicSourceHandle, targetHandle: "left_in", 
                  color: "#60a5fa", strokeWidth: 2, dashed: true, arrowDirection: "forward", pathType: "smoothstep", createdAt: serverTimestamp()
                });
              }
            }
          }
        }
      } catch (e) { console.error(e); }
    }
    setIsSaving(false);
    alert("✅ 配置已儲存！");
  };

  const handleDuplicate = async () => {
    if (!nodeId || isReadOnly) return;
    setIsSaving(true);
    const snap = await getDoc(doc(db, "flowRules", nodeId));
    const currentPos = snap.exists() ? snap.data().position : { x: 100, y: 100 };
    await addDoc(collection(db, "flowRules"), { ...nodeData, nodeName: nodeData.nodeName + "_複本", position: { x: currentPos.x + 40, y: currentPos.y + 40 }, updatedAt: serverTimestamp() });
    setIsSaving(false);
    alert("✅ 節點已成功複製！");
  };

  const renderLibraryDropdown = (onSelect: (url: string) => void) => {
    const filteredLib = library.filter(item => {
        let matchType = true;
        if (libFilter !== "all") {
          const t = (item.type || "").toLowerCase(); const u = (item.url || "").toLowerCase();
          const isVideo = t === "video" || u.includes("youtube") || u.endsWith(".mp4");
          const isFile = t === "file" || u.endsWith(".pdf");
          if (libFilter === "video") matchType = isVideo; else if (libFilter === "file") matchType = isFile; else if (libFilter === "image") matchType = !isVideo && !isFile;
        }
        return (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) && matchType;
    });
    return (
        <div className="bg-slate-800 rounded-xl border border-[#deff9a]/20 mt-2 shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex bg-slate-900/50 p-1 border-b border-white/5">{["all", "image", "video", "file"].map((type) => (<button key={type} onClick={() => setLibFilter(type as any)} className={`flex-1 text-[10px] py-1.5 font-bold rounded ${libFilter === type ? "bg-slate-700 text-[#deff9a]" : "text-slate-500"}`}>{type === "all" ? "全部" : type === "image" ? "圖片" : type === "video" ? "影片" : "文件"}</button>))}</div>
            <div className="p-2 bg-slate-900/30 border-b border-white/5 flex items-center gap-2"><Search size={14} className="text-slate-500 ml-1" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜尋資源庫..." className="bg-transparent border-none text-xs outline-none w-full text-slate-200" /></div>
            <div className="max-h-48 overflow-y-auto p-2 grid gap-1">{filteredLib.map(item => (<div key={item.id} onClick={() => { onSelect(item.url); setActiveLib(null); }} className="p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-700 flex justify-between items-center transition-colors"><span className="truncate text-xs text-slate-300">{item.name}</span><span className="text-[#deff9a] text-[10px] font-bold">選取</span></div>))}</div>
        </div>
    );
  };

  const renderMultiImagePicker = () => {
    const urls = (nodeData.imageUrls && nodeData.imageUrls.length > 0) ? nodeData.imageUrls : (nodeData.imageUrl ? [nodeData.imageUrl] : [""]);
    return (
        <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-white/5 animate-in fade-in">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400"><span>多圖連發 (上限 5 張) ({urls.length}/5)</span>{!isReadOnly && <button onClick={() => { if(urls.length < 5) setNodeData({...nodeData, imageUrls: [...urls, ""]}) }} className="text-[#deff9a] hover:bg-slate-700 p-1 rounded transition-colors"><Plus size={14}/></button>}</div>
            {urls.map((url: string, idx: number) => (
                <div key={idx} className="space-y-2 border-b border-white/5 pb-3 last:border-0">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-500 uppercase">第 {idx + 1} 張圖</label>{!isReadOnly && <button onClick={() => setActiveLib(activeLib === "image-" + idx ? null : "image-" + idx)} className="text-[#deff9a] text-[10px] flex items-center gap-1 hover:underline"><Library size={12}/> 資源庫</button>}</div>
                    <div className="flex gap-2"><input value={url} disabled={isReadOnly} onChange={e => { const newUrls = [...urls]; newUrls[idx] = e.target.value; setNodeData({...nodeData, imageUrls: newUrls, imageUrl: newUrls[0]}); }} className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none placeholder:text-slate-600" placeholder="圖片網址" />{!isReadOnly && urls.length > 1 && <button onClick={() => { const newUrls = [...urls]; newUrls.splice(idx, 1); setNodeData({...nodeData, imageUrls: newUrls, imageUrl: newUrls[0]}); }} className="text-red-500 p-2 hover:bg-red-500/20 rounded-xl transition-colors"><Trash2 size={14}/></button>}</div>
                    {activeLib === "image-" + idx && renderLibraryDropdown((selectedUrl) => { const newUrls = [...urls]; newUrls[idx] = selectedUrl; setNodeData({...nodeData, imageUrls: newUrls, imageUrl: newUrls[0]}); })}
                </div>
            ))}
        </div>
    );
  };

  if (!nodeData) return null;
  const isGroup = nodeData.messageType === "group_box";
  const isTimeRouter = nodeData.messageType === "time_router";

  return (
    <div className={`w-full h-full bg-[#1e293b] flex flex-col shadow-2xl text-white font-sans ${isReadOnly ? "border-l-4 border-rose-500" : ""}`}>
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <div className="flex flex-col"><h3 className="font-black text-sm tracking-tighter italic text-[#deff9a] uppercase">{isReadOnly ? "READ-ONLY MONITOR" : "COMMAND CENTER"}</h3>{isReadOnly && <span className="text-[9px] text-rose-400 font-bold">這是目前線上的真實邏輯，禁止修改</span>}</div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col p-6 space-y-6">
          <div className="space-y-6">
              
              {!isGroup && !isTimeRouter && (
                <div className="space-y-2 mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">訊息類別</label>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-xl">
                    {["text", "image", "video", "flex", "carousel"].map(type => (
                      <button
                        key={type}
                        disabled={isReadOnly}
                        onClick={() => setNodeData({...nodeData, messageType: type})}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${nodeData.messageType === type ? "bg-slate-700 text-[#deff9a] shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        {type === "text" ? "文字" : type === "image" ? "圖片" : type === "video" ? "影片" : type === "flex" ? "Flex" : "輪播"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isGroup && (
                  <div className="flex gap-4">
                    <div className="flex-[2] space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">啟動關鍵字</label><input value={nodeData.nodeName || ""} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" /></div>
                    <div className="flex-1 space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Tag size={10}/> 自定義標籤</label><input value={nodeData.customLabel || ""} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, customLabel: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-400" /></div>
                  </div>
              )}
              {!isGroup && (
                <div className="flex items-center justify-between bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/30">
                  <div className="flex items-center gap-3"><Globe size={18} className={nodeData.isGlobal ? "text-indigo-400" : "text-slate-600"} /><div><label className={`text-[11px] font-black uppercase tracking-widest ${nodeData.isGlobal ? "text-indigo-300" : "text-slate-500"}`}>全域觸發 (任意門)</label></div></div>
                  <button disabled={isReadOnly} onClick={() => setNodeData({...nodeData, isGlobal: !nodeData.isGlobal})} className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${nodeData.isGlobal ? "bg-indigo-500" : "bg-slate-700"}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${nodeData.isGlobal ? "translate-x-6" : "translate-x-0"}`} /></button>
                </div>
              )}
              {isTimeRouter && (
                <div className="space-y-5 bg-indigo-950/20 p-5 rounded-2xl border border-indigo-500/20">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Clock size={14}/> 營業時段</label>
                    <div className="flex items-center gap-3"><input type="time" value={nodeData.config?.startTime || "09:00"} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, config: {...nodeData.config, startTime: e.target.value}})} className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark]" /><span className="text-slate-500 font-black">至</span><input type="time" value={nodeData.config?.endTime || "18:00"} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, config: {...nodeData.config, endTime: e.target.value}})} className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark]" /></div>
                    <div className="space-y-3 pt-3 border-t border-indigo-500/20"><label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1"><CalendarDays size={14}/> 營業日設定</label><div className="flex justify-between gap-1">{WEEKDAYS.map(day => (<button key={day.id} disabled={isReadOnly} onClick={() => { const currentDays = nodeData.config?.workDays || []; const newDays = currentDays.includes(day.id) ? currentDays.filter((d: number) => d !== day.id) : [...currentDays, day.id]; setNodeData({...nodeData, config: {...nodeData.config, workDays: newDays}}); }} className={`w-10 h-10 rounded-full text-xs font-black transition-all ${nodeData.config?.workDays?.includes(day.id) ? "bg-indigo-500 text-white shadow-lg" : "bg-slate-900 text-slate-500"}`}>{day.label}</button>))}</div></div>
                    <button disabled={isReadOnly} onClick={() => setNodeData({...nodeData, config: {...nodeData.config, forceOffHours: !nodeData.config?.forceOffHours}})} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all border-2 ${nodeData.config?.forceOffHours ? "bg-rose-600 border-rose-400 text-white" : "bg-slate-900 border-slate-800 text-slate-500"}`}><AlertTriangle size={18} />{nodeData.config?.forceOffHours ? "🚨 強制下班模式" : "緊急下班模式"}</button>
                </div>
              )}
              {!isGroup && !isTimeRouter && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                    {nodeData.messageType === "text" && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-500 uppercase">回覆文字</label>{!isReadOnly && <button onClick={() => setShowEmoji(!showEmoji)} className={`text-[10px] px-2 py-1 rounded ${showEmoji ? "bg-[#deff9a] text-black font-bold" : "text-[#deff9a] bg-slate-800"}`}><Smile size={12}/> 符號</button>}</div>
                            {showEmoji && (<div className="grid grid-cols-8 gap-1 bg-slate-900 p-2 rounded-xl max-h-32 overflow-y-auto">{EMOJI_LIST.map(e => <button key={e} onClick={() => setNodeData({...nodeData, textContent: (nodeData.textContent||"") + e})} className="hover:bg-white/10 p-1 rounded text-lg">{e}</button>)}</div>)}
                            <textarea value={nodeData.textContent || ""} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} className="w-full bg-slate-900 rounded-xl p-4 text-sm min-h-[120px] outline-none" />
                        </div>
                    )}
                    {nodeData.messageType === "image" && renderMultiImagePicker()}
                    
                    {nodeData.messageType === "video" && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-500 uppercase">影片網址</label>{!isReadOnly && <button onClick={() => setActiveLib(activeLib==="fVid"?"null":"fVid")} className="text-[#deff9a] text-[10px] flex items-center gap-1"><Library size={12}/> 資源庫</button>}</div>
                            <input value={nodeData.videoUrl || ""} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, videoUrl: e.target.value})} className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs" />
                            {activeLib==="fVid" && renderLibraryDropdown((url)=>setNodeData({...nodeData, videoUrl:url}))}
                        </div>
                    )}

                    {nodeData.messageType === "flex" && (
                        <div className="space-y-4">
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">列表預覽文字 (altText)</label>
                            </div>
                            <input 
                                value={nodeData.altText || ""} 
                                disabled={isReadOnly} 
                                onChange={e => setNodeData({...nodeData, altText: e.target.value})} 
                                className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs" 
                                placeholder="顯示在 LINE 聊天列表的文字（如：請查看最新資訊）" 
                            />
                        </div>
                            <div className="flex gap-2 bg-slate-900 p-1 rounded-xl"><button disabled={isReadOnly} onClick={() => setNodeData({...nodeData, cardSize: "md"})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 ${nodeData.cardSize==="md"?"bg-slate-700 text-white":"text-slate-500"}`}><Maximize2 size={12}/> 標準</button><button disabled={isReadOnly} onClick={() => setNodeData({...nodeData, cardSize: "sm"})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 ${nodeData.cardSize==="sm"?"bg-slate-700 text-white":"text-slate-500"}`}><Minimize2 size={12}/> 微型</button></div>
                            <div className="space-y-2"><div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-500 uppercase">卡片圖片</label>{!isReadOnly && <button onClick={() => setActiveLib(activeLib==="fImg"?"null":"fImg")} className="text-[#deff9a] text-[10px] flex items-center gap-1"><Library size={12}/> 資源庫</button>}</div><input value={nodeData.imageUrl || ""} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, imageUrl: e.target.value})} className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs" />{activeLib==="fImg" && renderLibraryDropdown((url)=>setNodeData({...nodeData, imageUrl:url}))}</div>
                            <textarea value={nodeData.textContent || ""} disabled={isReadOnly} onChange={e => setNodeData({...nodeData, textContent: e.target.value})} className="w-full bg-slate-900 rounded-xl p-4 text-sm min-h-[80px]" placeholder="卡片內文" />
                        </div>
                    )}

                    {nodeData.messageType === "carousel" && (
                        <div className="space-y-4 animate-in fade-in">
                                                    <div className="space-y-2 mb-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">列表預覽文字 (altText)</label>
                            </div>
                            <input 
                                value={nodeData.altText || ""} 
                                disabled={isReadOnly} 
                                onChange={e => setNodeData({...nodeData, altText: e.target.value})} 
                                className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs" 
                                placeholder="顯示在 LINE 聊天列表的文字（如：請查看最新資訊）" 
                            />
                        </div>
                            <div className="flex gap-2 bg-slate-900 p-1 rounded-xl"><button disabled={isReadOnly} onClick={() => setNodeData({...nodeData, cardSize: "md"})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 ${nodeData.cardSize==="md"?"bg-slate-700 text-white":"text-slate-500"}`}><Maximize2 size={12}/> 標準</button><button disabled={isReadOnly} onClick={() => setNodeData({...nodeData, cardSize: "sm"})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 ${nodeData.cardSize==="sm"?"bg-slate-700 text-white":"text-slate-500"}`}><Minimize2 size={12}/> 微型</button></div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black text-fuchsia-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                    <span>輪播卡片陣列 ({(nodeData.cards || []).length}/10)</span>
                                    {!isReadOnly && <button onClick={() => { 
                                        const nc = [...(nodeData.cards || [])];
                                        if (nc.length < 10) {
                                            nc.push({imageUrl: "", title: "", textContent: "", price: "", buttons: []});
                                            setNodeData({...nodeData, cards: nc});
                                        }
                                    }} className="bg-slate-800 p-1.5 rounded hover:bg-slate-700 transition-colors"><Plus size={14}/></button>}
                                </div>

                                {(nodeData.cards || []).map((card: any, cIdx: number) => (
                                    <div key={cIdx} className="bg-slate-800/40 p-4 rounded-xl border border-white/10 space-y-4 relative group">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest bg-fuchsia-500/20 px-2 py-1 rounded">第 {cIdx + 1} 張卡片</label>
                                            {!isReadOnly && <button onClick={() => { if(window.confirm("確定刪除此張卡片？")) { const nc = [...nodeData.cards]; nc.splice(cIdx, 1); setNodeData({...nodeData, cards: nc}); } }} className="text-red-400 hover:bg-red-400/20 p-1.5 rounded transition-colors"><Trash2 size={14}/></button>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-500 uppercase">卡片圖片</label>{!isReadOnly && <button onClick={() => setActiveLib(activeLib==="cImg-"+cIdx?"null":"cImg-"+cIdx)} className="text-[#deff9a] text-[10px] flex items-center gap-1"><Library size={12}/> 資源庫</button>}</div>
                                            <input value={card.imageUrl || ""} disabled={isReadOnly} onChange={e => { const nc = [...nodeData.cards]; nc[cIdx].imageUrl = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs" />
                                            {activeLib==="cImg-"+cIdx && renderLibraryDropdown((url)=>{ const nc = [...nodeData.cards]; nc[cIdx].imageUrl = url; setNodeData({...nodeData, cards: nc}); })}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">標題與價格</label>
                                            <input value={card.title || ""} disabled={isReadOnly} onChange={e => { const nc = [...nodeData.cards]; nc[cIdx].title = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs mb-2" placeholder="卡片標題" />
                                            <input value={card.price || ""} disabled={isReadOnly} onChange={e => { const nc = [...nodeData.cards]; nc[cIdx].price = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded-xl px-4 py-2 text-xs mb-2" placeholder="價格文字 (選填)" />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">卡片內文</label>
                                            <textarea value={card.textContent || ""} disabled={isReadOnly} onChange={e => { const nc = [...nodeData.cards]; nc[cIdx].textContent = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="w-full bg-slate-900 rounded-xl p-3 text-xs min-h-[60px]" placeholder="卡片內文 (選填)" />
                                        </div>

                                        <div className="space-y-3 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>專屬按鈕 ({(card.buttons || []).length}/3)</span>
                                                {!isReadOnly && <button onClick={() => { const btns = card.buttons || []; if(btns.length < 3) { const nc = [...nodeData.cards]; nc[cIdx].buttons = [...btns, {label: "", target: ""}]; setNodeData({...nodeData, cards: nc}); } }} className="text-[#deff9a] bg-slate-800 p-1 rounded hover:bg-slate-700 transition-colors"><Plus size={12}/></button>}
                                            </div>
                                            {(card.buttons || []).map((btn: any, bIdx: number) => (
                                                <div key={bIdx} className="flex gap-2 items-center">
                                                    <input value={btn.label} disabled={isReadOnly} onChange={e => { const nc = [...nodeData.cards]; if(!nc[cIdx].buttons) nc[cIdx].buttons = []; nc[cIdx].buttons[bIdx].label = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-1 bg-slate-800 rounded-lg p-2 text-xs text-white" placeholder="按鈕文字" />
                                                    <input value={btn.target} disabled={isReadOnly} onChange={e => { const nc = [...nodeData.cards]; if(!nc[cIdx].buttons) nc[cIdx].buttons = []; nc[cIdx].buttons[bIdx].target = e.target.value; setNodeData({...nodeData, cards: nc}) }} className="flex-[1.5] bg-slate-800 rounded-lg p-2 text-xs text-white" placeholder="跳轉關鍵字/URL" />
                                                    {!isReadOnly && <button onClick={() => { const nc = [...nodeData.cards]; if(!nc[cIdx].buttons) nc[cIdx].buttons = []; nc[cIdx].buttons.splice(bIdx, 1); setNodeData({...nodeData, cards: nc}); }} className="text-red-500 p-1 hover:bg-red-500/10 rounded-full"><Trash2 size={12}/></button>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              )}

              {!isGroup && !isTimeRouter && nodeData.messageType !== "carousel" && (
                <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-[#deff9a]/20">
                      <div className="flex justify-between items-center text-[10px] font-black text-[#deff9a] uppercase tracking-widest"><div className="flex items-center gap-1"><span>分支按鈕 ({nodeData.buttons?.length || 0}/6)</span><Info size={10} className="text-slate-400 cursor-help"/></div>{!isReadOnly && <button onClick={() => { if((nodeData.buttons?.length || 0) < 6) setNodeData({...nodeData, buttons: [...(nodeData.buttons || []), {label: "", target: ""}]}) }} className="text-[#deff9a] bg-slate-900/50 p-1.5 rounded"><Plus size={14}/></button>}</div>
                      {nodeData.buttons?.map((btn: any, i: number) => (
                          <div key={i} className="flex gap-2 items-center">
                              <input value={btn.label} disabled={isReadOnly} onChange={e => { const nb = [...nodeData.buttons]; nb[i].label = e.target.value; setNodeData({...nodeData, buttons: nb}) }} className="flex-1 bg-slate-900 rounded-lg p-2 text-xs" placeholder="按鈕文字" />
                              <input value={btn.target} disabled={isReadOnly} onChange={e => { const nb = [...nodeData.buttons]; nb[i].target = e.target.value; setNodeData({...nodeData, buttons: nb}) }} className="flex-[1.5] bg-slate-900 rounded-lg p-2 text-xs" placeholder="跳轉關鍵字" />
                              {!isReadOnly && <button onClick={() => { const nb = [...nodeData.buttons]; nb.splice(i,1); setNodeData({...nodeData, buttons: nb}) }} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded-full"><Trash2 size={12}/></button>}
                          </div>
                      ))}
                </div>
              )}
          </div>

          <div className="space-y-4 border-t border-white/5 pt-6 mt-4">
              <button onClick={() => setShowPreview(!showPreview)} className="w-full flex justify-between items-center bg-slate-800/50 hover:bg-slate-700 p-3 rounded-xl transition-colors border border-white/5"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">實機預覽</span>{showPreview ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button>
              {showPreview && <div className="animate-in fade-in slide-in-from-top-2"><LineSimulator data={nodeData} /></div>}
          </div>
          {!isReadOnly && <button onClick={() => { if(window.confirm("確定刪除？")) deleteDoc(doc(db, "flowRules", nodeId!)); onClose(); }} className="w-full text-red-500/50 hover:text-red-500 text-[10px] py-4 uppercase font-bold tracking-widest flex items-center justify-center gap-1 mt-4 transition-colors border-t border-white/5 pt-8"><Trash2 size={12}/> Delete {nodeData.messageType}</button>}
      </div>
      {!isReadOnly && (
          <div className="p-6 border-t border-white/10 bg-slate-900 flex gap-3 z-50">
            <button onClick={handleDuplicate} disabled={isSaving} className="flex-1 bg-slate-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-600"><Copy size={18}/> 複製</button>
            <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all hover:brightness-110">{isSaving ? "處理中..." : "儲存配置"}</button>
          </div>
      )}
    </div>
  );
}
