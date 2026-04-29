import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, Node, Edge, BackgroundVariant, NodeMouseHandler, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import { Plus } from 'lucide-react';

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const getNodeStyle = (type: string) => {
    switch(type) {
      case 'carousel':
      case 'flex': return 'bg-amber-900/80 border-amber-500 text-amber-100 shadow-amber-900/50';
      case 'image': return 'bg-emerald-900/80 border-emerald-500 text-emerald-100 shadow-emerald-900/50';
      case 'video': return 'bg-rose-900/80 border-rose-500 text-rose-100 shadow-rose-900/50';
      case 'text':
      default: return 'bg-blue-900/80 border-blue-500 text-blue-100 shadow-blue-900/50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
        case 'carousel': return 'CAROUSEL 輪播';
        case 'flex': return 'FLEX 萬能卡片';
        case 'image': return 'IMAGE 圖片';
        case 'video': return 'VIDEO 影音';
        case 'text':
        default: return 'TEXT 純文字';
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
          data: { 
            label: (
              <div className="flex flex-col items-center gap-1.5">
                <div className="text-[8px] bg-black/40 px-2 py-0.5 rounded-full text-white/90 uppercase tracking-widest border border-white/10 shadow-sm">
                  {getTypeLabel(data.messageType)}
                </div>
                <div className="font-black text-sm tracking-widest">
                  {data.nodeName || '未命名節點'}
                </div>
              </div>
            )
          },
          className: `border-2 shadow-xl rounded-xl px-5 py-4 min-w-[160px] text-center ${getNodeStyle(data.messageType)}`
        };
      }));
    });
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => ({ id: d.id, source: d.data().source, target: d.data().target, animated: true })));
    });
    return () => { unsubNodes(); unsubEdges(); };
  }, []);

  const addNewNode = async () => { 
    // 👉 優化 1：智能出生點定位 (接續在最後一個節點的右下方)
    let newX = 150;
    let newY = 150;
    
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      newX = lastNode.position.x + 60 + Math.floor(Math.random() * 40);
      newY = lastNode.position.y + 80 + Math.floor(Math.random() * 40);
    }

    await addDoc(collection(db, "flowRules"), { 
      nodeName: "新關鍵字", 
      messageType: "text", 
      position: { x: newX, y: newY }, 
      updatedAt: serverTimestamp() 
    }); 
  };

  const onNodeDragStop: NodeMouseHandler = async (_, node) => { 
    await updateDoc(doc(db, "flowRules", node.id), { position: node.position }); 
  };

  const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
    for (const node of deletedNodes) {
      await deleteDoc(doc(db, "flowRules", node.id));
      if (node.id === selectedNodeId) {
        setIsPanelOpen(false);
        setSelectedNodeId(null);
      }
    }
  }, [selectedNodeId]);

  // 👉 優化 2：新增 onConnect，處理連線寫入資料庫
  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return;
    await addDoc(collection(db, "flowEdges"), {
      source: params.source,
      target: params.target,
      createdAt: serverTimestamp()
    });
  }, []);

  // 👉 優化 3：新增 onEdgesDelete，處理刪除連線時同步資料庫
  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    for (const edge of deletedEdges) {
      await deleteDoc(doc(db, "flowEdges", edge.id));
    }
  }, []);

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedNodeId(null), 300);
  };

  return (
    <div className="w-full h-full relative bg-[#0F172A] flex overflow-hidden">
      <div className="absolute top-6 left-6 z-10">
        <button onClick={addNewNode} className="bg-[#deff9a] text-black px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-black tracking-widest transition-transform hover:scale-105">
          <Plus size={18} /> 新增節點
        </button>
      </div>

      <div className="w-full h-full">
        <ReactFlow 
          nodes={nodes} edges={edges} 
          onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
          onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}  /* 綁定連線刪除 */
          onConnect={onConnect}          /* 綁定新增連線 */
          onNodeClick={(_, n) => { setSelectedNodeId(n.id); setIsPanelOpen(true); }} 
          onNodeDragStop={onNodeDragStop} 
          onPaneClick={handleClosePanel} 
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#475569" className="opacity-30" />
          <Controls className="shadow-lg" />
        </ReactFlow>
      </div>

      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <NodeEditPanel nodeId={selectedNodeId} onClose={handleClosePanel} />
      </div>
    </div>
  );
}
