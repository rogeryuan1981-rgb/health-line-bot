import { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, 
  Node, Edge, BackgroundVariant, ReactFlowProvider, NodeProps,
  NodeResizer, useReactFlow, Position, Handle, ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import { Plus, Flag, Magnet, Save, History, Download, X, BoxSelect, Clock, Globe, Rocket } from 'lucide-react';

const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes smoothGlow { 0% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } 50% { box-shadow: 0 0 25px rgba(244,63,94,1); } 100% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } }
    .node-current-glow { animation: smoothGlow 2.5s ease-in-out infinite !important; z-index: 1000; }
  `}} />
);

const CustomNode = ({ data }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  return (
    <div className="w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px]">
      <Handle type="target" position={Position.Left} id="left_in" className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50" />
      <div className="flex flex-col items-center mb-3 mt-1 text-white text-center">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl">🚀 START</div>}
        {data.globalKeyword && <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 shadow-lg border-2 border-slate-900"><Globe size={12} /></div>}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          {data.label || data.nodeName}
        </div>
        <div className="mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/40 text-white/80 border border-white/10">{data.messageType}</div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-300">
            {opt.label}
            <Handle type="source" position={Position.Right} id={`opt_${index}`} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900" />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" className="w-3 h-3 bg-slate-400 border-2 border-slate-900" />}
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
  const [isPublishing, setIsPublishing] = useState(false);
  const reactFlowInstance = useReactFlow(); 

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      setNodes(snap.docs.map(d => {
        const data = d.data();
        if (data.messageType === 'group_box') {
          return {
            id: d.id, type: 'group', position: data.position || { x: 0, y: 0 }, style: { width: data.width || 400, height: data.height || 300 },
            data: { title: data.nodeName, customLabel: data.customLabel }, zIndex: -1,
          };
        }
        return {
          id: d.id, type: 'custom', position: data.position || { x: 100, y: 100 },
          data: { label: data.nodeName, nodeName: data.nodeName, messageType: data.messageType, options: data.buttons || data.options },
          className: `border-2 shadow-2xl rounded-2xl w-[200px] h-fit bg-blue-950/90 border-blue-500`
        };
      }));
    });
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, source: data.source, target: data.target, sourceHandle: data.sourceHandle, targetHandle: data.targetHandle, type: 'smoothstep', animated: true, style: { stroke: data.color || '#deff9a', strokeWidth: 2 } };
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
        parentNode: null
      }));

      await setDoc(doc(db, "botConfig", "production"), { 
        nodes: nodesToPublish, 
        edges: flowObject.edges, 
        viewport: flowObject.viewport, 
        publishedAt: serverTimestamp(),
        publisher: "Roger"
      });
      alert("✅ 1:1 發布成功");
    } catch (e: any) { alert(e.message); } finally { setIsPublishing(false); }
  };

  return (
    <>
      <CustomStyles />
      <div className="absolute left-8 top-8 z-10">
          <button onClick={executePublish} disabled={isPublishing} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black flex gap-2 hover:scale-105 active:scale-95 transition-all shadow-2xl"><Rocket size={20} /> {isPublishing ? '發布中' : '立即發布正式機'}</button>
      </div>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose} onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))}>
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
        <Controls />
      </ReactFlow>
    </>
  );
}

export default function FlowEditor({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  return <div className="w-full h-full bg-[#020617] overflow-hidden font-sans"><ReactFlowProvider><FlowContent activePath={activePath} /></ReactFlowProvider></div>;
}
