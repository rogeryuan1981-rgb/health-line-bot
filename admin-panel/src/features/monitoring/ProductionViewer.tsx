import { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Controls, Background, BackgroundVariant, Node, Edge, 
  MarkerType, ReactFlowProvider, Handle, Position, useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Globe, Clock } from 'lucide-react';
import NodeEditPanel from '../message-form/NodeEditPanel';

// 🚀 強制注入全域樣式：解決節點變白、邊框消失、與連線吸附問題
const GlobalProdStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .react-flow__node-custom { cursor: pointer !important; }
    .react-flow__node-group { pointer-events: none !important; z-index: -1 !important; }
    .react-flow__handle { 
        opacity: 0 !important; 
        width: 6px !important; 
        height: 6px !important; 
        right: -3px !important; 
        background: transparent !important;
    }
    .react-flow__edge-path { stroke-width: 2.5px !important; }
  `}} />
);

// --- 🚀 核心渲染組件 (1:1 復刻編輯器邏輯) ---

const CustomNodeProd = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆' || data.label === '預設回覆';
  
  return (
    <div className={`w-[200px] min-h-[80px] rounded-2xl border-2 shadow-2xl bg-slate-900 flex flex-col p-3 transition-all ${isStart ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'border-slate-700'}`}>
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} />
      
      <div className="flex flex-col items-center mb-4 relative">
        {isStart && <div className="absolute -top-7 bg-yellow-400 text-black px-3 py-0.5 rounded-full font-black text-[10px] border border-black uppercase">Start</div>}
        <div className="font-black text-sm text-white text-center break-words w-full px-1">{data.label || data.nodeName}</div>
        <div className="mt-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            {data.messageType || 'MESSAGE'}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-800/80 border border-white/5 rounded-lg py-1.5 text-[11px] font-bold text-center text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} isConnectable={false} />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={false} />}
    </div>
  );
};

const GroupNodeProd = ({ data }: any) => (
  <div className={`w-full h-full border-2 border-dashed rounded-3xl relative ${data.color || 'border-slate-500/30 bg-slate-500/5'}`}>
    <div className={`absolute -top-4 left-6 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 ${data.labelColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {data.title || 'GROUP'}
    </div>
  </div>
);

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd };

// --- 🚀 主畫布 ---

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
        
        // 🚀 強制還原 1：節點特徵再辨識
        const flowNodes = (raw.nodes || []).map((n: any) => {
          const isGroup = n.messageType === 'group_box' || (n.width && n.height && !n.options);
          
          if (isGroup) {
            const isDone = n.customLabel === '已完成';
            const isTodo = n.customLabel === '待處理';
            return {
              id: n.id,
              position: n.position,
              type: 'group',
              style: { width: n.width, height: n.height },
              draggable: false,
              data: {
                title: n.nodeName,
                color: isDone ? 'border-emerald-500/50 bg-emerald-500/10' : isTodo ? 'border-amber-500/50 bg-amber-500/10' : 'border-blue-500/30 bg-blue-500/5',
                labelColor: isDone ? 'bg-emerald-600 text-white border-emerald-400' : isTodo ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400'
              },
              zIndex: -1
            };
          }

          return {
            id: n.id,
            position: n.position,
            type: 'custom',
            draggable: false,
            data: { ...n, label: n.nodeName }
          };
        });

        // 🚀 強制還原 2：連線色彩與動畫
        const flowEdges = (raw.edges || []).map((e: any) => ({
          ...e,
          animated: true,
          style: { stroke: e.color || '#60a5fa', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: e.color || '#60a5fa', width: 20, height: 20 }
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
        setStats({ nodes: flowNodes.length, lastDate: raw.publishedAt?.toDate ? raw.publishedAt.toDate().toLocaleString() : '未知' });

        // 🚀 強制還原 3：縮放比例同步
        if (!initRef.current) {
            const saved = localStorage.getItem('flow-viewport');
            if (saved) {
                const { x, y, zoom } = JSON.parse(saved);
                setTimeout(() => setViewport({ x, y, zoom }, { duration: 1000 }), 200);
            } else {
                setTimeout(() => setViewport({ x: 0, y: 0, zoom: 0.8 }), 200);
            }
            initRef.current = true;
        }
      }
    });
    return () => unsub();
  }, [setViewport]);

  return (
    <div className="flex flex-col h-full bg-[#020617] overflow-hidden relative">
      <GlobalProdStyles />
      
      {/* 🚀 懸浮監測卡片 (位置移至左上角，完全淨空 Roger 帳號區) */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 pointer-events-auto">
          <div className="bg-rose-600 p-2 rounded-lg shadow-lg shadow-rose-600/20"><ShieldCheck className="text-white" size={20} /></div>
          <div>
            <h1 className="text-[10px] font-black text-rose-500 italic tracking-widest uppercase leading-none">Production Monitoring</h1>
            <p className="text-[11px] text-white font-bold mt-1 tracking-tight">最後發布：{stats.lastDate}</p>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase">Nodes</div>
            <div className="text-lg font-black text-white leading-none">{stats.nodes}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex">
        <div className="flex-1 relative">
          <ReactFlow 
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
            onNodeClick={(_, n) => n.type !== 'group' && setSelectedNodeId(n.id)} 
            onPaneClick={() => setSelectedNodeId(null)}
            nodesDraggable={false} panOnScroll
          >
            <Background variant={BackgroundVariant.Lines} gap={40} color="#1e293b" />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>

        {selectedNodeId && (
          <div className="w-[480px] h-full border-l border-white/10 z-[100] bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-500">
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
