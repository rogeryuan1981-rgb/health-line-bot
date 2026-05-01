import { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, BackgroundVariant, Node, Edge, 
  ReactFlowProvider, Handle, Position, useReactFlow, Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Flag } from 'lucide-react';
import NodeEditPanel from '../message-form/NodeEditPanel';

const GlobalProdStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .react-flow__handle { opacity: 0 !important; pointer-events: none !important; }
    .node-prod-glow { box-shadow: 0 0 30px rgba(250,204,21,0.4) !important; border-color: #facc15 !important; }
  `}} />
);

const CustomNodeProd = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  const getBg = () => {
    if (isStart) return 'bg-slate-900 border-yellow-400';
    switch(data.messageType) {
      case 'carousel': case 'flex': return 'bg-amber-950/90 border-amber-500';
      case 'image': return 'bg-emerald-950/90 border-emerald-500';
      case 'video': return 'bg-rose-950/90 border-rose-500';
      default: return 'bg-blue-950/90 border-blue-500';
    }
  };

  return (
    <div className={`w-[200px] min-h-[80px] rounded-2xl border-2 shadow-2xl flex flex-col p-3 text-white ${getBg()} ${isStart ? 'node-prod-glow' : ''}`}>
      <Handle type="target" position={Position.Left} id="left_in" />
      <div className="flex flex-col items-center mb-4 relative text-center">
        {isStart && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-0.5 rounded-full font-black text-[10px] border border-black uppercase flex items-center gap-1">🚀 START</div>}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400" />}
          {data.nodeName}
        </div>
        <div className="mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/40 text-white/60 border border-white/10">{data.messageType}</div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-center text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} style={{ right: -10 }} />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" style={{ right: -10 }} />}
    </div>
  );
};

const GroupNodeProd = ({ data }: any) => {
  const isDone = data.customLabel === '已完成';
  const isTodo = data.customLabel === '待處理';
  const color = isDone ? 'bg-emerald-600 border-emerald-400' : isTodo ? 'bg-amber-600 border-amber-400' : 'bg-blue-600 border-blue-400';
  return (
    <div className="w-full h-full relative">
      <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase shadow-2xl border-2 z-50 text-white ${color}`}>
        {data.title || '區塊'}
      </div>
    </div>
  );
};

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd };

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
        const processedNodes = (raw.nodes || []).map((n: any) => {
          const base: any = {
            id: n.id,
            position: n.position,
            type: n.type || 'custom',
            data: { ...n.data, nodeName: n.nodeName, messageType: n.messageType, customLabel: n.customLabel },
            draggable: false
          };
          if (n.type === 'group') {
            base.style = { width: Number(n.width) || 400, height: Number(n.height) || 300, backgroundColor: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '32px' };
          }
          return base;
        });

        setNodes(processedNodes);
        setEdges((raw.edges || []).map((e: any) => ({ ...e, animated: true, style: { stroke: e.color || '#60a5fa', strokeWidth: 3 } })));

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
      <div className="absolute top-8 left-8 z-50">
        <div className="bg-slate-900/90 border border-white/10 p-5 rounded-3xl shadow-2xl flex items-center gap-5 backdrop-blur-xl">
          <div className="bg-rose-600 p-2.5 rounded-xl shadow-rose-600/30"><ShieldCheck className="text-white" size={24} /></div>
          <h1 className="text-[12px] font-black text-rose-500 italic uppercase">Monitoring</h1>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} onNodeClick={(_, n) => n.type !== 'group' && setSelectedId(n.id)} onPaneClick={() => setSelectedId(null)}>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
          <Controls position="bottom-right" className="!bg-slate-900 !border-white/10 !fill-white" />
        </ReactFlow>
        {selectedId && (
          <div className="w-[450px] h-full bg-slate-950 border-l border-white/10 z-[100] animate-in slide-in-from-right">
             <NodeEditPanel nodeId={selectedId} onClose={() => setSelectedId(null)} isReadOnly={true} sourceCollection="botConfig/production" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductionViewer() {
  return <div className="flex-1 h-full overflow-hidden bg-[#020617]"><ReactFlowProvider><ProductionCanvas /></ReactFlowProvider></div>;
}
