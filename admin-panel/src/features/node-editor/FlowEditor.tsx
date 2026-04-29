import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, 
  Node, Edge, BackgroundVariant, Connection, ConnectionMode, MarkerType,
  Handle, Position 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, writeBatch, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import EdgeEditPanel from '../message-form/EdgeEditPanel';
import { Plus, Flag, Magnet, Save, History, Download } from 'lucide-react';

const CustomNode = ({ data, isConnectable }: any) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
      {data.label}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activePanel, setActivePanel] = useState<'node' | 'edge' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // 版本管理狀態
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);

  const getNodeStyle = (type: string, isStart: boolean) => {
    if (isStart) return 'bg-slate-900 border-yellow-400 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-[3px]';
    switch(type) {
      case 'carousel':
      case 'flex': return 'bg-amber-900/80 border-amber-500 text-amber-100 shadow-amber-900/50';
      case 'image': return 'bg-emerald-900/80 border-emerald-500 text-emerald-100 shadow-emerald-900/50';
      case 'video': return 'bg-rose-900/80 border-rose-500 text-rose-100 shadow-rose-900/50';
      default: return 'bg-blue-900/80 border-blue-500 text-blue-100 shadow-blue-900/50';
    }
  };

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      setNodes(snap.docs.map(d => {
        const data = d.data();
        const isStart = data.nodeName === '預設回覆'; 
        return {
          id: d.id,
          type: 'custom', 
          position: data.position || { x: 100, y: 100 },
          data: { label: (
            <div className="flex flex-col items-center justify-center w-full h-full relative">
              {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl animate-bounce border-2 border-black z-50">🚀 START</div>}
              <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-3">
                {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                <span className="line-clamp-2 leading-snug break-words text-center">{data.nodeName || '新節點'}</span>
              </div>
              {data.customLabel && <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 max-w-[85px] truncate">{data.customLabel}</div>}
              <div className={`absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shadow-sm ${isStart ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-black/40 text-white/80 border-white/10'}`}>{data.messageType}</div>
            </div>
          )},
          className: `border-2 shadow-2xl rounded-2xl w-[200px] h-[80px] flex items-center justify-center box-border ${getNodeStyle(data.messageType, isStart)}`
        };
      }));
    });

    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => {
        const data = d.data();
        const arrowDir = data.arrowDirection || 'forward';
        const markerConfig = { type: MarkerType.ArrowClosed, color: data.color || '#deff9a' };
        return { 
          id: d.id, source: data.source, target: data.target, sourceHandle: data.sourceHandle, targetHandle: data.targetHandle, type: data.pathType || 'smoothstep', animated: data.dashed !== false, 
          style: { stroke: data.color || '#deff9a', strokeWidth: data.strokeWidth || 2, strokeDasharray: data.dashed ? '5 5' : '' },
          markerEnd: (arrowDir === 'forward' || arrowDir === 'both') ? markerConfig : undefined,
          markerStart: (arrowDir === 'backward' || arrowDir === 'both') ? markerConfig : undefined,
        };
      }));
    });

    const unsubSnaps = onSnapshot(query(collection(db, "flowSnapshots"), orderBy("createdAt", "desc")), (snap) => {
        setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubNodes(); unsubEdges(); unsubSnaps(); };
  }, []);

  // 👉 核心功能：存檔當前畫布
  const saveCurrentFlow = async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const defaultName = `自動回覆設定_${today}`;
    const snapshotName = window.prompt("請輸入存檔名稱：", defaultName);
    
    if (!snapshotName) return;

    // 打包所有資料
    const flowData = {
        name: snapshotName,
        nodes: nodes.map(n => ({ id: n.id, position: n.position, ...n.data })), // 此處需與資料庫結構同步
        edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, style: e.style, type: e.type, animated: e.animated })),
        createdAt: serverTimestamp()
    };

    // 這裡我們需要直接讀取原始資料庫的內容來存檔，以確保內容完整
    const nodeSnaps = await getDocs(collection(db, "flowRules"));
    const edgeSnaps = await getDocs(collection(db, "flowEdges"));

    await addDoc(collection(db, "flowSnapshots"), {
        name: snapshotName,
        nodes: nodeSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
        edges: edgeSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
        createdAt: serverTimestamp()
    });
    alert("✅ 全域版本已存檔！");
  };

  // 👉 核心功能：載入版本
  const loadSnapshot = async (snap: any) => {
    if (!window.confirm(`⚠️ 載入「${snap.name}」將取代目前畫布，確定繼續？`)) return;

    const batch = writeBatch(db);

    // 1. 清除目前的
    const currentNodeSnaps = await getDocs(collection(db, "flowRules"));
    const currentEdgeSnaps = await getDocs(collection(db, "flowEdges"));
    currentNodeSnaps.forEach(d => batch.delete(d.ref));
    currentEdgeSnaps.forEach(d => batch.delete(d.ref));

    // 2. 寫入快照的
    snap.nodes.forEach((n: any) => {
        const { id, ...rest } = n;
        batch.set(doc(db, "flowRules", id), rest);
    });
    snap.edges.forEach((e: any) => {
        const { id, ...rest } = e;
        batch.set(doc(db, "flowEdges", id), rest);
    });

    await batch.commit();
    setShowSnapshots(false);
    alert("✅ 版本已成功載入！");
  };

  const handlePaneClick = () => { setActivePanel(null); setSelectedId(null); };

  return (
    <div className="w-full h-full relative bg-[#020617] flex overflow-hidden">
      
      {/* 左側功能區 */}
      <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
          <button onClick={async () => { await addDoc(collection(db, "flowRules"), { nodeName: "新關鍵字", messageType: "text", position: { x: 200, y: 200 }, updatedAt: serverTimestamp() }); }} className="bg-[#deff9a] text-black px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform">
            <Plus size={20} /> ADD NODE
          </button>
          
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${snapToGrid ? 'bg-slate-800 text-[#deff9a] border-[#deff9a]/30 shadow-lg' : 'bg-slate-900/50 text-slate-500 border-transparent hover:bg-slate-800'}`}>
            <Magnet size={14}/> 磁吸對齊 {snapToGrid ? 'ON' : 'OFF'}
          </button>

          <div className="h-px bg-white/5 my-2 w-full"></div>

          <button onClick={saveCurrentFlow} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors">
            <Save size={14}/> 儲存目前版本
          </button>

          <button onClick={() => setShowSnapshots(!showSnapshots)} className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl shadow-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
            <History size={14}/> 歷史版本載入
          </button>
      </div>

      {/* 版本列表彈窗 */}
      {showSnapshots && (
          <div className="absolute top-44 left-8 z-50 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4">
              <div className="p-4 bg-slate-800/50 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SAVED VERSIONS</span>
                  <button onClick={() => setShowSnapshots(false)}><X size={14} className="text-slate-500"/></button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {snapshots.map(snap => (
                      <div key={snap.id} className="p-3 bg-slate-950/50 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer flex justify-between items-center" onClick={() => loadSnapshot(snap)}>
                          <div className="flex flex-col">
                              <span className="text-xs text-white font-bold truncate max-w-[160px]">{snap.name}</span>
                              <span className="text-[9px] text-slate-500">{snap.createdAt?.toDate().toLocaleString()}</span>
                          </div>
                          <Download size={14} className="text-[#deff9a] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                  ))}
                  {snapshots.length === 0 && <div className="p-8 text-center text-[10px] text-slate-600">尚無存檔紀錄</div>}
              </div>
          </div>
      )}

      <ReactFlow 
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
        onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
        onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
        onConnect={useCallback(async (params: Connection) => {
            await addDoc(collection(db, "flowEdges"), { ...params, color: '#deff9a', strokeWidth: 2, dashed: true, arrowDirection: 'forward', pathType: 'smoothstep', createdAt: serverTimestamp() });
        }, [])} 
        onNodesDelete={useCallback(async (dn: Node[]) => { for (const n of dn) await deleteDoc(doc(db, "flowRules", n.id)); }, [])} 
        onEdgesDelete={useCallback(async (de: Edge[]) => { for (const e of de) await deleteDoc(doc(db, "flowEdges", e.id)); }, [])} 
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }} 
        onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }} 
        onPaneClick={handlePaneClick} 
        onNodeDragStop={async (_, n) => { await updateDoc(doc(db, "flowRules", n.id), { position: n.position }); }} 
        connectionMode={ConnectionMode.Loose} deleteKeyCode={["Backspace", "Delete"]} snapToGrid={snapToGrid} snapGrid={[20, 20]} fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
        <Controls />
      </ReactFlow>

      <div className={`absolute right-0 top-0 h-full transition-all duration-500 z-50 ${activePanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        {activePanel === 'node' && <NodeEditPanel nodeId={selectedId} onClose={handlePaneClick} />}
        {activePanel === 'edge' && <EdgeEditPanel edgeId={selectedId} onClose={handlePaneClick} />}
      </div>
    </div>
  );
}
