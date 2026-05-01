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

// 🚀 1:1 還原編輯器的視覺 CSS
const GlobalProdStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .react-flow__handle { opacity: 0 !important; }
    .node-prod-glow { box-shadow: 0 0 30px rgba(250,204,21,0.4) !important; border-color: #facc15 !important; }
    .edge-path-prod { stroke-width: 3px !important; stroke-dasharray: 6 4; animation: dash 20s linear infinite; }
    @keyframes dash { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
  `}} />
);

// 🚀 1:1 還原自定義節點邏輯
const CustomNodeProd = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  
  // 依照 messageType 決定背景色 (對應編輯器)
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
    <div className={`w-[200px] min-h-[80px] rounded-2xl border-2 shadow-2xl flex flex-col p-3 transition-all ${getBgColor()} ${isStart ? 'node-prod-glow' : ''}`}>
      <Handle type="target" position={Position.Left} id="left_in" style={{ visibility: 'hidden' }} />
      
      <div className="flex flex-col items-center mb-4 relative text-white">
        {isStart && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-0.5 rounded-full font-black text-[10px] border border-black uppercase flex items-center gap-1">🚀 START</div>}
        {data.globalKeyword && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-lg"><Globe size={12} /></div>}
        
        <div className="font-black text-sm text-center break-words w-full px-1 leading-tight">{data.nodeName || data.label}</div>
        <div className="mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/40 text-white/60 border border-white/10">{data.messageType}</div>
      </div>

      {/* 🚀 關鍵修正：必須渲染 Handle 並對齊 ID (opt_index)，連線才會精準 */}
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-center text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} style={{ right: -8, visibility: 'hidden' }} />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" style={{ visibility: 'hidden' }} />}
    </div>
  );
};

// 🚀 1:1 還原群組盒邏輯
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

// 🚀 1:1 還原時間分流邏輯
const TimeRouterNodeProd = ({ data }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative text-white">
    <Handle type="target" position={Position.Left} id="left_in" style={{ visibility: 'hidden' }} />
    <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-4 text-indigo-100 mb-1"><Clock size={16} className="text-indigo-400" /><span>{data.nodeName}</span></div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 text-indigo-300 border-indigo-500/30">
      {data.config?.forceOffHours ? <span className="text-rose-400">🚨 強制下班模式</span> : `${data.config?.startTime || '09:00'} - ${data.config?.endTime || '18:00'}`}
    </div>
    <Handle type="source" position={Position.Right} id="business" style={{ top: '30%', visibility: 'hidden' }} />
    <Handle type="source" position={Position.Right} id="off-hours" style={{ top: '70%', visibility: 'hidden' }} />
  </div>
);

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd, timeRouter: TimeRouterNodeProd };

function ProductionCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stats, setStats] = useState({ nodes: 0, lastDate: '' });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { setViewport } = useReactFlow();
  const initRef = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        const raw = snap.data();
        const rawNodes = raw.nodes || [];
        const rawEdges = raw.edges || [];

        const processedNodes = rawNodes.map((n: any) => {
          // 🚀 關鍵修正：如果是群組盒，必須設定 type 為 group 才會調用組件
          if (n.messageType === 'group_box') {
            const isDone = n.customLabel === '已完成';
            const isTodo = n.customLabel === '待處理';
            return {
              id: n.id,
              position: n.position,
              type: 'group',
              style: { 
                width: n.width || 400, 
                height: n.height || 300, 
                backgroundColor: isDone ? 'rgba(16, 185, 129, 0.05)' : isTodo ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                border: `2px dashed ${isDone ? '#10b98180' : isTodo ? '#f59e0b80' : '#3b82f650'}`,
                borderRadius: '32px'
              },
              data: { title: n.nodeName, customLabel: n.customLabel },
              zIndex: -1,
              draggable: false
            };
          }

          return {
            id: n.id,
            position: n.position,
            type: n.messageType === 'time_router' ? 'timeRouter' : 'custom',
            // 🚀 關鍵修正：將 top-level 的 nodeName 塞回 data，確保 CustomNode 能顯示標題
            data: { ...n.data, nodeName: n.nodeName, messageType: n.messageType },
            draggable: false,
            selectable: true
          };
        });

        setNodes(processedNodes);
        
        // 🚀 連線處理 (保持動畫與顏色)
        setEdges(rawEdges.map((e: any) => ({
          ...e,
          animated: true,
          style: { stroke: e.color || '#60a5fa', strokeWidth: 2, strokeDasharray: '5 5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: e.color || '#60a5fa' }
        })));

        setStats({ 
          nodes: rawNodes.length, 
          lastDate: raw.publishedAt?.toDate ? raw.publishedAt.toDate().toLocaleString() : new Date(raw.publishedAt).toLocaleString()
        });

        // 🚀 視角同步
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
    <div className="flex flex-col h-full bg-[#020617] overflow-hidden relative font-sans">
      <GlobalProdStyles />
      
      {/* 狀態列 */}
      <div className="absolute top-8 left-8 z-50 pointer-events-none">
        <div className="bg-slate-900/90 border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center gap-5 pointer-events-auto">
          <div className="bg-rose-600 p-2.5 rounded-xl shadow-lg shadow-rose-600/30"><ShieldCheck className="text-white" size={24} /></div>
          <div>
            <h1 className="text-[12px] font-black text-rose-500 italic tracking-[0.2em] uppercase leading-none">Production Monitoring</h1>
            <p className="text-[11px] text-slate-400 font-bold mt-1.5 tracking-tight flex items-center gap-2">
                線上版本：<span className="text-white">{stats.lastDate}</span>
            </p>
          </div>
          <div className="h-10 w-px bg-white/10 mx-1" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Nodes</span>
            <span className="text-xl font-black text-white leading-none">{stats.nodes}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex">
        <div className="flex-1 relative">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes} 
            onNodeClick={(_, n) => n.type !== 'group' && setSelectedNodeId(n.id)} 
            onPaneClick={() => setSelectedNodeId(null)} 
            nodesDraggable={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
            <Controls position="bottom-right" className="!bg-slate-900 !border-white/10 !fill-white" />
          </ReactFlow>
        </div>

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
