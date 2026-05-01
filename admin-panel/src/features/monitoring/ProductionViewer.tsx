import { useState, useEffect } from 'react';
import ReactFlow, { 
  Controls, Background, BackgroundVariant, Node, Edge, 
  MarkerType, ReactFlowProvider 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Clock, Globe, Zap, AlertTriangle } from 'lucide-react';

// 🚀 正式機專用組件：為了保證純粹唯讀，我們自定義簡單的 Node 呈現
const ProdNode = ({ data }: any) => {
  const isStart = data.nodeName === '預設回覆';
  return (
    <div className={`px-4 py-3 shadow-2xl rounded-2xl border-2 min-w-[180px] bg-slate-900 ${isStart ? 'border-yellow-400' : 'border-slate-700'}`}>
      <div className="flex flex-col items-center">
        {data.isGlobal && <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full p-1 border border-slate-900"><Globe size={10} /></div>}
        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{data.messageType}</div>
        <div className="text-sm font-bold text-white text-center break-words">{data.label || data.nodeName}</div>
        {data.messageType === 'time_router' && (
          <div className="mt-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-mono rounded border border-purple-500/30">
            {data.config?.startTime} - {data.config?.endTime}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = { custom: ProdNode, timeRouter: ProdNode }; // 正式機畫面統一使用唯讀樣式

function ProductionCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stats, setStats] = useState({ nodes: 0, edges: 0, globals: 0, lastDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // 轉換節點
        const flowNodes = (data.nodes || []).map((n: any) => ({
          id: n.id,
          type: 'custom',
          position: n.position || { x: 0, y: 0 },
          data: { ...n, label: n.nodeName },
          draggable: false, // 🚀 禁止拖動
          selectable: false,
        }));

        // 轉換連線
        const flowEdges = (data.edges || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true, // 🚀 正式機連線保持動畫，代表正在運行
          style: { stroke: '#f43f5e', strokeWidth: 2 }, // 改用紅色代表 Production
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' }
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
        setStats({
          nodes: flowNodes.length,
          edges: flowEdges.length,
          globals: (data.nodes || []).filter((n:any) => n.isGlobal).length,
          lastDate: data.publishedAt?.toDate ? data.publishedAt.toDate().toLocaleString() : '未知'
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="h-full w-full flex items-center justify-center text-[#22c55e] animate-pulse font-black">CONNECTING TO PRODUCTION SERVER...</div>;

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      {/* 頂部儀錶板 - 緊湊版 */}
      <div className="p-6 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-rose-500 p-2 rounded-xl"><ShieldCheck className="text-white" size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter">PRODUCTION LIVE VIEW</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">目前線上環境真實狀態 (唯讀)</p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-500 uppercase">線上節點</div>
            <div className="text-xl font-black text-white">{stats.nodes}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-500 uppercase">全域入口</div>
            <div className="text-xl font-black text-indigo-400">{stats.globals}</div>
          </div>
          <div className="text-right border-l border-white/10 pl-8">
            <div className="text-[9px] font-black text-rose-500 uppercase">最後發布時間</div>
            <div className="text-xl font-black text-white">{stats.stats.lastDate}</div>
          </div>
        </div>
      </div>

      {/* 畫布區域 */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
        >
          {/* 使用暗紅色背景點陣，區別於編輯器 */}
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#451a1a" />
          <Controls />
        </ReactFlow>

        {/* 浮動警告標籤 */}
        <div className="absolute bottom-6 right-6 px-4 py-2 bg-rose-600/20 border border-rose-500/50 rounded-full backdrop-blur-md flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-500 animate-pulse" />
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Read-Only Mode</span>
        </div>
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
