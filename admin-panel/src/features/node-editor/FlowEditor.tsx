import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "flowRules"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbNodes: Node[] = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: index === 0 ? 'input' : 'default',
          position: data.position || { x: 300, y: 50 + index * 120 },
          data: { label: data.nodeName || '新節點' },
          className: 'bg-card text-card-foreground border-2 border-border shadow-md rounded-md px-4 py-2 min-w-[200px] text-center cursor-pointer hover:ring-2 ring-ring transition-all'
        };
      });
      setNodes(dbNodes);
      
      const dbEdges: Edge[] = dbNodes.slice(0, -1).map((node, i) => ({
        id: `edge-${i}`,
        source: node.id,
        target: dbNodes[i + 1].id,
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))' }
      }));
      setEdges(dbEdges);
    });
    return () => unsubscribe();
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsPanelOpen(true);
  }, []);

  return (
    <div className="w-full h-full relative flex overflow-hidden">
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={() => setIsPanelOpen(false)}
          fitView
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="hsl(var(--muted-foreground))" className="opacity-30" />
          <Controls className="bg-card border-border fill-foreground" />
        </ReactFlow>
      </div>

      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full" onClick={(e) => e.stopPropagation()}>
          <NodeEditPanel nodeId={selectedNodeId} />
        </div>
      </div>
    </div>
  );
}
