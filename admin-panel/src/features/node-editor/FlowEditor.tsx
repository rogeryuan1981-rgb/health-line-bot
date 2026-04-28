import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  BackgroundVariant,
  NodeMouseHandler,
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

  // 📡 監聽資料庫：節點與連線
  useEffect(() => {
    // 監聽節點
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snapshot) => {
      const dbNodes = snapshot.docs.map(doc => ({
        id: doc.id,
        type: doc.data().type || 'default',
        position: doc.data().position || { x: 100, y: 100 },
        data: { label: doc.data().nodeName || '新節點' },
        className: 'bg-card text-card-foreground border-2 border-border shadow-md rounded-md px-4 py-2 min-w-[180px] text-center cursor-pointer hover:ring-2 ring-ring transition-all'
      }));
      setNodes(dbNodes);
    });

    // 監聽連線
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snapshot) => {
      const dbEdges = snapshot.docs.map(doc => ({
        id: doc.id,
        source: doc.data().source,
        target: doc.data().target,
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 }
      }));
      setEdges(dbEdges);
    });

    return () => { unsubNodes(); unsubEdges(); };
  }, []);

  // 🏗️ 新增節點功能
  const addNewNode = async () => {
    await addDoc(collection(db, "flowRules"), {
      nodeName: "新關鍵字",
      type: "default",
      position: { x: 150, y: 150 },
      updatedAt: serverTimestamp()
    });
  };

  // 📍 拖拉停止後存入座標
  const onNodeDragStop: NodeMouseHandler = async (_, node) => {
    const nodeRef = doc(db, "flowRules", node.id);
    await updateDoc(nodeRef, { position: node.position });
  };

  // 🔗 連線後存入資料庫
  const onConnect: OnConnect = async (params) => {
    if (!params.source || !params.target) return;
    await addDoc(collection(db, "flowEdges"), {
      source: params.source,
      target: params.target,
      createdAt: serverTimestamp()
    });
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsPanelOpen(true);
  }, []);

  return (
    <div className="w-full h-full relative flex overflow-hidden bg-background">
      {/* 工具列 */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          onClick={addNewNode}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity font-medium"
        >
          <Plus size={18} /> 新增節點
        </button>
      </div>

      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={() => setIsPanelOpen(false)}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="hsl(var(--muted-foreground))" className="opacity-20" />
          <Controls />
        </ReactFlow>
      </div>

      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full" onClick={(e) => e.stopPropagation()}>
          <NodeEditPanel nodeId={selectedNodeId} onClose={() => setIsPanelOpen(false)} />
        </div>
      </div>
    </div>
  );
}
