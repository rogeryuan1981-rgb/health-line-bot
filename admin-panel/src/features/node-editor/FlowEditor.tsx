import { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, BackgroundVariant, NodeMouseHandler } from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import LineSimulator from '../simulator/LineSimulator'; // 👉 引入模擬器
import { Plus } from 'lucide-react';

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [simulatorData, setSimulatorData] = useState<any>({}); // 👉 儲存模擬器資料

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      setNodes(snap.docs.map(d => ({
        id: d.id,
        type: d.data().type || 'default',
        position: d.data().position || { x: 100, y: 100 },
        data: { label: d.data().nodeName || '新節點' },
        className: 'bg-card text-card-foreground border-2 border-border shadow-md rounded-md px-4 py-2 min-w-[180px] text-center cursor-pointer hover:ring-2 ring-ring transition-all'
      })));
    });
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => ({ id: d.id, source: d.data().source, target: d.data().target, animated: true, style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 } })));
    });
    return () => { unsubNodes(); unsubEdges(); };
  }, []);

  const addNewNode = async () => { await addDoc(collection(db, "flowRules"), { nodeName: "新關鍵字", type: "default", position: { x: 150, y: 150 }, updatedAt: serverTimestamp() }); };
  const onNodeDragStop: NodeMouseHandler = async (_, node) => { await updateDoc(doc(db, "flowRules", node.id), { position: node.position }); };
  const onConnect: OnConnect = async (p) => { if (!p.source || !p.target) return; await addDoc(collection(db, "flowEdges"), { source: p.source, target: p.target, createdAt: serverTimestamp() }); };

  return (
    <div className="w-full h-full relative flex overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={addNewNode} className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity font-medium"><Plus size={18} /> 新增節點</button>
      </div>

      <div className="flex-1 h-full">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} onConnect={onConnect} onNodeClick={(_, n) => { setSelectedNodeId(n.id); setIsPanelOpen(true); }} onNodeDragStop={onNodeDragStop} onPaneClick={() => { setIsPanelOpen(false); setSimulatorData({}); }} fitView>
          <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="hsl(var(--muted-foreground))" className="opacity-20" />
          <Controls />
        </ReactFlow>
      </div>

      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full" onClick={(e) => e.stopPropagation()}>
          <NodeEditPanel 
            nodeId={selectedNodeId} 
            onClose={() => { setIsPanelOpen(false); setSimulatorData({}); }} 
            onDataChange={(data) => setSimulatorData(data)} // 👉 即時同步資料到模擬器
          />
        </div>
      </div>

      {/* 🚀 LINE 模擬器測試畫面 */}
      <LineSimulator data={simulatorData} />
    </div>
  );
}
