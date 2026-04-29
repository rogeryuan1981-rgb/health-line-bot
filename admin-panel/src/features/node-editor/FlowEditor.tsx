import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, 
  Node, Edge, BackgroundVariant, Connection, ConnectionMode, MarkerType,
  Handle, Position 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import EdgeEditPanel from '../message-form/EdgeEditPanel';
import { Plus, Flag, Magnet } from 'lucide-react';

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
              {isStart && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl animate-bounce flex items-center gap-1.5 whitespace-nowrap border-2 border-black z-50">
                   <span className="text-sm">🚀</span> START
                </div>
              )}
              
              {/* 👉 核心修正：將字體降為 text-sm，加入 line-clamp-2 允許最多兩行換行 */}
              <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-3 mt-[-2px]">
                {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                <span className="line-clamp-2 leading-snug break-words">{data.nodeName || '新節點'}</span>
              </div>

              <div className={`absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                isStart 
                  ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' 
                  : 'bg-black/40 text-white/80 border-white/10'
              }`}>
                {data.messageType}
              </div>
            </div>
          )},
          className: `border-2 shadow-2xl rounded-2xl w-[200px] h-[80px] p-0 flex items-center justify-center box-border transition-colors duration-500 ${getNodeStyle(data.messageType, isStart)}`
        };
      }));
    });

    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => {
        const data = d.data();
        const arrowDir = data.arrowDirection || 'forward';
        const markerConfig = { type: MarkerType.ArrowClosed, color: data.color || '#deff9a' };

        return { 
          id: d.id, 
          source: data.source, 
          target: data.target, 
          sourceHandle: data.sourceHandle, 
          targetHandle: data.targetHandle, 
          type: data.pathType || 'smoothstep',
          animated: data.dashed !== false, 
          style: { 
            stroke: data.color || '#deff9a', 
            strokeWidth: data.strokeWidth || 2,
            strokeDasharray: data.dashed ? '5 5' : '', 
          },
          markerEnd: (arrowDir === 'forward' || arrowDir === 'both') ? markerConfig : undefined,
          markerStart: (arrowDir === 'backward' || arrowDir === 'both') ? markerConfig : undefined,
        };
      }));
    });
    return () => { unsubNodes(); unsubEdges(); };
  }, []);

  const addNewNode = async () => { 
    await addDoc(collection(db, "flowRules"), { 
      nodeName: "新關鍵字", messageType: "text", position: { x: 200, y: 200 }, updatedAt: serverTimestamp() 
    }); 
  };

  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return;
    await addDoc(collection(db, "flowEdges"), {
      source: params.source, 
      target: params.target,
      sourceHandle: params.sourceHandle, 
      targetHandle: params.targetHandle, 
      color: '#deff9a', strokeWidth: 2, dashed: true, arrowDirection: 'forward',
      pathType: 'smoothstep', 
      createdAt: serverTimestamp()
    });
  }, []);

  const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
    for (const node of deletedNodes) {
      await deleteDoc(doc(db, "flowRules", node.id));
      if (node.id === selectedId) {
        setActivePanel(null);
        setSelectedId(null);
      }
    }
  }, [selectedId]);

  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    for (const edge of deletedEdges) {
      await deleteDoc(doc(db, "flowEdges", edge.id));
      if (edge.id === selectedId) {
        setActivePanel(null);
        setSelectedId(null);
      }
    }
  }, [selectedId]);

  const handlePaneClick = () => {
    setActivePanel(null);
    setSelectedId(null);
  };

  return (
    <div className="w-full h-full relative bg-[#020617] flex overflow-hidden">
      
      <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
          <button onClick={addNewNode} className="bg-[#deff9a] text-black px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform">
            <Plus size={20} /> ADD NODE
          </button>
          
          <button 
            onClick={() => setSnapToGrid(!snapToGrid)} 
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all border ${snapToGrid ? 'bg-slate-800 text-[#deff9a] border-[#deff9a]/30 shadow-lg' : 'bg-slate-900/50 text-slate-500 border-transparent hover:bg-slate-800'}`}
          >
            <Magnet size={14} className={snapToGrid ? 'text-[#deff9a]' : 'text-slate-500'} /> 
            磁吸對齊 {snapToGrid ? 'ON' : 'OFF'}
          </button>
      </div>

      <ReactFlow 
        nodes={nodes} edges={edges} 
        nodeTypes={nodeTypes} 
        onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
        onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }} 
        onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }}
        onPaneClick={handlePaneClick}
        onNodeDragStop={async (_, n) => { await updateDoc(doc(db, "flowRules", n.id), { position: n.position }); }} 
        connectionMode={ConnectionMode.Loose}  
        deleteKeyCode={["Backspace", "Delete"]}
        snapToGrid={snapToGrid}         
        snapGrid={[20, 20]}             
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
        <Controls />
      </ReactFlow>

      <div className={`absolute right-0 top-0 h-full transition-all duration-500 ease-in-out z-50 ${activePanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        {activePanel === 'node' && <NodeEditPanel nodeId={selectedId} onClose={handlePaneClick} />}
        {activePanel === 'edge' && <EdgeEditPanel edgeId={selectedId} onClose={handlePaneClick} />}
      </div>
    </div>
  );
}
