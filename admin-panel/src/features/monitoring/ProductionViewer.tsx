import { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Controls, Background, BackgroundVariant, Node, Edge, 
  MarkerType, ReactFlowProvider, Handle, Position, useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Globe, Clock, Flag } from 'lucide-react';
import NodeEditPanel from '../message-form/NodeEditPanel';

// 🚀 監測專用 CSS：確保連線與發光效果一致
const GlobalProdStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .react-flow__handle { opacity: 0 !important; pointer-events: none !important; }
    .node-prod-glow { box-shadow: 0 0 30px rgba(250,204,21,0.4) !important; border-color: #facc15 !important; }
    .edge-visited path { stroke: #38bdf8 !important; stroke-width: 4px !important; }
  `}} />
);

// 🚀 1:1 自定義節點：包含正確的 Handle ID 以對齊連線
const CustomNodeProd = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  
  const getBgColor = () => {
    if (isStart) return 'bg-slate-900 border-yellow-400';
    switch(data.messageType) {
      case 'carousel': case 'flex': return 'bg-amber-950/90 border-amber-500';
      case 'image': return 'bg-emerald-950/90 border-emerald-500';
      case 'video': return 'bg-rose-950/90 border-rose-500';
      default: return 'bg-blue-950/90 border-blue-500';
    }
  };

  return (
    <div className={`w-[200px] min-h-[80px] rounded-2xl border-2 shadow-2xl flex flex-col p-3 ${getBgColor()} ${isStart ? 'node-prod-glow' : ''}`}>
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} />
      
      <div className="flex flex-col items-center mb-4 relative text-white">
        {isStart && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-0.5 rounded-full font-black text-[10px] border border-black uppercase flex items-center gap-1">🚀 START</div>}
        {data.globalKeyword && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-lg"><Globe size={12} /></div>}
        
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 text-center break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          {data.nodeName || data.label}
        </div>
        <div className="mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/40 text-white/60 border border-white/10">{data.messageType}</div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-center text-slate-300">
            {opt.label}
            {/* 🚀 關鍵：Handle ID 必須與編輯器 ID (opt_0, opt_1...) 完全一致 */}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} isConnectable={false} style={{ right: -10 }} />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={false} style={{ right: -10 }} />}
    </div>
  );
};

// 🚀 1:1 群組節點：解決大小不正確與標籤顏色
const GroupNodeProd = ({ data }: any) => {
  const isDone = data.customLabel === '已完成';
  const isTodo = data.customLabel === '待處理';
  const colorClass = isDone ? 'bg-emerald-600 border-emerald-400' : isTodo ? 'bg-amber-600 border-amber-400' : 'bg-blue-600 border-blue-400';
  return (
    <div className="w-full h-full relative">
      <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-2xl border-2 z-50 text-white ${colorClass}`}>
        {data.title || '未命名區塊'}
      </div>
    </div>
  );
};

// 🚀 1:1 時間分流節點
const TimeRouterNodeProd = ({ data }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative text-white">
    <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} />
    <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-4 text-indigo-100 mb-1"><Clock size={16} className="text-indigo-400" /><span>{data.nodeName}</span></div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 text-indigo-300 border-indigo-500/30">
      {data.config?.forceOffHours ? <span className="text-rose-400">🚨 強制下班模式</span> : `${data.config?.startTime || '09:00'} - ${data.config?.endTime || '18:00'}`}
    </div>
    <Handle type="source" position={Position.Right} id="business" style={{ top: '30%' }} isConnectable={false} />
    <Handle type="source" position={Position.Right} id="off-hours" style={{ top: '70%' }} isConnectable={false} />
  </div>
);

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd, timeRouter: TimeRouterNodeProd };

function ProductionCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { setViewport } = useReactFlow();
  const [lastUpdate, setLastUpdate] = useState('');
  const initRef = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        const raw = snap.data();
        const processedNodes = (raw.nodes || []).map((n: any) => {
          const base: any = {
            id: n.id,
            position: n.position,
            type: n.type === 'group' ? 'group' : (n.messageType === 'time_router' ? 'timeRouter' : 'custom'),
            data: { ...n.data, nodeName: n.nodeName, messageType: n.messageType },
            draggable: false
          };
          // 🚀 解決群組大小問題：顯式設定 style
          if (n.type === 'group') {
            base.style = { 
              width: Number(n.width) || 400, 
              height: Number(n.height) || 300,
              backgroundColor: 'rgba(59, 130, 246, 0.03)',
              border: '2px dashed rgba(255,255,255,0.15)',
              borderRadius: '32px'
            };
          }
          return base;
        });

        setNodes(processedNodes);
        setEdges((raw.edges || []).map((e: any) => ({
          ...e,
          animated: true,
          style: { stroke: e.color, strokeWidth: 2.5, strokeDasharray: '6 4' },
          markerEnd: { type: MarkerType.ArrowClosed, color: e.color }
        })));

        setLastUpdate(raw.publishedAt?.toDate ? raw.publishedAt.toDate().toLocaleString() : 'Just Now');

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
    <div className="flex flex-col h-full bg-[#020617] font-sans relative">
      <GlobalProdStyles />
      
      {/* 頂部狀態列 */}
      <div className="absolute top-8 left-8 z-50">
        <div className="bg-slate-900/90 border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center gap-5">
          <div className="bg-rose-600 p-2.5 rounded-xl shadow-lg shadow-rose-600/30"><ShieldCheck className="text-white" size={24} /></div>
          <div>
            <h1 className="text-[12px] font-black text-rose-500 italic uppercase leading-none">Production Monitoring</h1>
            <p className="text-[11px] text-slate-400 font-bold mt-1.5">線上版本：<span className="text-white">{lastUpdate}</span></p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes} 
            nodesDraggable={false}
            onNodeClick={(_, n) => n.type !== 'group' && setSelectedNodeId(n.id)}
            onPaneClick={() => setSelectedNodeId(null)}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
            <Controls position="bottom-right" className="!bg-slate-900 !border-white/10 !fill-white" />
          </ReactFlow>
        </div>

        {/* 🚀 關鍵修正：渲染 NodeEditPanel 解決 TS6133 錯誤 */}
        {selectedNodeId && (
          <div className="w-[450px] h-full border-l border-white/10 z-[100] bg-slate-950 shadow-2xl animate-in slide-in-from-right duration-300">
             <NodeEditPanel 
                nodeId={selectedNodeId} 
                onClose={() => setSelectedNodeId(null)} 
                isReadOnly={true} 
                sourceCollection="botConfig/production" 
              />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductionViewer() {
  return (
    <div className="flex-1 h-full overflow-hidden bg-[#020617]">
      <ReactFlowProvider>
        <ProductionCanvas />
      </ReactFlowProvider>
    </div>
  );
}
