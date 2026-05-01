import { useState, useEffect } from 'react';
import ReactFlow, { 
  Controls, Background, BackgroundVariant, Node, Edge, 
  MarkerType, ReactFlowProvider, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Globe, AlertTriangle, Flag, Clock } from 'lucide-react';
import NodeEditPanel from '../message-form/NodeEditPanel';

// 🚀 注入 100% 同步編輯器的 CSS 特效
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes smoothGlow {
      0% { box-shadow: 0 0 10px rgba(244,63,94,0.3); border-color: rgba(244,63,94,0.5); }
      50% { box-shadow: 0 0 25px rgba(244,63,94,1); border-color: rgba(244,63,94,1); }
      100% { box-shadow: 0 0 10px rgba(244,63,94,0.3); border-color: rgba(244,63,94,0.5); }
    }
    .node-current-glow {
      animation: smoothGlow 2.5s ease-in-out infinite !important;
      z-index: 1000;
    }
  `}} />
);

// --- 🚀 完美克隆：視覺組件區 ---

const CustomNodeProd = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  return (
    <div className="w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px]">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} isConnectable={false} />
      <div className="flex flex-col items-center mb-3 mt-1">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs border-2 border-black z-50 whitespace-nowrap shadow-2xl">🚀 START</div>}
        {data.isGlobal && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 shadow-lg border-2 border-slate-900"><Globe size={12} /></div>}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 text-center break-words leading-tight text-white">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          {data.label}
        </div>
        <div className={`mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shadow-sm inline-block ${isStart ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-black/40 text-white/80 border-white/10'}`}>{data.messageType}</div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-center text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} style={{ opacity: 0 }} isConnectable={false} />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" style={{ opacity: 0 }} isConnectable={false} />}
    </div>
  );
};

const GroupNodeProd = ({ data }: any) => (
  <div className={`w-full h-full border-2 border-dashed rounded-3xl relative transition-all ${data.color || 'border-slate-500/50 bg-slate-500/5'}`}>
    <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-2 z-50 ${data.labelColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>{data.title || '未命名區塊'}</div>
  </div>
);

const TimeRouterNodeProd = ({ data }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative transition-all duration-300">
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} isConnectable={false} />
    <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-4 text-indigo-100 mb-1"><Clock size={16} className="text-indigo-400" /><span>{data.nodeName}</span></div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 text-indigo-300 border-indigo-500/30">
      {data.config?.forceOffHours ? <span className="text-rose-400 font-black">🚨 強制下班</span> : `${data.config?.startTime || '09:00'} - ${data.config?.endTime || '18:00'}`}
    </div>
    <Handle type="source" position={Position.Right} id="business" style={{ top: '30%', opacity: 0 }} isConnectable={false} />
    <Handle type="source" position={Position.Right} id="off-hours" style={{ top: '70%', opacity: 0 }} isConnectable={false} />
  </div>
);

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd, timeRouter: TimeRouterNodeProd };

// --- 🚀 邏輯主體 ---

function ProductionCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stats, setStats] = useState({ nodes: 0, lastDate: '' });
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const getNodeStyle = (type: string, isStart: boolean) => {
    if (isStart) return 'bg-slate-900 border-yellow-400 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-[3px]';
    switch(type) {
      case 'carousel': case 'flex': return 'bg-amber-900/80 border-amber-500 text-amber-100 shadow-amber-900/50';
      case 'image': return 'bg-emerald-900/80 border-emerald-500 text-emerald-100 shadow-emerald-900/50';
      case 'video': return 'bg-rose-900/80 border-rose-500 text-rose-100 shadow-rose-900/50';
      default: return 'bg-blue-900/80 border-blue-500 text-blue-100 shadow-blue-900/50';
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const flowNodes = (data.nodes || []).map((n: any) => {
          const base = { id: n.id, position: n.position, draggable: false, selectable: true };
          if (n.messageType === 'group_box') {
            return { ...base, type: 'group', style: { width: n.width || 400, height: n.height || 300 }, data: { title: n.nodeName, color: n.customLabel === '已完成' ? 'border-emerald-500/50 bg-emerald-500/5' : n.customLabel === '待處理' ? 'border-amber-500/50 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5', labelColor: n.customLabel === '已完成' ? 'bg-emerald-600 text-white border-emerald-400' : n.customLabel === '待處理' ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400' }, zIndex: -1 };
          }
          if (n.messageType === 'time_router') return { ...base, type: 'timeRouter', data: { ...n } };
          return { ...base, type: 'custom', data: { ...n, label: n.nodeName }, className: `border-2 shadow-2xl rounded-2xl w-[200px] h-fit transition-all duration-300 ${getNodeStyle(n.messageType, n.nodeName === '預設回覆')}` };
        });

        const flowEdges = (data.edges || []).map((e: any) => {
            let edgeColor = '#deff9a';
            if (e.sourceHandle === 'business') edgeColor = '#34d399';
            if (e.sourceHandle === 'off-hours') edgeColor = '#fb7185';
            if (e.sourceHandle?.startsWith('opt_')) edgeColor = '#60a5fa';
            return {
                id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
                animated: true, style: { stroke: edgeColor, strokeWidth: 2, strokeDasharray: '5 5' }, 
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
            };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
        setStats({ nodes: flowNodes.length, lastDate: data.publishedAt?.toDate ? data.publishedAt.toDate().toLocaleString() : '未知' });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="h-full w-full flex items-center justify-center text-rose-500 font-black italic tracking-widest">SYNCING PRODUCTION ENVIRONMENT...</div>;

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      <CustomStyles />
      {/* 🚀 儀表板更精簡，絕對不遮擋 */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-white/5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/20 p-2 rounded-lg border border-rose-500/50 shadow-lg shadow-rose-500/10"><ShieldCheck className="text-rose-500" size={18} /></div>
          <div>
            <h1 className="text-sm font-black text-white italic tracking-widest uppercase leading-none">Production Monitoring</h1>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Live Logic Snapshot (Read-Only)</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right"><div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">線上節點</div><div className="text-xs font-black text-white leading-none">{stats.nodes}</div></div>
          <div className="text-right border-l border-white/10 pl-6"><div className="text-[8px] font-black text-rose-500 uppercase mb-0.5">最後更新</div><div className="text-xs font-black text-white leading-none">{stats.lastDate}</div></div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex">
        <div className="flex-1 relative">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_, n) => setSelectedNodeId(n.id)} onPaneClick={() => setSelectedNodeId(null)} nodesDraggable={false} fitView>
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            <Controls />
          </ReactFlow>
          <div className="absolute top-6 right-6 px-4 py-2 bg-rose-600/10 border border-rose-500/30 rounded-full backdrop-blur-md flex items-center gap-2 z-10"><AlertTriangle size={12} className="text-rose-500 animate-pulse" /><span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Read-Only Live Monitor</span></div>
        </div>

        {selectedNodeId && (
          <div className="w-[480px] h-full border-l border-white/10 z-50 shadow-2xl animate-in slide-in-from-right duration-300">
             <NodeEditPanel nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} isReadOnly={true} sourceCollection="botConfig/production" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductionViewer() {
  return <div className="flex-1 h-full overflow-hidden"><ReactFlowProvider><ProductionCanvas /></ReactFlowProvider></div>;
}
