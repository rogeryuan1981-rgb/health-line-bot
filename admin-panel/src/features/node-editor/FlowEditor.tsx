import { useState, useCallback } from 'react';
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

// 引入剛才建立的編輯面板
import NodeEditPanel from '../message-form/NodeEditPanel';

const initialNodes: Node[] = [
  { 
    id: 'node-start', 
    type: 'input',
    position: { x: 300, y: 50 }, 
    data: { label: '啟動關鍵字：預防保健' },
    className: 'bg-primary text-primary-foreground border-none shadow-lg rounded-md px-4 py-2 font-bold min-w-[200px] text-center cursor-pointer hover:ring-2 ring-ring transition-all'
  },
  { 
    id: 'node-menu-1', 
    position: { x: 300, y: 150 }, 
    data: { label: '卡片選單：請選擇您想了解的主題' },
    className: 'bg-card text-card-foreground border-2 border-border shadow-md rounded-md px-4 py-2 min-w-[200px] text-center cursor-pointer hover:ring-2 ring-ring transition-all'
  },
  { 
    id: 'node-content-diet', 
    position: { x: 100, y: 300 }, 
    data: { label: '圖文懶人包：心血管飲食原則' },
    className: 'bg-secondary text-secondary-foreground border border-border shadow-md rounded-md px-4 py-2 min-w-[200px] text-center cursor-pointer hover:ring-2 ring-ring transition-all'
  },
  { 
    id: 'node-content-exercise', 
    position: { x: 500, y: 300 }, 
    data: { label: '教學影片：居家基礎伸展操' },
    className: 'bg-secondary text-secondary-foreground border border-border shadow-md rounded-md px-4 py-2 min-w-[200px] text-center cursor-pointer hover:ring-2 ring-ring transition-all'
  },
];

const initialEdges: Edge[] = [
  { id: 'edge-1', source: 'node-start', target: 'node-menu-1', animated: true, style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 } },
  { id: 'edge-2', source: 'node-menu-1', target: 'node-content-diet', label: '按鈕：飲食建議', labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 500 }, labelBgStyle: { fill: 'hsl(var(--background))' }, style: { stroke: 'hsl(var(--muted-foreground))' } },
  { id: 'edge-3', source: 'node-menu-1', target: 'node-content-exercise', label: '按鈕：運動教學', labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 500 }, labelBgStyle: { fill: 'hsl(var(--background))' }, style: { stroke: 'hsl(var(--muted-foreground))' } },
];

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  
  // 狀態：控制右側編輯面板是否顯示
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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

  // 點擊節點時，開啟編輯面板
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    console.log('選中的節點:', node.id);
    setIsPanelOpen(true);
  }, []);

  return (
    <div className="w-full h-full relative flex overflow-hidden">
      
      {/* React Flow 畫布區 */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick} // 綁定點擊事件
          onPaneClick={() => setIsPanelOpen(false)} // 點擊空白處關閉面板
          fitView
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="hsl(var(--muted-foreground))" opacity={0.3} />
          <Controls 
            className="bg-card border-border fill-foreground"
            style={{ button: { backgroundColor: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' } }}
          />
        </ReactFlow>
      </div>

      {/* 編輯面板 (加上滑入動畫) */}
      <div 
        className={`absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out z-20 ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 我們這裡用 onClick 攔截點擊，避免事件穿透到畫布導致面板關閉 */}
        <div className="h-full" onClick={(e) => e.stopPropagation()}>
          <NodeEditPanel />
        </div>
      </div>

    </div>
  );
}
