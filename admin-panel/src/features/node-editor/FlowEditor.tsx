import { useState, useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  Node, 
  Edge, 
  BackgroundVariant, 
  NodeMouseHandler 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import { Plus } from 'lucide-react';

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 📡 監聽資料庫
  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      setNodes(snap.docs.map(d => ({
        id: d.id,
        type: d.data().type || 'default',
        position: d.data().position || { x: 100, y: 100 },
        data: { label: d.data().nodeName || '新節點' },
        className: 'bg-card text-card-foreground border-2 border-border shadow-md rounded-md px-4 py-2 min-w-[180px] text-center'
      })));
    });
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => ({ id: d.id, source: d.data().source, target: d.data().target, animated: true })));
    });
    return () => { unsubNodes(); unsubEdges(); };
  }, []);

  const addNewNode = async () => { 
    await addDoc(collection(db, "flowRules"), { nodeName: "新關鍵字", type: "default", position: { x: 150, y: 150 }, updatedAt: serverTimestamp() }); 
  };

  const onNodeDragStop: NodeMouseHandler = async (_, node) => { 
    await updateDoc(doc(db, "flowRules", node.id), { position: node.position }); 
  };

  return (
    <div className="w-full h-full relative flex overflow-hidden">
      {/* 工具列 */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={addNewNode} className="bg-[#06C755] text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95">
          <Plus size={18} /> 新增節點
        </button>
      </div>

      {/* 畫布區域 */}
      <div className="flex-1 h-full bg-slate-900">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
          onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
          onNodeClick={(_, n) => { setSelectedNodeId(n.id); setIsPanelOpen(true); }} 
          onNodeDragStop={onNodeDragStop} 
          onPaneClick={() => setIsPanelOpen(false)} 
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="#475569" className="opacity-20" />
          <Controls />
        </ReactFlow>
      </div>

      {/* 編輯面板 (模擬器現在固定在面板最上方) */}
      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full" onClick={(e) => e.stopPropagation()}>
          <NodeEditPanel 
            nodeId={selectedNodeId} 
            onClose={() => setIsPanelOpen(false)} 
            // 這裡不再需要 onDataChange，因為面板會自己處理預覽
          />
        </div>
      </div>
    </div>
  );
}
