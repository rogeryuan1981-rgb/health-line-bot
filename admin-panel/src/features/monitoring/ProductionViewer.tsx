import { useState, useEffect, useRef } from "react";
import ReactFlow, { 
  Background, BackgroundVariant, Node, Edge, 
  ReactFlowProvider, Handle, Position, useReactFlow, Controls,
  useNodesState, useEdgesState 
} from "reactflow";
import "reactflow/dist/style.css";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { ShieldCheck, Flag, Clock, Globe } from "lucide-react";
import NodeEditPanel from "../message-form/NodeEditPanel";

// 🚀 定義自訂連線資料型別
interface CustomEdgeData {
  color?: string;
  strokeWidth?: number;
  dashed?: boolean;
  [key: string]: any;
}

// 🚀 將所有反引號替換為標準雙引號，徹底杜絕 TS1160 錯誤
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: "@keyframes smoothGlow { 0% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } 50% { box-shadow: 0 0 25px rgba(244,63,94,1); } 100% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } } .node-current-glow { animation: smoothGlow 2.5s ease-in-out infinite !important; z-index: 1000; } .node-visited { border-color: #38bdf8 !important; box-shadow: 0 0 20px rgba(56,189,248,0.5) !important; } .react-flow__handle { pointer-events: none !important; cursor: default !important; }" }} />
);

const getNodeStyle = (type: string = "", isStart: boolean) => {
  if (isStart) return "bg-slate-900 border-yellow-400 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-[3px]";
  const t = String(type).toLowerCase().trim();
  if (t === "flex") return "bg-amber-900/80 border-amber-500 text-amber-100 shadow-amber-900/50";
  if (t === "carousel") return "bg-fuchsia-900/80 border-fuchsia-500 text-fuchsia-100 shadow-fuchsia-900/50";
  if (["image", "photo"].includes(t)) return "bg-emerald-900/80 border-emerald-500 text-emerald-100 shadow-emerald-900/50";
  if (["video"].includes(t)) return "bg-rose-900/80 border-rose-500 text-rose-100 shadow-rose-900/50";
  return "bg-blue-900/80 border-blue-500 text-blue-100 shadow-blue-900/50";
};

const CustomNodeProd = ({ data }: any) => {
  let options = data?.options || data?.buttons || [];
  if (data?.messageType === "carousel") {
      const arr = data.cards || data.carouselCards || data.columns || data.items || [];
      options = arr.flatMap((c: any) => c.buttons || []);
  }
  const isStart = data?.nodeName === "預設回覆";

  return (
    <div className={"w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px] rounded-2xl border-2 transition-all " + getNodeStyle(data?.messageType, isStart)}>
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 !left-[-10px]" />
      <div className="flex flex-col items-center mb-3 mt-1 text-white text-center">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl animate-bounce border-2 border-black z-50 whitespace-nowrap">🚀 START</div>}
        {data?.globalKeyword && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 shadow-lg border-2 border-slate-900"><Globe size={12} /></div>}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          {data?.nodeName || "Node"}
        </div>
        <div className="mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/40 text-white/80 border border-white/10">{data?.messageType || "TEXT"}</div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-center text-slate-300">
            {opt.label || "選項"}
            <Handle type="source" position={Position.Right} id={"opt_" + index} isConnectable={false} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 !right-[-10px]" />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={false} className="w-3 h-3 bg-slate-400 border-2 border-slate-900 z-50 !right-[-10px]" />}
    </div>
  );
};

const GroupNodeProd = ({ data }: any) => {
  const isDone = data?.customLabel === "已完成";
  const isTodo = data?.customLabel === "待處理";
  const bgColor = isDone ? "bg-emerald-500/5 border-emerald-500/50" : isTodo ? "bg-amber-500/5 border-amber-500/50" : "bg-blue-500/5 border-blue-500/30";
  const labelColor = isDone ? "bg-emerald-600 text-white border-emerald-400" : isTodo ? "bg-amber-600 text-white border-amber-400" : "bg-blue-600 text-white border-blue-400";
  return (
    <div className={"w-full h-full border-2 border-dashed rounded-3xl relative transition-all " + bgColor}>
      <div className={"absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-2xl border-2 z-50 " + labelColor}>{data?.title || "區塊"}</div>
    </div>
  );
};

const TimeRouterNodeProd = ({ data }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative transition-all duration-300 text-white text-center">
    <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} className="w-3 h-3 bg-indigo-400 border-2 border-slate-900 z-50 !left-[-10px]" />
    <div className="font-black text-sm flex items-center justify-center gap-1.5 mb-1 w-full"><Clock size={16} className="text-indigo-400" /><span>{data?.nodeName || "TimeRouter"}</span></div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 border-indigo-500/30">{data?.config?.startTime || "09:00"} - {data?.config?.endTime || "18:00"}</div>
    <Handle type="source" position={Position.Right} id="business" isConnectable={false} style={{ top: "30%" }} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 !right-[-10px]" />
    <Handle type="source" position={Position.Right} id="off-hours" isConnectable={false} style={{ top: "70%" }} className="w-3 h-3 bg-rose-400 border-2 border-slate-900 z-50 !right-[-10px]" />
  </div>
);

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd, timeRouter: TimeRouterNodeProd };

function ProductionCanvas({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { setViewport } = useReactFlow();
  const initRef = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        const raw = snap.data();
        
        const validIds = new Set((raw.nodes || []).filter(Boolean).map((n: any) => n.id));
        
        const safeNodes = (raw.nodes || []).filter(Boolean).map((n: any) => {
          const base: any = {
            id: n.id,
            position: n.position,
            type: n.type,
            // 🚀 重要：強制深拷貝 data 確保 React Flow 刷新畫面，解決預約發布同步問題
            data: JSON.parse(JSON.stringify(n.data || {})), 
            style: n.style || {} 
          };
          
          if (n.parentNode && validIds.has(n.parentNode)) {
              base.parentNode = n.parentNode;
          }
          
          if (n.type === "group") {
            base.style.width = Number(n.width) || Number(base.style.width) || 400;
            base.style.height = Number(n.height) || Number(base.style.height) || 300;
            base.style.borderRadius = "32px";
            base.zIndex = -1;
          }
          
          return base;
        });
        
        setNodes(safeNodes);
        
        const safeEdges = (raw.edges || []).filter(Boolean).map((e: any) => {
            const cleanEdge: Edge = { ...e }; 
            if (cleanEdge.markerStart === null) delete cleanEdge.markerStart;
            if (cleanEdge.markerEnd === null) delete cleanEdge.markerEnd;
            if (cleanEdge.style === null) delete cleanEdge.style;
            if (!cleanEdge.targetHandle) cleanEdge.targetHandle = "left_in";
            return cleanEdge;
        });
        
        setEdges(safeEdges);

        if (!initRef.current && raw.viewport) {
          const { x, y, zoom } = raw.viewport;
          setViewport({ x, y, zoom });
          initRef.current = true;
        }
      }
    });
    return () => unsub();
  }, [setViewport, setNodes, setEdges]);

  // 🚀 保留路徑發光特效，嚴禁精簡
  useEffect(() => {
    if (activePath && activePath.nodes && activePath.edges) {
        setNodes(nds => nds.map(n => {
            const isCurrent = activePath.nodes?.length ? n.id === activePath.nodes[activePath.nodes.length - 1] : false;
            const isVisited = activePath.nodes?.includes(n.id) && !isCurrent;
            const clean = (n.className || "").replace(/node-current-glow|node-visited/g, "").trim();
            if (isCurrent) return { ...n, className: clean + " node-current-glow" };
            if (isVisited) return { ...n, className: clean + " node-visited" };
            return { ...n, className: clean };
        }));

        setEdges(eds => eds.map(e => {
            const isVisited = activePath.edges?.includes(e.id) || false;
            const customData = (e.data || {}) as CustomEdgeData;
            const defaultColor = customData.color || "#deff9a";
            const defaultWidth = Number(customData.strokeWidth) || 2;
            const defaultDashed = customData.dashed !== false;
            
            return {
                ...e,
                animated: isVisited ? true : defaultDashed,
                style: {
                    ...e.style,
                    stroke: isVisited ? "#38bdf8" : defaultColor,
                    strokeWidth: isVisited ? 4 : defaultWidth,
                    filter: isVisited ? "drop-shadow(0 0 8px rgba(56,189,248,0.8))" : "none",
                    strokeDasharray: (!isVisited && defaultDashed) ? "5 5" : "none"
                },
                zIndex: isVisited ? 1000 : 100
            };
        }));
    }
  }, [activePath, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-[#020617] font-sans relative overflow-hidden">
      <CustomStyles />
      <div className="absolute top-8 left-8 z-50">
        <div className="bg-slate-900/90 border border-white/10 p-5 rounded-3xl shadow-2xl flex items-center gap-5 backdrop-blur-xl">
          <div className="bg-rose-600 p-2.5 rounded-xl shadow-rose-600/30"><ShieldCheck className="text-white" size={24} /></div>
          <h1 className="text-[12px] font-black text-rose-500 italic uppercase tracking-widest">Monitoring</h1>
        </div>
      </div>
      <div className="w-full h-full flex">
        <div className="flex-1 relative">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes} 
            nodesDraggable={false} 
            nodesConnectable={false}
            elementsSelectable={true} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onNodeClick={(_, n) => n.type !== "group" && setSelectedId(n.id)} 
            onPaneClick={() => setSelectedId(null)}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
            <Controls position="bottom-right" className="!bg-slate-900 !border-white/10 !fill-white" />
          </ReactFlow>
        </div>
        {selectedId && <div className="w-[450px] h-full bg-slate-950 border-l border-white/10 z-[100] animate-in slide-in-from-right shadow-2xl relative">
          <NodeEditPanel nodeId={selectedId} onClose={() => setSelectedId(null)} isReadOnly={true} sourceCollection="botConfig/production" />
        </div>}
      </div>
    </div>
  );
}

export default function ProductionViewer({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  return <div className="w-full h-full bg-[#020617]"><ReactFlowProvider><ProductionCanvas activePath={activePath} /></ReactFlowProvider></div>;
}
