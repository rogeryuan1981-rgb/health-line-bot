import { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, 
  Node, Edge, BackgroundVariant, ReactFlowProvider, NodeProps,
  NodeResizer, useReactFlow, Position, Handle, ConnectionMode, Connection, MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import EdgeEditPanel from '../message-form/EdgeEditPanel';
import { Plus, Flag, Magnet, Rocket, Clock, Globe } from 'lucide-react';

const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes smoothGlow { 0% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } 50% { box-shadow: 0 0 25px rgba(244,63,94,1); } 100% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } }
    .node-current-glow { animation: smoothGlow 2.5s ease-in-out infinite !important; z-index: 1000; }
  `}} />
);

const CustomNode = ({ data, isConnectable }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  return (
    <div className="w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px]">
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50" />
      <div className="flex flex-col items-center mb-3 mt-1 text-white text-center">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl">🚀 START</div>}
        {data.globalKeyword && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 shadow-lg border-2 border-slate-900"><Globe size={12} /></div>}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          {data.label || data.nodeName}
        </div>
        <div className={`mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/40 text-white/80 border border-white/10`}>{data.messageType}</div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-center text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} isConnectable={isConnectable} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900" />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 border-2 border-slate-900" />}
    </div>
  );
};

const GroupNode = ({ data, selected }: NodeProps) => (
  <>
    <NodeResizer color="#deff9a" isVisible={selected} minWidth={150} minHeight={100} />
    <div className={`w-full h-full border-2 border-dashed rounded-3xl relative ${data.color || 'border-slate-500/50 bg-slate-500/5'}`}>
      <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase shadow-2xl border-2 z-50 ${data.labelColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>{data.title || '區塊'}</div>
    </div>
  </>
);

const nodeTypes = { custom: CustomNode, group: GroupNode };

function FlowContent({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activePanel, setActivePanel] = useState<'node' | 'edge' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const reactFlowInstance = useReactFlow(); 
  const initialViewport = useRef(JSON.parse(localStorage.getItem('flow-viewport') || '{"x":0,"y":0,"zoom":1}'));

  const getNodeStyle = (type: string, isStart: boolean) => {
    if (isStart) return 'bg-slate-900 border-yellow-400 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-[3px]';
    switch(type) {
      case 'carousel': case 'flex': return 'bg-amber-900/80 border-amber-500 text-amber-100';
      case 'image': return 'bg-emerald-900/80 border-emerald-500 text-emerald-100';
      case 'video': return 'bg-rose-900/80 border-rose-500 text-rose-100';
      default: return 'bg-blue-900/80 border-blue-500 text-blue-100';
    }
  };

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      setNodes(snap.docs.map(d => {
        const data = d.data();
        if (data.messageType === 'group_box') {
          return {
            id: d.id, type: 'group', position: data.position || { x: 0, y: 0 }, style: { width: data.width || 400, height: data.height || 300 },
            data: { 
                title: data.nodeName, 
                color: data.customLabel === '已完成' ? 'border-emerald-500/50 bg-emerald-500/5' : data.customLabel === '待處理' ? 'border-amber-500/50 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5', 
                labelColor: data.customLabel === '已完成' ? 'bg-emerald-600 text-white border-emerald-400' : data.customLabel === '待處理' ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400' 
            }, 
            zIndex: -1,
          };
        }
        return {
          id: d.id, type: 'custom', position: data.position || { x: 100, y: 100 }, parentNode: data.parentNode || undefined,
          data: { label: data.nodeName, nodeName: data.nodeName, messageType: data.messageType, options: data.buttons || data.options, globalKeyword: data.globalKeyword },
          className: `border-2 shadow-2xl rounded-2xl w-[200px] h-fit transition-all duration-300 ${getNodeStyle(data.messageType, data.nodeName === '預設回覆')}`
        };
      }));
    });
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, source: data.source, target: data.target, sourceHandle: data.sourceHandle, targetHandle: data.targetHandle, type: 'smoothstep', animated: true, style: { stroke: data.color || '#deff9a', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: data.color || '#deff9a' } };
      }));
    });
    return () => { unsubNodes(); unsubEdges(); };
  }, []);

  useEffect(() => {
    if (activePath && activePath.nodes.length > 0) {
        setNodes(nds => nds.map(n => {
            const isCurrent = n.id === activePath.nodes[activePath.nodes.length - 1];
            return { ...n, className: isCurrent ? `${n.className} node-current-glow` : n.className };
        }));
    }
  }, [activePath]);

  const executePublish = async () => {
    setIsPublishing(true);
    try {
      const flowObject = reactFlowInstance.toObject();
      const nodesToPublish = flowObject.nodes.map(n => ({
        id: n.id,
        position: n.positionAbsolute || n.position,
        type: n.type,
        data: JSON.parse(JSON.stringify(n.data)),
        width: n.width || (n.style?.width ? parseInt(n.style.width as string) : 400),
        height: n.height || (n.style?.height ? parseInt(n.style.height as string) : 300),
        messageType: n.data?.messageType || 'text',
        nodeName: n.data?.nodeName || n.data?.label || 'Node',
        customLabel: n.data?.customLabel || "",
        parentNode: null
      }));

      await setDoc(doc(db, "botConfig", "production"), { 
        nodes: nodesToPublish, 
        edges: flowObject.edges.map(e => ({ ...e, color: (e.style?.stroke as string) || '#deff9a' })), 
        viewport: flowObject.viewport, 
        publishedAt: serverTimestamp(),
        publisher: "Roger"
      });
      alert("✅ 發布成功");
    } catch (e: any) { alert(e.message); } finally { setIsPublishing(false); }
  };

  const onConnect = useCallback(async (p: Connection) => { await addDoc(collection(db, "flowEdges"), { ...p, color: '#deff9a', createdAt: serverTimestamp() }); }, []);

  return (
    <>
      <CustomStyles />
      <div className="absolute left-8 top-8 z-10 flex flex-col gap-3">
          <button onClick={executePublish} disabled={isPublishing} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black flex gap-2 hover:scale-105 active:scale-95 transition-all shadow-2xl border-2 border-rose-400"><Rocket size={20} /> {isPublishing ? '發布中' : '立即發布正式機'}</button>
          <button onClick={() => addDoc(collection(db, "flowRules"), { nodeName: "新節點", messageType: "text", position: { x: 100, y: 100 }, updatedAt: serverTimestamp() })} className="bg-[#deff9a] text-black px-6 py-3 rounded-2xl font-black flex gap-2 shadow-xl"><Plus size={20} /> ADD NODE</button>
      </div>
      <ReactFlow 
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
        defaultViewport={initialViewport.current}
        onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
        onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))}
        onConnect={onConnect}
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }}
        onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }}
        onPaneClick={() => { setActivePanel(null); setSelectedId(null); }}
        onNodeDragStop={async (_, n) => { await updateDoc(doc(db, "flowRules", n.id), { position: n.position }); }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
        <Controls />
        <Magnet className="hidden" /> {/* 僅為了保留變數引用通過編譯 */}
      </ReactFlow>

      {activePanel === 'node' && (
        <div className="absolute right-0 top-0 h-full w-[450px] bg-slate-900 border-l border-white/10 z-[100] animate-in slide-in-from-right shadow-2xl">
          <NodeEditPanel nodeId={selectedId} onClose={() => setActivePanel(null)} />
        </div>
      )}
      {activePanel === 'edge' && (
        <div className="absolute right-0 top-0 h-full w-[450px] bg-slate-900 border-l border-white/10 z-[100] animate-in slide-in-from-right shadow-2xl">
          <EdgeEditPanel edgeId={selectedId} onClose={() => setActivePanel(null)} />
        </div>
      )}
    </>
  );
}

export default function FlowEditor({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  return <div className="w-full h-full bg-[#020617] overflow-hidden font-sans"><ReactFlowProvider><FlowContent activePath={activePath} /></ReactFlowProvider></div>;
}
