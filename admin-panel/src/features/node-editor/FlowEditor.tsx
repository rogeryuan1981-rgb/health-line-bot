import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, Node, Edge, BackgroundVariant, NodeMouseHandler, Connection, ConnectionMode, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import EdgeEditPanel from '../message-form/EdgeEditPanel'; // 👉 導入新面板
import { Plus } from 'lucide-react';

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // 面板控制狀態
  const [activePanel, setActivePanel] = useState<'node' | 'edge' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getNodeStyle = (type: string) => {
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
        return {
          id: d.id,
          type: 'default',
          position: data.position || { x: 100, y: 100 },
          data: { label: (
            <div className="flex flex-col items-center gap-1">
              <div className="text-[7px] opacity-60 uppercase font-black tracking-tighter">{data.messageType}</div>
              <div className="font-bold text-sm tracking-widest">{data.nodeName || '新節點'}</div>
            </div>
          )},
          className: `border-2 shadow-2xl rounded-2xl px-6 py-4 min-w-[160px] text-center ${getNodeStyle(data.messageType)}`
        };
      }));
    });

    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => {
        const data = d.data();
        // 👉 核心：從資料庫讀取樣式設定
        return { 
          id: d.id, 
          source: data.source, 
          target: data.target, 
          animated: data.dashed !== false, // 虛線時自動開啟流動動畫
          style: { 
            stroke: data.color || '#deff9a', 
            strokeWidth: data.strokeWidth || 2,
            strokeDasharray: data.dashed ? '5 5' : '', 
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: data.color || '#deff9a' }
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
      source: params.source, target: params.target,
      color: '#deff9a', strokeWidth: 2, dashed: true, // 預設樣式
      createdAt: serverTimestamp()
    });
  }, []);

  const handlePaneClick = () => {
    setActivePanel(null);
    setSelectedId(null);
  };

  return (
    <div className="w-full h-full relative bg-[#020617] flex overflow-hidden">
      <button onClick={addNewNode} className="absolute top-8 left-8 z-10 bg-[#deff9a] text-black px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center gap-2 hover:scale-105 transition-transform">
        <Plus size={20} /> ADD NODE
      </button>

      <ReactFlow 
        nodes={nodes} edges={edges} 
        onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
        onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
        onConnect={onConnect}          
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }} 
        onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }} // 👉 點擊線條觸發
        onPaneClick={handlePaneClick}
        onNodeDragStop={async (_, n) => { await updateDoc(doc(db, "flowRules", n.id), { position: n.position }); }} 
        connectionMode={ConnectionMode.Loose}  
        fitView
      >
        <Background variant={BackgroundVariant.Lines} gap={40} color="#1e293b" />
        <Controls />
      </ReactFlow>

      {/* 側邊面板容器 */}
      <div className={`absolute right-0 top-0 h-full transition-all duration-500 ease-in-out z-50 ${activePanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        {activePanel === 'node' && <NodeEditPanel nodeId={selectedId} onClose={handlePaneClick} />}
        {activePanel === 'edge' && <EdgeEditPanel edgeId={selectedId} onClose={handlePaneClick} />}
      </div>
    </div>
  );
}
