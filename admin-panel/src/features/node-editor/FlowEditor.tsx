import { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, 
  Node, Edge, BackgroundVariant, ReactFlowProvider, NodeProps,
  NodeResizer, useReactFlow, Position, Handle, ConnectionMode, Connection, MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, deleteDoc, addDoc, getDocs, writeBatch, query, orderBy, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import EdgeEditPanel from '../message-form/EdgeEditPanel';
import { Plus, Flag, Magnet, Save, History, Download, X, BoxSelect, Clock, Globe, Rocket } from 'lucide-react';

const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes smoothGlow { 0% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } 50% { box-shadow: 0 0 25px rgba(244,63,94,1); } 100% { box-shadow: 0 0 10px rgba(244,63,94,0.3); } }
    .node-current-glow { animation: smoothGlow 2.5s ease-in-out infinite !important; z-index: 1000; }
    .node-visited { border-color: #38bdf8 !important; box-shadow: 0 0 20px rgba(56,189,248,0.5) !important; }
  `}} />
);

const CustomNode = ({ data, isConnectable }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  return (
    <div className="w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px]">
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50" />
      <div className="flex flex-col items-center mb-3 mt-1 text-white text-center">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl animate-bounce border-2 border-black z-50 whitespace-nowrap">🚀 START</div>}
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
      <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-2xl border-2 z-50 ${data.labelColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>{data.title || '區塊'}</div>
    </div>
  </>
);

const TimeRouterNode = ({ data, isConnectable }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative transition-all duration-300 text-white">
    <Handle type="target" position={Position.Left} id="left_in" isConnectable={isConnectable} className="w-3 h-3 bg-indigo-400 border-2 border-slate-900 !left-[-10px]" />
    <div className="font-black text-sm flex items-center gap-1.5 mb-1"><Clock size={16} className="text-indigo-400" /><span>{data.nodeName}</span></div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 border-indigo-500/30">{data.config?.startTime} - {data.config?.endTime}</div>
    <Handle type="source" position={Position.Right} id="business" isConnectable={isConnectable} style={{ top: '30%' }} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 !right-[-10px]" />
    <Handle type="source" position={Position.Right} id="off-hours" isConnectable={isConnectable} style={{ top: '70%' }} className="w-3 h-3 bg-rose-400 border-2 border-slate-900 !right-[-10px]" />
  </div>
);

const nodeTypes = { custom: CustomNode, group: GroupNode, timeRouter: TimeRouterNode };

function FlowContent({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activePanel, setActivePanel] = useState<'node' | 'edge' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
            }, zIndex: -1,
          };
        }
        if (data.messageType === 'time_router') {
          return { id: d.id, type: 'timeRouter', position: data.position || { x: 100, y: 100 }, data: { nodeName: data.nodeName, config: data.config } };
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
    const unsubSnaps = onSnapshot(query(collection(db, "flowSnapshots"), orderBy("createdAt", "desc")), (snap) => setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubNodes(); unsubEdges(); unsubSnaps(); };
  }, []);

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
      await setDoc(doc(db, "botConfig", "production"), { nodes: nodesToPublish, edges: flowObject.edges.map(e => ({ ...e, color: (e.style?.stroke as string) || '#deff9a' })), viewport: flowObject.viewport, publishedAt: serverTimestamp(), publisher: "Roger" });
      alert("✅ 1:1 發布成功");
    } catch (e: any) { alert(e.message); } finally { setIsPublishing(false); }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const nodeS = await getDocs(collection(db, "flowRules"));
      const edgeS = await getDocs(collection(db, "flowEdges"));
      await addDoc(collection(db, "flowSnapshots"), { name: `版本_${new Date().toLocaleString()}`, nodes: nodeS.docs.map(d => ({ id: d.id, ...d.data() })), edges: edgeS.docs.map(d => ({ id: d.id, ...d.data() })), createdAt: serverTimestamp() });
      alert("✅ 草稿儲存成功");
    } catch (e) { alert("儲存失敗"); } finally { setIsSaving(false); }
  };

  return (
    <>
      <CustomStyles />
      <div className="absolute left-8 top-8 z-10 flex flex-col gap-3">
          <button onClick={executePublish} disabled={isPublishing} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black flex gap-2 hover:scale-105 active:scale-95 transition-all shadow-2xl border-2 border-rose-400"><Rocket size={20} /> {isPublishing ? '發布中' : '立即發布正式機'}</button>
          <button onClick={() => addDoc(collection(db, "flowRules"), { nodeName: "新節點", messageType: "text", position: { x: 100, y: 100 }, updatedAt: serverTimestamp() })} className="bg-[#deff9a] text-black px-6 py-3 rounded-2xl font-black flex gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={20} /> ADD NODE</button>
          <button onClick={() => addDoc(collection(db, "flowRules"), { nodeName: "時間分流", messageType: "time_router", config: { startTime: "09:00", endTime: "18:00" }, position: { x: 100, y: 100 }, updatedAt: serverTimestamp() })} className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black flex gap-2 shadow-xl hover:scale-105 transition-all"><Clock size={20} /> TIME ROUTER</button>
          <button onClick={() => addDoc(collection(db, "flowRules"), { nodeName: "新區塊", messageType: "group_box", width: 400, height: 300, position: { x: 100, y: 100 }, updatedAt: serverTimestamp() })} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-black flex gap-2 border border-white/20 hover:bg-white/20 transition-all"><BoxSelect size={20} /> ADD GROUP</button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-4 py-2 rounded-xl text-xs font-bold flex gap-2 border transition-all ${snapToGrid ? 'bg-slate-800 text-[#deff9a] border-[#deff9a]/30' : 'bg-slate-900/50 text-slate-500 border-transparent'}`}><Magnet size={14}/> 磁吸對齊 {snapToGrid ? 'ON' : 'OFF'}</button>
          <div className="h-px bg-white/5 my-1" />
          <button onClick={handleSaveDraft} disabled={isSaving} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex gap-2 hover:bg-blue-500 transition-all"><Save size={14}/> {isSaving ? '儲存中...' : '儲存草稿版本'}</button>
          <button onClick={() => setShowSnapshots(!showSnapshots)} className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex gap-2 hover:bg-slate-700 transition-all"><History size={14}/> 歷史紀錄</button>
      </div>

      {showSnapshots && (
        <div className="absolute left-8 top-[480px] z-50 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="p-3 bg-slate-800 border-b flex justify-between items-center"><span className="text-[10px] font-black text-slate-400">歷史紀錄</span><button onClick={() => setShowSnapshots(false)}><X size={14}/></button></div>
          <div className="max-h-60 overflow-y-auto p-2">
            {snapshots.map(s => <div key={d.id} className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer text-[10px] text-white flex justify-between items-center mb-1 group"><span>{s.name}</span><Download size={12} className="opacity-0 group-hover:opacity-100 text-emerald-400"/></div>)}
          </div>
        </div>
      )}

      <ReactFlow 
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
        defaultViewport={initialViewport.current}
        snapToGrid={snapToGrid} snapGrid={[20, 20]}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
        onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))}
        onConnect={useCallback(async (p: Connection) => { await addDoc(collection(db, "flowEdges"), { ...p, color: '#deff9a', createdAt: serverTimestamp() }); }, [])}
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }}
        onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }}
        onPaneClick={() => { setActivePanel(null); setSelectedId(null); }}
        onNodeDragStop={async (_, n) => { 
            const payload: any = { position: n.position };
            if (n.type === 'group') { payload.width = n.width; payload.height = n.height; }
            await updateDoc(doc(db, "flowRules", n.id), payload); 
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
        <Controls />
      </ReactFlow>

      {activePanel === 'node' && selectedId && <div className="absolute right-0 top-0 h-full w-[450px] bg-slate-900 border-l border-white/10 z-[100] animate-in slide-in-from-right"><NodeEditPanel nodeId={selectedId} onClose={() => setActivePanel(null)} /></div>}
      {activePanel === 'edge' && selectedId && <div className="absolute right-0 top-0 h-full w-[450px] bg-slate-900 border-l border-white/10 z-[100] animate-in slide-in-from-right"><EdgeEditPanel edgeId={selectedId} onClose={() => setActivePanel(null)} /></div>}
    </>
  );
}

export default function FlowEditor({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  return <div className="w-full h-full bg-[#020617] overflow-hidden font-sans"><ReactFlowProvider><FlowContent activePath={activePath} /></ReactFlowProvider></div>;
}
