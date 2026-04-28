import { useState, useEffect } from 'react';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, Node, Edge, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import { Plus } from 'lucide-react';

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      setNodes(snap.docs.map(d => ({
        id: d.id, type: 'default', position: d.data().position || { x: 100, y: 100 },
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
    await addDoc(collection(db, "flowRules"), { nodeName: "新關鍵字", messageType: "text", position: { x: 150, y: 150 }, updatedAt: serverTimestamp() }); 
  };

  return (
    <div className="w-full h-full relative bg-[#0F172A]">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={addNewNode} className="bg-[#06C755] text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 font-bold transition-transform hover:scale-105">
          <Plus size={18} /> 新增節點
        </button>
      </div>

      <div className="w-full h-full">
        <ReactFlow 
          nodes={nodes} edges={edges} 
          onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
          onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
          onNodeClick={(_, n) => { setSelectedNodeId(n.id); setIsPanelOpen(true); }} 
          onPaneClick={() => setIsPanelOpen(false)} 
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="#475569" className="opacity-20" />
          <Controls />
        </ReactFlow>
      </div>

      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <NodeEditPanel nodeId={selectedNodeId} onClose={() => setIsPanelOpen(false)} />
      </div>
    </div>
  );
}
