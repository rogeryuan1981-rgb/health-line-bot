import { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, 
  Node, Edge, BackgroundVariant, ReactFlowProvider, NodeProps,
  NodeResizer, useReactFlow, Position, Handle, ConnectionMode, Connection, MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, deleteDoc, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
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

export const getNodeStyle = (type: string = '', isStart: boolean) => {
  if (isStart) return 'bg-slate-900 border-yellow-400 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-[3px]';
  const t = String(type).toLowerCase().trim();
  if (['carousel', 'flex'].includes(t)) return 'bg-amber-900/80 border-amber-500 text-amber-100 shadow-amber-900/50';
  if (['image', 'photo'].includes(t)) return 'bg-emerald-900/80 border-emerald-500 text-emerald-100 shadow-emerald-900/50';
  if (['video'].includes(t)) return 'bg-rose-900/80 border-rose-500 text-rose-100 shadow-rose-900/50';
  return 'bg-blue-900/80 border-blue-500 text-blue-100 shadow-blue-900/50';
};

const CustomNode = ({ data, isConnectable }: any) => {
  const options = data.options || data.buttons || [];
  const isStart = data.nodeName === '預設回覆';
  return (
    <div className={`w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px] rounded-2xl border-2 transition-all ${getNodeStyle(data.messageType, isStart)}`}>
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform !left-[-10px]" />
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
            <Handle type="source" position={Position.Right} id={`opt_${index}`} isConnectable={isConnectable} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 hover:scale-150 transition-transform !right-[-10px]" />
          </div>
        ))}
      </div>
      {options.length === 0 && <Handle type="source" position={Position.Right} id="default_out" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 border-2 border-slate-900 z-50 hover:scale-150 transition-transform !right-[-10px]" />}
    </div>
  );
};

const GroupNode = ({ data, selected }: NodeProps) => {
  const isDone = data.customLabel === '已完成';
  const isTodo = data.customLabel === '待處理';
  const bgColor = isDone ? 'bg-emerald-500/5 border-emerald-500/50' : isTodo ? 'bg-amber-500/5 border-amber-500/50' : 'bg-blue-500/5 border-blue-500/30';
  const labelColor = isDone ? 'bg-emerald-600 text-white border-emerald-400' : isTodo ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400';
  return (
    <>
      <NodeResizer color="#deff9a" isVisible={selected} minWidth={150} minHeight={100} />
      <div className={`w-full h-full border-2 border-dashed rounded-3xl relative transition-all ${bgColor}`}>
        <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-2xl border-2 z-50 ${labelColor}`}>{data.title || '區塊'}</div>
      </div>
    </>
  );
};

const TimeRouterNode = ({ data, isConnectable }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative transition-all duration-300 text-white text-center">
    <Handle type="target" position={Position.Left} id="left_in" isConnectable={isConnectable} className="w-3 h-3 bg-indigo-400 border-2 border-slate-900 z-50 !left-[-10px]" />
    <div className="font-black text-sm flex items-center justify-center gap-1.5 mb-1 w-full"><Clock size={16} className="text-indigo-400" /><span>{data.nodeName}</span></div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 border-indigo-500/30">{data.config?.startTime || '09:00'} - {data.config?.endTime || '18:00'}</div>
    <Handle type="source" position={Position.Right} id="business" isConnectable={isConnectable} style={{ top: '30%' }} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 !right-[-10px]" />
    <Handle type="source" position={Position.Right} id="off-hours" isConnectable={isConnectable} style={{ top: '70%' }} className="w-3 h-3 bg-rose-400 border-2 border-slate-900 z-50 !right-[-10px]" />
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const reactFlowInstance = useReactFlow(); 
  const initialViewport = useRef(JSON.parse(localStorage.getItem('flow-viewport') || '{"x":0,"y":0,"zoom":1}'));

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, "flowRules"), (snap) => {
      const validNodeIds = new Set(snap.docs.map(d => d.id));

      let parsedNodes = snap.docs.map(d => {
        const data = d.data();
        let base: any = { id: d.id, position: data.position || { x: 100, y: 100 } };

        if (data.messageType === 'group_box') {
          base.type = 'group';
          base.style = { width: data.width || 400, height: data.height || 300 };
          base.data = { ...data, title: data.nodeName, customLabel: data.customLabel };
          base.zIndex = -1;
        } else if (data.messageType === 'time_router') {
          base.type = 'timeRouter';
          base.data = { ...data };
        } else {
          base.type = 'custom';
          base.data = { ...data, label: data.nodeName };
        }

        if (data.parentNode && validNodeIds.has(data.parentNode)) {
            base.parentNode = data.parentNode;
        }
        return base;
      });

      // 修正 TS6133 錯誤：將未使用的變數 'b' 改為 '_' 
      parsedNodes.sort((a, _) => (a.type === 'group' ? -1 : 1));
      setNodes(parsedNodes);
    });
    
    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      const uniqueEdges = new Map();
      const duplicateIds: string[] = [];

      snap.docs.forEach(d => {
          const data = d.data();
          const key = `${data.source}_${data.sourceHandle || 'none'}_${data.target}_${data.targetHandle || 'none'}`;
          
          if (uniqueEdges.has(key)) {
              const existing = uniqueEdges.get(key);
              const existingTime = existing.createdAt?.toMillis?.() || 0;
              const newTime = data.createdAt?.toMillis?.() || 0;
              
              const isNewer = (newTime === 0 && existingTime !== 0) || (newTime > existingTime);

              if (isNewer) {
                  duplicateIds.push(existing.id);
                  uniqueEdges.set(key, { id: d.id, ...data });
              } else {
                  duplicateIds.push(d.id);
              }
          } else {
              uniqueEdges.set(key, { id: d.id, ...data });
          }
      });

      duplicateIds.forEach(id => deleteDoc(doc(db, "flowEdges", id)).catch(() => {}));

      setEdges(Array.from(uniqueEdges.values()).map(data => {
        const edgeObj: any = {
            id: data.id, source: data.source, target: data.target,
            type: data.pathType || 'smoothstep', animated: data.dashed !== false,
            style: { stroke: data.color || '#deff9a', strokeWidth: Number(data.strokeWidth) || 2, strokeDasharray: data.dashed ? '5 5' : 'none' }
        };
        if (data.sourceHandle) edgeObj.sourceHandle = data.sourceHandle;
        if (data.targetHandle) edgeObj.targetHandle = data.targetHandle;
        if (data.arrowDirection && data.arrowDirection !== 'none') {
            if (data.arrowDirection !== 'backward') edgeObj.markerEnd = { type: MarkerType.ArrowClosed, color: data.color || '#deff9a' };
            if (data.arrowDirection === 'backward' || data.arrowDirection === 'dual') edgeObj.markerStart = { type: MarkerType.ArrowClosed, color: data.color || '#deff9a' };
        }
        return edgeObj;
      }));
    });
    
    const unsubSnaps = onSnapshot(query(collection(db, "flowSnapshots"), orderBy("createdAt", "desc")), (snap) => setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubNodes(); unsubEdges(); unsubSnaps(); };
  }, []);

  useEffect(() => {
    if (activePath && activePath.nodes.length > 0) {
        setNodes(nds => nds.map(n => {
            const isCurrent = n.id === activePath.nodes[activePath.nodes.length - 1];
            const isVisited = activePath.nodes.includes(n.id) && !isCurrent;
            const clean = (n.className || '').replace(/node-current-glow|node-visited/g, '').trim();
            if (isCurrent) return { ...n, className: `${clean} node-current-glow` };
            if (isVisited) return { ...n, className: `${clean} node-visited` };
            return { ...n, className: clean };
        }));
    }
  }, [activePath]);

  const handleNodesChange = useCallback((changes: any) => {
      setNodes((nds) => {
          const updatedNodes = applyNodeChanges(changes, nds);
          const existingIds = new Set(updatedNodes.map(n => n.id));
          return updatedNodes.map(n => {
              if (n.parentNode && !existingIds.has(n.parentNode)) {
                  return { ...n, parentNode: undefined }; 
              }
              return n;
          });
      });
  }, [setNodes]);

  const onNodeDragStop = useCallback(async (_: any, n: Node) => {
      const p: any = { position: n.position };
      if (n.type === 'group') {
          p.width = n.width; p.height = n.height;
      } else {
          const flowNodes = reactFlowInstance.getNodes();
          const getAbs = (node: Node) => node.positionAbsolute || node.position;
          const nAbs = getAbs(n);
          
          const targetGroup = flowNodes.find(g => {
              if (g.type !== 'group' || g.id === n.id) return false;
              const gAbs = getAbs(g);
              const gW = g.width || (g.style?.width as number) || 400;
              const gH = g.height || (g.style?.height as number) || 300;
              
              return nAbs && gAbs && 
                     nAbs.x >= gAbs.x && 
                     nAbs.x <= gAbs.x + gW &&
                     nAbs.y >= gAbs.y && 
                     nAbs.y <= gAbs.y + gH;
          });

          if (targetGroup) {
              const gAbs = getAbs(targetGroup);
              p.parentNode = targetGroup.id;
              p.position = {
                  x: nAbs.x - gAbs.x,
                  y: nAbs.y - gAbs.y
              };
          } else {
              p.parentNode = null; 
              if (n.parentNode && nAbs) {
                  p.position = nAbs; 
              }
          }
      }
      await updateDoc(doc(db, "flowRules", n.id), p);
  }, [reactFlowInstance]);

  const onNodesDelete = useCallback(async (dns: Node[]) => {
      const groupIds = new Set(dns.filter(d => d.type === 'group').map(d => d.id));
      const deletedNodeIds = new Set(dns.map(d => d.id));
      
      const deletePromises = dns.map(n => deleteDoc(doc(db, "flowRules", n.id)));
      await Promise.all(deletePromises);
      
      const edgesSnap = await getDocs(collection(db, "flowEdges"));
      const edgePromises: any[] = [];
      edgesSnap.forEach(d => {
          const data = d.data();
          if (deletedNodeIds.has(data.source) || deletedNodeIds.has(data.target)) {
              edgePromises.push(deleteDoc(doc(db, "flowEdges", d.id)));
          }
      });
      await Promise.all(edgePromises);
      
      if (groupIds.size > 0) {
          const snap = await getDocs(collection(db, "flowRules"));
          const updatePromises: any[] = [];
          for (const docSnap of snap.docs) {
              const data = docSnap.data();
              if (data.parentNode && groupIds.has(data.parentNode)) {
                  updatePromises.push(updateDoc(doc(db, "flowRules", docSnap.id), { parentNode: null }));
              }
          }
          await Promise.all(updatePromises);
      }
  }, []);

  const executePublish = async () => {
    if (!window.confirm("⚠️ 確定要將畫布配置發布到正式機嗎？")) return;
    setIsPublishing(true);
    try {
      const flowObject = reactFlowInstance.toObject();
      const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj));

      const nodesToPublish = flowObject.nodes.map(n => sanitize({
        id: String(n.id),
        position: n.position || { x: 0, y: 0 }, 
        type: String(n.type || 'custom'),
        data: n.data || {},
        width: n.width,
        height: n.height,
        style: n.style,
        parentNode: n.parentNode
      }));

      // 修正 TS6133 錯誤：將未使用的變數 'b' 改為 '_'
      nodesToPublish.sort((a: any, _: any) => (a.type === 'group' ? -1 : 1));

      const edgesToPublish = flowObject.edges.map(e => ({
        id: String(e.id), source: String(e.source), target: String(e.target),
        sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
        type: String(e.type || 'smoothstep'), animated: Boolean(e.animated),
        style: e.style, markerStart: e.markerStart, markerEnd: e.markerEnd
      }));

      const cleanNodes = JSON.parse(JSON.stringify(nodesToPublish));
      const cleanEdges = JSON.parse(JSON.stringify(edgesToPublish));
      const cleanViewport = JSON.parse(JSON.stringify(flowObject.viewport || { x: 0, y: 0, zoom: 1 }));

      await setDoc(doc(db, "botConfig", "production"), { 
          nodes: cleanNodes, edges: cleanEdges, viewport: cleanViewport, 
          publishedAt: serverTimestamp(), publisher: "Roger" 
      });
      alert("🚀 發布成功！幽靈連線已從監測畫面中被清除了！");
    } catch (e: any) { alert(`發布失敗：${e.message}`); } finally { setIsPublishing(false); }
  };

  return (
    <>
      <CustomStyles />
      {showSaveModal && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-96 flex flex-col gap-5 shadow-2xl">
            <div><h3 className="font-black text-[#deff9a] text-lg flex items-center gap-2"><Save size={18} /> 儲存版本</h3><p className="text-xs text-slate-400">輸入存檔名稱：</p></div>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-1 ring-[#deff9a]" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 bg-slate-800 rounded-xl text-xs font-bold text-slate-300">取消</button>
              <button onClick={async () => {
                if (!saveName.trim()) return;
                setIsSavingDraft(true);
                try {
                    const nS = await getDocs(collection(db, "flowRules"));
                    const eS = await getDocs(collection(db, "flowEdges"));
                    await addDoc(collection(db, "flowSnapshots"), { name: saveName.trim(), nodes: nS.docs.map(d => ({ id: d.id, ...d.data() })), edges: eS.docs.map(d => ({ id: d.id, ...d.data() })), createdAt: serverTimestamp() });
                    setShowSaveModal(false); alert("✅ 儲存成功");
                } catch (e) { alert("失敗"); } finally { setIsSavingDraft(false); }
              }} disabled={isSavingDraft} className="flex-1 py-3 bg-[#deff9a] text-black font-black rounded-xl text-xs">{isSavingDraft ? "處理中" : "儲存"}</button>
            </div>
          </div>
        </div>
      )}
      <div className="absolute left-8 top-8 z-10 flex flex-col gap-3">
          <button onClick={executePublish} disabled={isPublishing} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black flex gap-2 hover:scale-105 active:scale-95 transition-all shadow-2xl border-2 border-rose-400"><Rocket size={20} /> {isPublishing ? '發布中' : '立即發布正式機'}</button>
          <button onClick={() => addDoc(collection(db, "flowRules"), { nodeName: "新節點", messageType: "text", position: { x: 100, y: 100 }, updatedAt: serverTimestamp() })} className="bg-[#deff9a] text-black px-6 py-3 rounded-2xl font-black flex gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={20} /> ADD NODE</button>
          <button onClick={() => addDoc(collection(db, "flowRules"), { nodeName: "時間分流", messageType: "time_router", config: { startTime: "09:00", endTime: "18:00" }, position: { x: 100, y: 100 }, updatedAt: serverTimestamp() })} className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black flex gap-2 shadow-xl hover:scale-105 transition-all"><Clock size={20} /> TIME ROUTER</button>
          <button onClick={() => addDoc(collection(db, "flowRules"), { nodeName: "新區塊", messageType: "group_box", width: 400, height: 300, position: { x: 100, y: 100 }, updatedAt: serverTimestamp() })} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-black flex gap-2 border border-white/20 hover:bg-white/20 transition-all"><BoxSelect size={20} /> ADD GROUP</button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-4 py-2 rounded-xl text-xs font-bold flex gap-2 border transition-all ${snapToGrid ? 'bg-slate-800 text-[#deff9a] border-[#deff9a]/30' : 'bg-slate-900/50 text-slate-500 border-transparent'}`}><Magnet size={14}/> 磁吸對齊 {snapToGrid ? 'ON' : 'OFF'}</button>
          <div className="h-px bg-white/5 my-1" />
          <button onClick={() => { setSaveName(`版本_${new Date().toISOString().slice(0, 10)}`); setShowSaveModal(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex gap-2 hover:bg-blue-500 transition-all"><Save size={14}/> 儲存草稿版本</button>
          <button onClick={() => setShowSnapshots(!showSnapshots)} className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex gap-2 hover:bg-slate-700 transition-all"><History size={14}/> 歷史紀錄</button>
      </div>
      {showSnapshots && (
        <div className="absolute left-8 top-[480px] z-50 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="p-3 bg-slate-800 border-b flex justify-between items-center"><span className="text-[10px] font-black text-slate-400">歷史紀錄</span><button onClick={() => setShowSnapshots(false)}><X size={14}/></button></div>
          <div className="max-h-60 overflow-y-auto p-2">
            {snapshots.map(s => <div key={s.id} className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer text-[10px] text-white flex justify-between items-center mb-1 group"><span>{s.name}</span><Download size={12} className="text-emerald-400"/></div>)}
          </div>
        </div>
      )}
      <ReactFlow 
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
        defaultViewport={initialViewport.current}
        snapToGrid={snapToGrid} snapGrid={[20, 20]}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={handleNodesChange} 
        onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))}
        onConnect={useCallback(async (p: Connection) => { await addDoc(collection(db, "flowEdges"), { ...p, type: 'smoothstep', color: '#deff9a', createdAt: serverTimestamp() }); }, [])}
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }}
        onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }}
        onPaneClick={() => { setActivePanel(null); setSelectedId(null); }}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={useCallback(async (des: Edge[]) => { for(const e of des) await deleteDoc(doc(db, "flowEdges", e.id)); }, [])}
        onNodeDragStop={onNodeDragStop}
        onMoveEnd={(_, viewport) => localStorage.setItem('flow-viewport', JSON.stringify(viewport))}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
        <Controls />
      </ReactFlow>
      {activePanel === 'node' && selectedId && <div className="absolute right-0 top-0 h-full w-[450px] bg-slate-900 border-l border-white/10 z-[100] animate-in slide-in-from-right shadow-2xl"><NodeEditPanel nodeId={selectedId} onClose={() => setActivePanel(null)} /></div>}
      {activePanel === 'edge' && selectedId && <div className="absolute right-0 top-0 h-full w-[450px] bg-slate-900 border-l border-white/10 z-[100] animate-in slide-in-from-right shadow-2xl"><EdgeEditPanel edgeId={selectedId} onClose={() => setActivePanel(null)} /></div>}
    </>
  );
}

export default function FlowEditor({ activePath }: { activePath?: { nodes: string[], edges: string[] } }) {
  return <div className="w-full h-full bg-[#020617] overflow-hidden font-sans"><ReactFlowProvider><FlowContent activePath={activePath} /></ReactFlowProvider></div>;
}
