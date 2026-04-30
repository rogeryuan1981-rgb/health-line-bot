import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, 
  Node, Edge, BackgroundVariant, Connection, ConnectionMode, MarkerType,
  Handle, Position, useReactFlow, ReactFlowProvider, NodeProps,
  NodeResizer 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, writeBatch, query, orderBy, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import NodeEditPanel from '../message-form/NodeEditPanel';
import EdgeEditPanel from '../message-form/EdgeEditPanel';
import { Plus, Flag, Magnet, Save, History, Download, X, BoxSelect } from 'lucide-react';

const CustomNode = ({ data, isConnectable }: any) => (
  <div className="w-full h-full relative">
    <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
    <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
    <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
    <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      {data.label}
    </div>
  </div>
);

const GroupNode = ({ data, selected }: NodeProps) => (
  <>
    <NodeResizer 
      color="#deff9a" 
      isVisible={selected} 
      minWidth={150} 
      minHeight={100} 
      handleClassName="w-3 h-3 bg-white border-2 border-[#deff9a] rounded-full"
    />
    <div className={`w-full h-full border-2 border-dashed rounded-3xl relative transition-all ${data.color || 'border-slate-500/50 bg-slate-500/5'}`}>
      <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-2 z-50 ${data.labelColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
        {data.title || '未命名區塊'}
      </div>
    </div>
  </>
);

const nodeTypes = { custom: CustomNode, group: GroupNode };

function FlowContent() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activePanel, setActivePanel] = useState<'node' | 'edge' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { getViewport } = useReactFlow();

  const getNodeStyle = (type: string, isStart: boolean) => {
    if (isStart) return 'bg-slate-900 border-yellow-400 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-[3px]';
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
        if (data.messageType === 'group_box') {
          return {
            id: d.id,
            type: 'group',
            position: data.position || { x: 0, y: 0 },
            style: { width: data.width || 400, height: data.height || 300 },
            data: { 
                title: data.nodeName, 
                color: data.customLabel === '已完成' ? 'border-emerald-500/50 bg-emerald-500/5' : data.customLabel === '待處理' ? 'border-amber-500/50 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5',
                labelColor: data.customLabel === '已完成' ? 'bg-emerald-600 text-white border-emerald-400' : data.customLabel === '待處理' ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400'
            },
            zIndex: -1,
          };
        }
        const isStart = data.nodeName === '預設回覆'; 
        return {
          id: d.id, type: 'custom', position: data.position || { x: 100, y: 100 },
          parentNode: data.parentNode || undefined,
          data: { label: (
            <>
              {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl animate-bounce border-2 border-black z-50">🚀 START</div>}
              <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-4 mb-2">
                {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                <span className="line-clamp-2 leading-snug break-words text-center">{data.nodeName || '新節點'}</span>
              </div>
              {data.customLabel && (
                <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 max-w-[85px] truncate">
                  {data.customLabel}
                </div>
              )}
              <div className={`absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shadow-sm ${isStart ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-black/40 text-white/80 border-white/10'}`}>
                {data.messageType}
              </div>
            </>
          )},
          className: `border-2 shadow-2xl rounded-2xl w-[200px] h-[80px] transition-all duration-300 ${getNodeStyle(data.messageType, isStart)}`
        };
      }));
    });

    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => {
        const data = d.data();
        const arrowDir = data.arrowDirection || 'forward';
        const markerConfig = { type: MarkerType.ArrowClosed, color: data.color || '#deff9a' };
        return { 
          id: d.id, source: data.source, target: data.target, sourceHandle: data.sourceHandle, targetHandle: data.targetHandle, type: data.pathType || 'smoothstep', animated: data.dashed !== false, 
          style: { stroke: data.color || '#deff9a', strokeWidth: data.strokeWidth || 2, strokeDasharray: data.dashed ? '5 5' : '' },
          markerEnd: (arrowDir === 'forward' || arrowDir === 'both') ? markerConfig : undefined,
          markerStart: (arrowDir === 'backward' || arrowDir === 'both') ? markerConfig : undefined,
        };
      }));
    });

    const unsubSnaps = onSnapshot(query(collection(db, "flowSnapshots"), orderBy("createdAt", "desc")), (snap) => {
        setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubNodes(); unsubEdges(); unsubSnaps(); };
  }, []);

  const addNewNode = async () => {
    const { x, y, zoom } = getViewport();
    const centerX = (window.innerWidth / 2 - x) / zoom;
    const centerY = (window.innerHeight / 2 - y) / zoom;
    await addDoc(collection(db, "flowRules"), { nodeName: "新關鍵字", messageType: "text", position: { x: centerX - 100, y: centerY - 40 }, updatedAt: serverTimestamp() });
  };

  const addGroupBox = async () => {
    const { x, y, zoom } = getViewport();
    const centerX = (window.innerWidth / 2 - x) / zoom;
    const centerY = (window.innerHeight / 2 - y) / zoom;
    await addDoc(collection(db, "flowRules"), { 
        nodeName: "新區塊", messageType: "group_box", customLabel: "規劃中", width: 400, height: 300, position: { x: centerX - 200, y: centerY - 150 }, updatedAt: serverTimestamp() 
    });
  };

  const handleOpenSaveModal = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setSaveName(`自動回覆設定_${today}`);
    setShowSaveModal(true);
  };

  const executeSave = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
        const nodeSnaps = await getDocs(collection(db, "flowRules"));
        const edgeSnaps = await getDocs(collection(db, "flowEdges"));
        await addDoc(collection(db, "flowSnapshots"), {
            name: saveName.trim(),
            nodes: nodeSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
            edges: edgeSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
            createdAt: serverTimestamp()
        });
        setShowSaveModal(false);
        alert("✅ 版本已成功存檔！");
    } catch (e) { alert("儲存失敗"); } finally { setIsSaving(false); }
  };

  const loadSnapshot = async (snap: any) => {
    if (!window.confirm(`載入「${snap.name}」？`)) return;
    const batch = writeBatch(db);
    const nodeS = await getDocs(collection(db, "flowRules"));
    const edgeS = await getDocs(collection(db, "flowEdges"));
    nodeS.forEach(d => batch.delete(d.ref));
    edgeS.forEach(d => batch.delete(d.ref));
    snap.nodes.forEach((n: any) => { const { id, ...rest } = n; batch.set(doc(db, "flowRules", id), rest); });
    snap.edges.forEach((e: any) => { const { id, ...rest } = e; batch.set(doc(db, "flowEdges", id), rest); });
    await batch.commit();
    setShowSnapshots(false);
    alert("✅ 版本載入成功！");
  };

  return (
    <>
      {showSaveModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-96 flex flex-col gap-5 animate-in zoom-in-95">
            <div>
                <h3 className="font-black text-[#deff9a] text-lg tracking-widest mb-1 flex items-center gap-2"><Save size={18} /> 儲存目前版本</h3>
                <p className="text-xs text-slate-400">請設定存檔名稱：</p>
            </div>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)} className="w-full bg-slate-800 text-white border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" autoFocus />
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowSaveModal(false)} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">取消</button>
              <button onClick={executeSave} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-[#deff9a] text-black font-black text-xs">{isSaving ? "處理中..." : "確定儲存"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
          <button onClick={addNewNode} className="bg-[#deff9a] text-black px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Plus size={20} /> ADD NODE</button>
          <button onClick={addGroupBox} className="bg-white/10 text-white px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"><BoxSelect size={20} /> ADD GROUP</button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${snapToGrid ? 'bg-slate-800 text-[#deff9a] border-[#deff9a]/30 shadow-lg' : 'bg-slate-900/50 text-slate-500 border-transparent hover:bg-slate-800'}`}><Magnet size={14}/> 磁吸對齊 {snapToGrid ? 'ON' : 'OFF'}</button>
          <div className="h-px bg-white/5 my-2 w-full"></div>
          <button onClick={handleOpenSaveModal} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors"><Save size={14}/> 儲存版本</button>
          <button onClick={() => setShowSnapshots(!showSnapshots)} className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl shadow-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"><History size={14}/> 歷史紀錄</button>
      </div>

      {showSnapshots && (
          <div className="absolute top-56 left-8 z-50 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 bg-slate-800/50 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-tighter">SAVED VERSIONS</span>
                  <button onClick={() => setShowSnapshots(false)}><X size={14} className="text-slate-500"/></button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                  {snapshots.map(snap => (
                      <div key={snap.id} className="p-3 bg-slate-950/50 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer flex justify-between items-center" onClick={() => loadSnapshot(snap)}>
                          <div className="flex flex-col"><span className="text-xs text-white font-bold truncate max-w-[160px]">{snap.name}</span><span className="text-[9px] text-slate-500">{snap.createdAt?.toDate().toLocaleString()}</span></div>
                          <Download size={14} className="text-[#deff9a] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                  ))}
              </div>
          </div>
      )}

      <ReactFlow 
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
        onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} 
        onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
        onEdgeUpdate={useCallback(async (oldEdge: Edge, newConnection: Connection) => {
          try {
            await updateDoc(doc(db, "flowEdges", oldEdge.id), {
              source: newConnection.source, target: newConnection.target, sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle, updatedAt: serverTimestamp()
            });
          } catch (e) { console.error(e); }
        }, [])}
        onConnect={useCallback(async (p: Connection) => { 
          await addDoc(collection(db, "flowEdges"), { ...p, color: '#deff9a', strokeWidth: 2, dashed: true, arrowDirection: 'forward', pathType: 'smoothstep', createdAt: serverTimestamp() }); 
        }, [])} 
        onNodesDelete={useCallback(async (dn: Node[]) => { for (const n of dn) await deleteDoc(doc(db, "flowRules", n.id)); }, [])} 
        onEdgesDelete={useCallback(async (de: Edge[]) => { for (const e of de) await deleteDoc(doc(db, "flowEdges", e.id)); }, [])} 
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }} 
        onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }} 
        onPaneClick={() => { setActivePanel(null); setSelectedId(null); }} 
        onNodeDragStop={async (_, n) => { 
            if (n.type === 'group') {
                const up: any = { position: n.position };
                up.width = n.width || n.style?.width;
                up.height = n.height || n.style?.height;
                await updateDoc(doc(db, "flowRules", n.id), up); 
            } else {
                const absX = n.positionAbsolute?.x || n.position.x;
                const absY = n.positionAbsolute?.y || n.position.y;
                const centerX = absX + 100;
                const centerY = absY + 40;
                const targetGroup = nodes.find(g => {
                    if (g.type !== 'group') return false;
                    const gX = g.position.x; const gY = g.position.y;
                    const gW = parseInt(g.style?.width as string) || 400;
                    const gH = parseInt(g.style?.height as string) || 300;
                    return centerX >= gX && centerX <= gX + gW && centerY >= gY && centerY <= gY + gH;
                });
                if (targetGroup) {
                    await updateDoc(doc(db, "flowRules", n.id), { parentNode: targetGroup.id, position: { x: absX - targetGroup.position.x, y: absY - targetGroup.position.y }, updatedAt: serverTimestamp() });
                } else {
                    await updateDoc(doc(db, "flowRules", n.id), { parentNode: deleteField(), position: { x: absX, y: absY }, updatedAt: serverTimestamp() });
                }
            }
        }} 
        connectionMode={ConnectionMode.Loose} deleteKeyCode={["Backspace", "Delete"]} snapToGrid={snapToGrid} snapGrid={[20, 20]} fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
        <Controls />
      </ReactFlow>

      <div className={`absolute right-0 top-0 h-full transition-all duration-500 z-50 ${activePanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        {activePanel === 'node' && <NodeEditPanel nodeId={selectedId} onClose={() => { setActivePanel(null); setSelectedId(null); }} />}
        {activePanel === 'edge' && <EdgeEditPanel edgeId={selectedId} onClose={() => { setActivePanel(null); setSelectedId(null); }} />}
      </div>
    </>
  );
}

export default function FlowEditor() {
  return (
    <div className="w-full h-full relative bg-[#020617] flex overflow-hidden font-sans">
      <ReactFlowProvider><FlowContent /></ReactFlowProvider>
    </div>
  );
}
