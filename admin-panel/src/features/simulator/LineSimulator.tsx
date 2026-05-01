import { useState, useEffect, useRef } from 'react';
import { Youtube, FileText, Send, RotateCcw, Smartphone, MessageCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export function BubbleContent({ data, onAction }: { data: any, onAction?: (text: string) => void }) {
  if (!data || !data.messageType) return null;
  const isFlex = data.messageType === 'flex'; const isCarousel = data.messageType === 'carousel';
  const hasImage = !!data.imageUrl; const isLinkStyle = data.btnStyle === 'link';
  const hasButtons = data.buttons && data.buttons.length > 0;
  const isMicro = data.cardSize === 'sm'; const cardWidth = isMicro ? 'w-40' : 'w-56';
  const defaultImg = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";

  return (
    <>
        {data.messageType === 'text' && (
            <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap shadow-sm">
            {data.textContent || "輸入文字..."}
            </div>
        )}
        {data.messageType === 'image' && (
            <div className="flex flex-col gap-2">
            { (data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : [])).map((u: string, idx: number) => (
                <div key={idx} className="w-48 bg-white rounded-xl overflow-hidden shadow-sm"><img src={u || defaultImg} className="w-full aspect-square object-cover" alt="Preview" /></div>
            ))}
            {(!data.imageUrls?.length && !data.imageUrl) && (
                <div className="w-48 bg-white rounded-xl overflow-hidden shadow-sm"><img src={defaultImg} className="w-full aspect-square object-cover" alt="Preview" /></div>
            )}
            </div>
        )}
        {data.messageType === 'file' && (
            <div className="w-48 bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={20} /></div>
            <div className="flex-1 overflow-hidden"><div className="text-xs font-bold text-slate-800 truncate">{data.textContent || "未命名檔案.pdf"}</div><div className="text-[10px] text-slate-400 mt-0.5">1.0 MB</div></div>
            </div>
        )}
        {data.messageType === 'video' && (
            <div className="w-56 bg-white rounded-xl overflow-hidden shadow-sm flex flex-col border border-gray-100">
            <div className="relative aspect-video"><img src={data.imageUrl || defaultImg} className="w-full h-full object-cover opacity-80" alt="Preview" /><div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center"><Youtube className="text-white fill-white" size={20} /></div></div></div>
            {data.textContent && <div className="p-3 text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">{data.textContent}</div>}
            </div>
        )}
        {isFlex && (
            <div className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-xl flex flex-col border border-gray-100`}>
            {hasImage && <div className="aspect-video bg-gray-100"><img src={data.imageUrl} className="w-full h-full object-cover" alt="Preview" /></div>}
            <div className="p-4 space-y-2">
                <div className="text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">{data.textContent || "卡片內文..."}</div>
                {hasButtons && (
                <div className={`flex flex-col gap-1 mt-3 ${isLinkStyle ? 'divide-y divide-gray-100' : ''}`}>
                    {data.buttons.map((btn: any, i: number) => (
                    isLinkStyle ? (
                        <div key={i} onClick={() => onAction && onAction(btn.target || btn.label)} className="text-[#5584C0] text-center py-3 text-xs font-bold cursor-pointer hover:bg-slate-50">{btn.label || `選項 ${i+1}`} ▶▶</div>
                    ) : (
                        <div key={i} onClick={() => onAction && onAction(btn.target || btn.label)} className="bg-[#06C755] text-white text-center py-2 rounded-lg text-[10px] font-bold shadow-sm cursor-pointer hover:brightness-110">{btn.label || "選擇"}</div>
                    )))}
                </div>
                )}
            </div>
            </div>
        )}
        {isCarousel && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full max-w-[320px]">
                {data.cards?.map((card: any, idx: number) => (
                <div key={idx} className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-gray-100 flex flex-col`}>
                    {card.imageUrl && <div className="aspect-video bg-gray-100"><img src={card.imageUrl} className="w-full h-full object-cover" alt="Preview" /></div>}
                    <div className="p-3 space-y-2 flex-1 flex flex-col">
                    <div className="font-bold text-xs text-slate-800">{card.title || "卡片標題"}</div>
                    <div className="text-[10px] text-slate-500 flex-1">{card.price || "內容說明"}</div>
                    {card.buttons && card.buttons.length > 0 && (
                        <div className={`flex flex-col gap-1 pt-2 mt-auto ${isLinkStyle ? 'divide-y divide-gray-100 border-t border-gray-100' : ''}`}>
                        {card.buttons.map((btn: any, i: number) => (
                            isLinkStyle ? (
                                <div key={i} onClick={() => onAction && onAction(btn.target || btn.label)} className="text-[#5584C0] text-center py-2 text-[10px] font-bold cursor-pointer hover:bg-slate-50">{btn.label || `選項`} ▶▶</div>
                            ) : (
                                <div key={i} onClick={() => onAction && onAction(btn.target || btn.label)} className="bg-[#06C755] text-white text-center py-2 rounded-lg text-[10px] font-bold shadow-sm cursor-pointer hover:brightness-110">{btn.label || "按鈕"}</div>
                            )
                        ))}
                        </div>
                    )}
                    </div>
                </div>
                ))}
            </div>
        )}
    </>
  )
}

export default function LineSimulator({ data }: { data: any }) {
  if (!data || !data.nodeName) return null;
  return (
    <div className="w-full bg-[#849ebf] rounded-2xl overflow-hidden flex flex-col font-sans border border-white/10 shadow-xl">
      <div className="bg-[#273246] text-white px-4 py-2 text-[9px] font-bold flex justify-between items-center tracking-widest">
        <span>LINE PREVIEW</span><span className="text-[#deff9a] uppercase">{data.messageType}</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-[#273246] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow-sm"><Smartphone size={14}/></div>
          <div className="flex-1 w-full overflow-hidden flex flex-col items-start gap-2"><BubbleContent data={data} /></div>
        </div>
      </div>
    </div>
  );
}

// 🚀 給 App.tsx 用的完整實機互動模擬器大腦 (升級版)
export function InteractiveSimulator({ onPathUpdate }: { onPathUpdate: (path: {nodes: string[], edges: string[]}) => void }) {
    const [messages, setMessages] = useState<{id: string, sender: 'user'|'bot', text?: string, data?: any}[]>([]);
    const [inputText, setInputText] = useState("");
    const [nodes, setNodes] = useState<any[]>([]);
    const [edges, setEdges] = useState<any[]>([]);
    
    // 🚀 新增：追蹤目前走過的所有路徑
    const [pathTracker, setPathTracker] = useState<{nodes: string[], edges: string[]}>({nodes: [], edges: []});
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            const rulesSnap = await getDocs(collection(db, "flowRules"));
            const edgesSnap = await getDocs(collection(db, "flowEdges"));
            const nData = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const eData = edgesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setNodes(nData); setEdges(eData);
            
            const defaultNode = nData.find((n:any) => n.nodeName === '預設回覆');
            if (defaultNode) {
                setTimeout(() => {
                    const initPath = { nodes: [defaultNode.id], edges: [] };
                    setPathTracker(initPath);
                    onPathUpdate(initPath);
                    setMessages([{ id: Date.now().toString(), sender: 'bot', data: defaultNode }]);
                }, 500);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
        setInputText("");

        let targetNode: any = null;
        let tempNodes = [...pathTracker.nodes];
        let tempEdges = [...pathTracker.edges];

        // 1. 全域攔截 (任意門)
        targetNode = nodes.find(n => n.isGlobal && n.nodeName === text);
        if (targetNode) {
            tempNodes.push(targetNode.id); // 全域跳轉只加 Node，沒有 Edge
        }

        // 2. 狀態尋徑
        const currentNodeId = tempNodes[tempNodes.length - 1];
        if (!targetNode && currentNodeId) {
            const current = nodes.find(n => n.id === currentNodeId);
            if (current) {
                const options = current.options || current.buttons || [];
                const idx = options.findIndex((o:any) => o.target === text || o.keyword === text || o.label === text);
                if (idx !== -1) {
                    const edge = edges.find(e => e.source === currentNodeId && e.sourceHandle === `opt_${idx}`);
                    if (edge) {
                        targetNode = nodes.find(n => n.id === edge.target);
                        tempEdges.push(edge.id);
                        tempNodes.push(targetNode.id);
                    }
                }
            }
        }

        // 3. 兜底
        if (!targetNode) {
            targetNode = nodes.find(n => n.nodeName === '預設回覆');
            if (targetNode) tempNodes.push(targetNode.id);
        }
        if (!targetNode) return;

        // 4. 時空警察
        let renderNode = targetNode;
        let loopCount = 0;
        while(renderNode && renderNode.messageType === 'time_router' && loopCount < 5) {
            loopCount++;
            const config = renderNode.config || {};
            const now = new Date();
            const currentTwTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            let isBusiness = false;
            if (!config.forceOffHours) {
                if (currentTwTimeStr >= (config.startTime||"09:00") && currentTwTimeStr <= (config.endTime||"18:00")) {
                    if (!config.workDays || config.workDays.includes(now.getDay())) isBusiness = true;
                }
            }

            const handle = isBusiness ? 'business' : 'off-hours';
            const edge = edges.find(e => e.source === renderNode.id && e.sourceHandle === handle);
            if (edge) {
                tempEdges.push(edge.id);
                renderNode = nodes.find(n => n.id === edge.target);
                if (renderNode) tempNodes.push(renderNode.id);
            } else {
                renderNode = null;
            }
        }

        if (renderNode && renderNode.messageType !== 'time_router') {
            setPathTracker({ nodes: tempNodes, edges: tempEdges });
            onPathUpdate({ nodes: tempNodes, edges: tempEdges });
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', data: renderNode }]);
            }, 600);
        }
    };

    const resetSimulation = () => {
        setMessages([]); 
        const defaultNode = nodes.find(n => n.nodeName === '預設回覆');
        if (defaultNode) {
            setTimeout(() => {
                const initPath = { nodes: [defaultNode.id], edges: [] };
                setPathTracker(initPath); onPathUpdate(initPath);
                setMessages([{ id: Date.now().toString(), sender: 'bot', data: defaultNode }]);
            }, 300);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#849ebf] font-sans">
            <div className="h-16 bg-[#273246] flex items-center justify-between px-5 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <MessageCircle className="text-[#06C755]" size={20} />
                    <span className="text-white font-black tracking-widest text-sm">LINE 實機互動模擬</span>
                </div>
                <button onClick={resetSimulation} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full" title="重新開始">
                    <RotateCcw size={16} />
                </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'user' ? (
                            <div className="bg-[#A0F080] text-slate-800 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm shadow-sm font-medium max-w-[80%] break-words">
                                {msg.text}
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 max-w-[90%]">
                                <div className="w-8 h-8 rounded-full bg-[#273246] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm mt-1">BOT</div>
                                <div className="flex flex-col gap-2">
                                    <BubbleContent data={msg.data} onAction={(txt) => handleSend(txt)} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {messages.length === 0 && <div className="h-full flex items-center justify-center text-white/50 text-xs font-bold">載入邏輯中...</div>}
            </div>

            <div className="bg-white p-3 border-t border-gray-200 flex gap-2 items-center pb-6">
                <input 
                    value={inputText} onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend(inputText)}
                    placeholder="輸入測試文字..." 
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-slate-700 placeholder:text-gray-400"
                />
                <button onClick={() => handleSend(inputText)} disabled={!inputText.trim()} className="bg-[#06C755] text-white p-2.5 rounded-full hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
