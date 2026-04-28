import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, Node, Edge, BackgroundVariant, NodeMouseHandler } from 'reactflow';
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

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      setNodes(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          type: 'default',
          position: data.position || { x: 100, y: 100 },
          data: { label: data.nodeName || '未命名節點' },
          className: `border-2 shadow-xl rounded-xl px-5 py-3 min-w-[160px] text-center font-bold tracking-widest ${getNodeStyle(data.messageType)}`
        };
      }));
    });
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => ({ id: d.id, source: d.data().source, target: d.data().target, animated: true })));
    });
    return () => { unsubNodes(); unsubEdges(); };
  }, []);

  const addNewNode = async () => { 
    const offset = Math.floor(Math.random() * 50);
    await addDoc(collection(db, "flowRules"), { 
      nodeName: "新關鍵字", 
      messageType: "text", 
      position: { x: 150 + offset, y: 150 + offset }, 
      updatedAt: serverTimestamp() 
    }); 
  };

  const onNodeDragStop: NodeMouseHandler = async (_, node) => { 
    await updateDoc(doc(db, "flowRules", node.id), { position: node.position }); 
  };

  // 👉 解決 1：攔截鍵盤 Delete/Backspace 刪除節點
  const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
    for (const node of deletedNodes) {
      await deleteDoc(doc(db, "flowRules", node.id));
      if (node.id === selectedNodeId) {
        setIsPanelOpen(false);
        setSelectedNodeId(null);
      }
    }
  }, [selectedNodeId]);

  // 👉 解決 2：統一關閉面板的行為 (先滑走，再清空資料)
  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedNodeId(null), 300); // 配合 CSS duration-300
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
          onNodeClick={(_, n) => { setSelectedNodeId(n.id); setIsPanelOpen(true); }} 
          onNodeDragStop={onNodeDragStop} 
          onPaneClick={handleClosePanel} 
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#475569" className="opacity-30" />
          <Controls className="bg-slate-800 fill-white border-none shadow-2xl" />
        </ReactFlow>
      </div>

      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 z-20 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <NodeEditPanel nodeId={selectedNodeId} onClose={handleClosePanel} />
      </div>
    </div>
  );
}
