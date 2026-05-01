import { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, BackgroundVariant, Node, Edge, 
  ReactFlowProvider, Handle, Position, useReactFlow, Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Flag, Clock, Globe } from 'lucide-react';
import NodeEditPanel from '../message-form/NodeEditPanel';

const GlobalProdStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .react-flow__handle { pointer-events: none !important; cursor: default !important; }
    .node-prod-glow { box-shadow: 0 0 30px rgba(250,204,21,0.4) !important; border-color: #facc15 !important; }
  `}} />
);

// 🚀 關鍵修正：全面改為實心背景 bg-xxx-950，杜絕透明度造成的色差
const getNodeStyle = (type: string = '', isStart: boolean) => {
  if (isStart) return 'bg-slate-900 border-yellow-400 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-[3px]';
  const t = String(type).toLowerCase().trim();
  if (['carousel', 'flex'].includes(t)) return 'bg-amber-950 border-amber-500 text-amber-100 shadow-amber-900/50';
  if (['image', 'photo'].includes(t)) return 'bg-emerald-950 border-emerald-500 text-emerald-100 shadow-emerald-900/50';
  if (['video'].includes(t)) return 'bg-rose-950 border-rose-500 text-rose-100 shadow-rose-900/50';
  return 'bg-blue-950 border-blue-500 text-blue-100 shadow-blue-900/50';
};

const CustomNodeProd = ({ data }: any) => {
  const options = data?.options || data?.buttons || [];
  const isStart = data?.nodeName === '預設回覆';
  return (
    <div className={`w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px] rounded-2xl border-2 transition-all ${getNodeStyle(data?.messageType, isStart)}`}>
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 !left-[-10px]" />
      <div className="flex flex-col items-center mb-4 relative text-white text-center">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl border-2 border-black z-50">🚀 START</div>}
        {data?.globalKeyword && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-lg"><Globe size={12} /></div>}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          {data?.nodeName || 'Node'}
        </div>
        <div className={`mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/40 text-white/80 border border-white/10`}>{data?.messageType || 'TEXT'}</div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-center text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} isConnectable={false} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 !right-[-10px]" />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={false} className="w-3 h-3 bg-slate-400 border-2 border-slate-900 z-50 !right-[-10px]" />}
    </div>
  );
};

const GroupNodeProd = ({ data }: any) => {
  const isDone = data?.customLabel === '已完成';
  const isTodo = data?.customLabel === '待處理';
  const bgColor = isDone ? 'bg-emerald-500/5 border-emerald-500/50' : isTodo ? 'bg-amber-500/5 border-amber-500/50' : 'bg-blue-500/5 border-blue-500/30';
  const labelColor = isDone ? 'bg-emerald-600 text-white border-emerald-400' : isTodo ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400';
  return (
    <div className={`w-full h-full border-2 border-dashed rounded-3xl relative ${bgColor}`}>
      <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase shadow-2xl border-2 z-50 text-white ${labelColor}`}>
        {data?.title || '區塊'}
      </div>
    </div>
  );
};

const TimeRouterNodeProd = ({ data }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950 border-[3px] border-indigo-500 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative text-white text-center">
    <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} className="w-3 h-3 bg-indigo-400 border-2 border-slate-900 z-50 !left-[-10px]" />
    <div className="font-black text-sm flex items-center justify-center gap-2 mb-1 w-full"><Clock size={16} className="text-indigo-400" />{data?.nodeName || 'TimeRouter'}</div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 border-indigo-500/30">{data?.config?.startTime || '09:00'} - {data?.config?.endTime || '18:00'}</div>
    <Handle type="source" position={Position.Right} id="business" isConnectable={false} style={{ top: '30%' }} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 !right-[-10px]" />
    <Handle type="source" position={Position.Right} id="off-hours" isConnectable={false} style={{ top: '70%' }} className="w-3 h-3 bg-rose-400 border-2 border-slate-900 z-50 !right-[-10px]" />
  </div>
);

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd, timeRouter: TimeRouterNodeProd };

function ProductionCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { setViewport } = useReactFlow();
  const initRef = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        const raw = snap.data();
        
        const safeNodes = (raw.nodes || []).filter(Boolean).map((n: any) => {
          const base: any = { id: n.id, position: n.position, type: n.type, data: n.data || {}, draggable: false };
          if (n.type === 'group') base.style = { width: Number(n.width) || 400, height: Number(n.height) || 300, borderRadius: '32px' };
          return base;
        });
        setNodes(safeNodes);
        
        // 🚨 終極防禦：拔除舊資料的 null 毒瘤，防止 Object.keys 報錯
        const safeEdges = (raw.edges || []).filter(Boolean).map((e: any) => {
            const edgeObj: any = {
                id: e.id, source: e.source, target: e.target,
                type: e.type || 'smoothstep', animated: e.animated !== false,
                style: e.style || { stroke: '#deff9a', strokeWidth: 2 }
            };
            if (e.sourceHandle) edgeObj.sourceHandle = e.sourceHandle;
            if (e.targetHandle) edgeObj.targetHandle = e.targetHandle;
            
            // 嚴格確保只加入真實的物件，遇到 null 直接忽略
            if (e.markerStart && typeof e.markerStart === 'object') edgeObj.markerStart = e.markerStart;
            if (e.markerEnd && typeof e.markerEnd === 'object') edgeObj.markerEnd = e.markerEnd;
            
            return edgeObj;
        });
        setEdges(safeEdges);

        if (!initRef.current && raw.viewport) {
          const { x, y, zoom } = raw.viewport;
          setTimeout(() => setViewport({ x, y, zoom }, { duration: 1000 }), 500);
          initRef.current = true;
        }
      }
    });
    return () => unsub();
  }, [setViewport]);

  return (
    <div className="w-full h-full bg-[#020617] font-sans relative overflow-hidden">
      <GlobalProdStyles />
      <div className="absolute top-8 left-8 z-50">
        <div className="bg-slate-900/90 border border-white/10 p-5 rounded-3xl shadow-2xl flex items-center gap-5 backdrop-blur-xl">
          <div className="bg-rose-600 p-2.5 rounded-xl shadow-rose-600/30"><ShieldCheck className="text-white" size={24} /></div>
          <h1 className="text-[12px] font-black text-rose-500 italic uppercase tracking-widest">Monitoring</h1>
        </div>
      </div>
      <div className="w-full h-full flex">
        <div className="flex-1 relative">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} onNodeClick={(_, n) => n.type !== 'group' && setSelectedId(n.id)} onPaneClick={() => setSelectedId(null)}>
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
            <Controls position="bottom-right" className="!bg-slate-900 !border-white/10 !fill-white" />
          </ReactFlow>
        </div>
        {selectedId && <div className="w-[450px] h-full bg-slate-950 border-l border-white/10 z-[100] animate-in slide-in-from-right shadow-2xl relative"><NodeEditPanel nodeId={selectedId} onClose={() => setSelectedId(null)} isReadOnly={true} sourceCollection="botConfig/production" /></div>}
      </div>
    </div>
  );
}

export default function ProductionViewer() {
  return <div className="w-full h-full bg-[#020617]"><ReactFlowProvider><ProductionCanvas /></ReactFlowProvider></div>;
}
