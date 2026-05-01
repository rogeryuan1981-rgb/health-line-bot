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

// 🚀 正式機專用樣式
const GlobalProdStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .react-flow__handle { opacity: 0 !important; background: transparent !important; pointer-events: none !important; }
    .react-flow__edge-path { stroke-width: 3px !important; }
    .node-prod-glow { box-shadow: 0 0 25px rgba(250,204,21,0.4); border-color: rgba(250,204,21,1) !important; }
  `}} />
);

// --- 🚀 監測版：自定義節點 ---
const CustomNodeProd = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  
  return (
    <div className={`w-[200px] min-h-[80px] rounded-2xl border-2 shadow-2xl bg-slate-900/95 flex flex-col p-3 ${isStart ? 'border-yellow-400 node-prod-glow' : 'border-slate-700'}`}>
      {/* 入口點 */}
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} />
      
      <div className="flex flex-col items-center mb-4 relative text-white">
        {isStart && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-0.5 rounded-full font-black text-[10px] border border-black uppercase flex items-center gap-1"><Flag size={10} className="fill-black"/> START</div>}
        {data.globalKeyword && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-lg"><Globe size={12} /></div>}
        
        <div className="font-black text-sm text-center break-words w-full px-1">{data.nodeName || data.label}</div>
        <div className={`mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isStart ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/5 text-slate-400'}`}>{data.messageType || 'TEXT'}</div>
      </div>

      {/* 按鈕與出口點 (關鍵：Handle ID 必須與編輯器一致) */}
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-800/80 border border-white/5 rounded-lg py-1.5 text-[11px] font-bold text-center text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} isConnectable={false} />
          </div>
        ))}
      </div>
      
      {/* 無按鈕時的預設出口 */}
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={false} />}
    </div>
  );
};

// --- 🚀 監測版：群組盒 ---
const GroupNodeProd = ({ data }: any) => {
  const isDone = data.customLabel === '已完成';
  const isTodo = data.customLabel === '待處理';
  
  const colors = isDone 
    ? 'bg-emerald-600 border-emerald-400' 
    : isTodo ? 'bg-amber-600 border-amber-400' : 'bg-blue-600 border-blue-400';

  return (
    <div className="w-full h-full relative">
      <div className={`absolute -top-4 left-6 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 z-10 text-white ${colors}`}>
        {data.title}
      </div>
    </div>
  );
};

// --- 🚀 監測版：時間分流 ---
const TimeRouterNodeProd = ({ data }: any) => (
  <div className="w-[200px] h-[95px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative text-white">
    <Handle type="target" position={Position.Left} id="left_in" isConnectable={false} />
    <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-4 text-indigo-100 mb-1"><Clock size={16} className="text-indigo-400" /><span>{data.nodeName}</span></div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 text-indigo-300 border-indigo-500/30">
      {data.config?.forceOffHours ? <span className="text-rose-400">🚨 FORCE OFF</span> : `${data.config?.startTime} - ${data.config?.endTime}`}
    </div>
    <Handle type="source" position={Position.Right} id="business" style={{ top: '30%' }} isConnectable={false} />
    <Handle type="source" position={Position.Right} id="off-hours" style={{ top: '70%' }} isConnectable={false} />
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

        // 🚀 關鍵：根據絕對座標模式重新處理資料
        const processedNodes = rawNodes.map((n: any) => {
          // 群組盒特殊處理
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
                borderRadius: '24px'
              },
              data: { title: n.nodeName, customLabel: n.customLabel },
              zIndex: -1,
              draggable: false
            };
          }

          // 一般節點處理
          return {
            id: n.id,
            position: n.position,
            type: n.messageType === 'time_router' ? 'timeRouter' : 'custom',
            data: { ...n.data, nodeName: n.nodeName },
            draggable: false,
            selectable: true,
            className: n.nodeName === '預設回覆' ? 'node-prod-glow' : ''
          };
        });

        setNodes(processedNodes);
        
        // 🚀 連線處理 (保持動畫與顏色)
        setEdges(rawEdges.map((e: any) => ({
          ...e,
          animated: true,
          style: { stroke: e.color || '#60a5fa', strokeWidth: 2.5, strokeDasharray: '6 4' },
          markerEnd: { type: MarkerType.ArrowClosed, color: e.color || '#60a5fa' }
        })));

        setStats({ 
          nodes: rawNodes.length, 
          lastDate: raw.publishedAt?.toDate ? raw.publishedAt.toDate().toLocaleString() : '未知' 
        });

        // 🚀 視角同步：自動跳轉到發布時的位置
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
    <div className="flex flex-col h-full bg-[#020617] overflow-hidden relative">
      <GlobalProdStyles />
      
      {/* 頂部狀態列 */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 pointer-events-auto">
          <div className="bg-rose-600 p-2 rounded-lg shadow-lg shadow-rose-600/20"><ShieldCheck className="text-white" size={20} /></div>
          <div>
            <h1 className="text-[10px] font-black text-rose-500 italic tracking-widest uppercase leading-none">Production Monitoring</h1>
            <p className="text-[11px] text-white font-bold mt-1 tracking-tight">線上版本：{stats.lastDate}</p>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase">Total Nodes</div>
            <div className="text-lg font-black text-white leading-none">{stats.nodes}</div>
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
            <Background variant={BackgroundVariant.Dots} gap={20} color="#334155" />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>

        {/* 點擊節點後右側顯示詳細資料 */}
        {selectedNodeId && (
          <div className="w-[480px] h-full border-l border-white/10 z-[100] bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-500">
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
    <div className="flex-1 h-full overflow-hidden">
      <ReactFlowProvider>
        <ProductionCanvas />
      </ReactFlowProvider>
    </div>
  );
}
