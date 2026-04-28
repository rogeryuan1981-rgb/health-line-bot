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

// 預設的節點 (Nodes)：模擬預防保健的多層引導流程
const initialNodes: Node[] = [
  { 
    id: 'node-start', 
    type: 'input',
    position: { x: 300, y: 50 }, 
    data: { label: '啟動關鍵字：預防保健' },
    // 運用 Tailwind 深色變數來美化節點
    className: 'bg-primary text-primary-foreground border-none shadow-lg rounded-md px-4 py-2 font-bold min-w-[200px] text-center'
  },
  { 
    id: 'node-menu-1', 
    position: { x: 300, y: 150 }, 
    data: { label: '卡片選單：請選擇您想了解的主題' },
    className: 'bg-card text-card-foreground border-2 border-border shadow-md rounded-md px-4 py-2 min-w-[200px] text-center'
  },
  { 
    id: 'node-content-diet', 
    position: { x: 100, y: 300 }, 
    data: { label: '圖文懶人包：心血管飲食原則' },
    className: 'bg-secondary text-secondary-foreground border border-border shadow-md rounded-md px-4 py-2 min-w-[200px] text-center'
  },
  { 
    id: 'node-content-exercise', 
    position: { x: 500, y: 300 }, 
    data: { label: '教學影片：居家基礎伸展操' },
    className: 'bg-secondary text-secondary-foreground border border-border shadow-md rounded-md px-4 py-2 min-w-[200px] text-center'
  },
];

// 預設的連線 (Edges)：定義節點間的關聯與按鈕標籤
const initialEdges: Edge[] = [
  { 
    id: 'edge-1', 
    source: 'node-start', 
    target: 'node-menu-1', 
    animated: true,
    style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 } 
  },
  { 
    id: 'edge-2', 
    source: 'node-menu-1', 
    target: 'node-content-diet', 
    label: '按鈕點擊：飲食建議',
    labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 500 },
    labelBgStyle: { fill: 'hsl(var(--background))' },
    style: { stroke: 'hsl(var(--muted-foreground))' } 
  },
  { 
    id: 'edge-3', 
    source: 'node-menu-1', 
    target: 'node-content-exercise', 
    label: '按鈕點擊：運動教學',
    labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 500 },
    labelBgStyle: { fill: 'hsl(var(--background))' },
    style: { stroke: 'hsl(var(--muted-foreground))' } 
  },
];

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // 處理節點拖拉與變更
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // 處理線條變更
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // 處理手動連線
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-background" // 強制畫布底色套用深色模式背景
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={2} color="hsl(var(--muted-foreground))" opacity={0.3} />
        {/* 控制面板 (放大縮小) */}
        <Controls 
          className="bg-card border-border fill-foreground"
          style={{ button: { backgroundColor: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' } }}
        />
      </ReactFlow>
    </div>
  );
}
