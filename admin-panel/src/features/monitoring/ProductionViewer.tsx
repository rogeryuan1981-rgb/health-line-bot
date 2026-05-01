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

// 🚀 視覺同步 CSS：確保群組顏色與節點發光 100% 還原
const GlobalProdStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes smoothGlow {
      0% { box-shadow: 0 0 10px rgba(244,63,94,0.3); border-color: rgba(244,63,94,0.5); }
      50% { box-shadow: 0 0 25px rgba(244,63,94,1); border-color: rgba(244,63,94,1); }
      100% { box-shadow: 0 0 10px rgba(244,63,94,0.3); border-color: rgba(244,63,94,0.5); }
    }
    .node-prod-glow { animation: smoothGlow 2.5s ease-in-out infinite !important; }
    /* 🚀 關鍵：讓錨點隱形但位置必須精準定位 */
    .react-flow__handle { opacity: 0 !important; width: 1px !important; height: 1px !important; }
  `}} />
);

// --- 🚀 關鍵修復：手動重建丟失的 Handle 映射 ---

const CustomNodeProd = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  return (
    <div className="w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px]">
      {/* 🚀 強制還原輸入點 ID */}
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} />
      
      <div className="flex flex-col items-center mb-3 mt-1">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs border-2 border-black z-50 shadow-2xl">🚀 START</div>}
        {data.isGlobal && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 shadow-lg border-2 border-slate-900"><Globe size={12} /></div>}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 text-center text-white break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400" />}
          {data.label || data.nodeName}
        </div>
        <div className={`mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shadow-sm inline-block ${isStart ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-black/40 text-white/80 border-white/10'}`}>{data.messageType}</div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-center text-slate-300">
            {opt.label}
            {/* 🚀 強制重建丟失的輸出點 ID，這會讓連線重新吸附回按鈕右側 */}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} isConnectable={false} style={{ right: -8 }} />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={false} style={{ right: -8 }} />}
    </div>
  );
};

// 🚀 群組盒樣式還原
const GroupNodeProd = ({ data }: any) => (
  <div className={`w-full h-full border-2 border-dashed rounded-3xl relative transition-all ${data.color || 'border-slate-500/50 bg-slate-500/5'}`}>
    <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-2 z-50 ${data.labelColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>{data.title || '未命名區塊'}</div>
  </div>
);

const nodeTypes = { custom: CustomNodeProd, group: GroupNodeProd };

function ProductionCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stats, setStats] = useState({ nodes: 0, lastDate: '' });
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // 🚀 節點處理：還原群組色塊
        const flowNodes = (data.nodes || []).map((n: any) => {
          const base = { id: n.id, position: n.position, draggable: false };
          if (n.messageType === 'group_box') {
            const isDone = n.customLabel === '已完成';
            const isTodo = n.customLabel === '待處理';
            return {
              ...base,
              type: 'group',
              style: { width: n.width, height: n.height },
              data: {
                title: n.nodeName,
                color: isDone ? 'border-emerald-500/50 bg-emerald-500/10' : isTodo ? 'border-amber-500/50 bg-amber-500/10' : 'border-blue-500/30 bg-blue-500/5',
                labelColor: isDone ? 'bg-emerald-600 text-white border-emerald-400' : isTodo ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400'
              },
              zIndex: -1
            };
          }
          return {
            ...base,
            type: 'custom',
            data: { ...n, label: n.nodeName },
            className: `border-2 shadow-2xl rounded-2xl w-[200px] h-fit bg-slate-900 border-slate-700`
          };
        });

        // 🚀 連線處理：強制將丟失 ID 的連線導向正確的 Handle
        const flowEdges = (data.edges || []).map((e: any) => ({
          ...e,
          animated: true,
          style: { stroke: e.color || '#60a5fa', strokeWidth: 2, strokeDasharray: '5 5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: e.color || '#60a5fa' }
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
        setStats({ nodes: flowNodes.length, lastDate: data.publishedAt?.toDate ? data.publishedAt.toDate().toLocaleString() : '未知' });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#020617] overflow-hidden">
      <GlobalProdStyles />
      
      {/* 🚀 懸浮監測卡片 (完全不擋右上角) */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 pointer-events-auto">
          <div className="bg-rose-500 p-2 rounded-lg"><ShieldCheck className="text-white" size={18} /></div>
          <div>
            <h1 className="text-xs font-black text-white italic tracking-widest uppercase">Production Live</h1>
            <p className="text-[8px] text-slate-500 font-bold mt-0.5">{stats.lastDate}</p>
          </div>
          <div className="text-right ml-4">
            <div className="text-[8px] font-black text-rose-500 uppercase">Online</div>
            <div className="text-sm font-black text-white">{stats.nodes}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView nodesDraggable={false}>
          <Background variant={BackgroundVariant.Dots} gap={20} color="#334155" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function ProductionViewer() {
  return <div className="flex-1 h-full overflow-hidden"><ReactFlowProvider><ProductionCanvas /></ReactFlowProvider></div>;
}
