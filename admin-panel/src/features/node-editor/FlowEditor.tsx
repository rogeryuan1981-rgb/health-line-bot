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
import { Plus, Flag, Magnet, Save, History, Download, X, BoxSelect, Clock, Globe } from 'lucide-react';

// --- 子組件：標準訊息節點 (已升級動態高度與自動包覆) ---
const CustomNode = ({ data, isConnectable }: any) => {
  const options = data.options || [];
  const isStart = data.nodeName === '預設回覆';

  return (
    <div className="w-full relative flex flex-col justify-between py-3 px-2 min-h-[80px]">
      <Handle type="target" position={Position.Left} id="left_in" isConnectable={isConnectable} className="w-3 h-3 bg-[#deff9a] border-2 border-slate-900 z-50 hover:scale-150 transition-transform !left-[-10px]" />
      
      <div className="flex flex-col items-center mb-3 mt-1">
        {isStart && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs shadow-2xl animate-bounce border-2 border-black z-50 whitespace-nowrap">🚀 START</div>}
        {data.globalKeyword && (
           <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full p-1 shadow-lg border-2 border-slate-900" title={`全域關鍵字: ${data.globalKeyword}`}>
             <Globe size={12} />
           </div>
        )}
        <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-2 text-center break-words leading-tight">
          {isStart && <Flag size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          {data.label}
        </div>
        <div className={`mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shadow-sm inline-block ${isStart ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-black/40 text-white/80 border-white/10'}`}>
          {data.messageType}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {options.map((opt: any, index: number) => (
          <div key={opt.id || index} className="relative bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-center text-slate-300">
            {opt.label}
            <Handle 
              type="source" 
              position={Position.Right} 
              id={`opt_${index}`}
              isConnectable={isConnectable} 
              className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 hover:scale-150 transition-transform !right-[-10px]" 
            />
          </div>
        ))}
      </div>

      {options.length === 0 && (
         <Handle type="source" position={Position.Bottom} id="default_out" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
      )}
    </div>
  );
};

// --- 子組件：群組區塊節點 ---
const GroupNode = ({ data, selected }: NodeProps) => (
  <>
    <NodeResizer color="#deff9a" isVisible={selected} minWidth={150} minHeight={100} handleClassName="w-3 h-3 bg-white border-2 border-[#deff9a] rounded-full" />
    <div className={`w-full h-full border-2 border-dashed rounded-3xl relative transition-all ${data.color || 'border-slate-500/50 bg-slate-500/5'}`}>
      <div className={`absolute -top-4 left-6 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-2 z-50 ${data.labelColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
        {data.title || '未命名區塊'}
      </div>
    </div>
  </>
);

// --- 子組件：時間分流節點 ---
const TimeRouterNode = ({ data, isConnectable }: any) => (
  <div className="w-[200px] h-[90px] bg-indigo-950/90 border-[3px] border-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative transition-all duration-300">
    <Handle type="target" position={Position.Top} id="top_in" isConnectable={isConnectable} className="w-3 h-3 bg-indigo-400 border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
    <div className="font-black text-sm tracking-wide flex items-center justify-center gap-1.5 w-full px-4 text-indigo-100 mb-1">
      <Clock size={16} className="text-indigo-400" />
      <span>{data.nodeName || '時間條件分流'}</span>
    </div>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-black/40 text-indigo-300 border-indigo-500/30">
      {data.config?.forceOffHours ? <span className="text-rose-400">🚨 強制下班模式 (開啟)</span> : `${data.config?.startTime || '09:00'} - ${data.config?.endTime || '18:00'}`}
    </div>
    <Handle type="source" position={Position.Bottom} id="business" isConnectable={isConnectable} style={{ left: '30%' }} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
    <Handle type="source" position={Position.Bottom} id="off-hours" isConnectable={isConnectable} style={{ left: '70%' }} className="w-3 h-3 bg-rose-400 border-2 border-slate-900 z-50 hover:scale-150 transition-transform" />
    <div className="absolute -bottom-6 left-[15%] text-[10px] font-black text-emerald-400 drop-shadow-md">營業中</div>
    <div className="absolute -bottom-6 left-[55%] text-[10px] font-black text-rose-400 drop-shadow-md">非營業</div>
  </div>
);

const nodeTypes = { custom: CustomNode, group: GroupNode, timeRouter: TimeRouterNode };

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
            id: d.id, type: 'group', position: data.position || { x: 0, y: 0 }, style: { width: data.width || 400, height: data.height || 300 },
            data: { title: data.nodeName, color: data.customLabel === '已完成' ? 'border-emerald-500/50 bg-emerald-500/5' : data.customLabel === '待處理' ? 'border-amber-500/50 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5', labelColor: data.customLabel === '已完成' ? 'bg-emerald-600 text-white border-emerald-400' : data.customLabel === '待處理' ? 'bg-amber-600 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-400' },
            zIndex: -1,
          };
        }
        if (data.messageType === 'time_router') {
          return { id: d.id, type: 'timeRouter', position: data.position || { x: 100, y: 100 }, parentNode: data.parentNode || undefined, data: { nodeName: data.nodeName, config: data.config } };
        }
        
        // 🚀 關鍵修復：把高度固定改為 className 裡的 h-fit，讓外框自動長大
        return {
          id: d.id, type: 'custom', position: data.position || { x: 100, y: 100 },
          parentNode: data.parentNode || undefined,
          data: { label: data.nodeName || '新節點', messageType: data.messageType, options: data.buttons || data.options, globalKeyword: data.globalKeyword },
          className: `border-2 shadow-2xl rounded-2xl w-[200px] h-fit transition-all duration-300 ${getNodeStyle(data.messageType, data.nodeName === '預設回覆')}`
        };
      }));
    });

    const unsubEdges = onSnapshot(collection(db, "flowEdges"), (snap) => {
      setEdges(snap.docs.map(d => {
        const data = d.data();
        let edgeColor = data.color || '#deff9a';
        if (data.sourceHandle === 'business') edgeColor = '#34d399';
        if (data.sourceHandle === 'off-hours') edgeColor = '#fb7185';
        if (data.sourceHandle?.startsWith('opt_')) edgeColor = '#60a5fa';

        const markerConfig = { type: MarkerType.ArrowClosed, color: edgeColor };
        return { 
          id: d.id, source: data.source, target: data.target, sourceHandle: data.sourceHandle, targetHandle: data.targetHandle, type: data.pathType || 'smoothstep', animated: data.dashed !== false, 
          style: { stroke: edgeColor, strokeWidth: data.strokeWidth || 2, strokeDasharray: data.dashed ? '5 5' : '' },
          markerEnd: markerConfig
        };
      }));
    });
    const unsubSnaps = onSnapshot(query(collection(db, "flowSnapshots"), orderBy("createdAt", "desc")), (snap) => setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubNodes(); unsubEdges(); unsubSnaps(); };
  }, []);

  const addNewNode = async () => { const { x, y, zoom } = getViewport(); await addDoc(collection(db, "flowRules"), { nodeName: "新關鍵字", messageType: "text", position: { x: (window.innerWidth / 2 - x) / zoom - 100, y: (window.innerHeight / 2 - y) / zoom - 40 }, updatedAt: serverTimestamp() }); };
  const addGroupBox = async () => { const { x, y, zoom } = getViewport(); await addDoc(collection(db, "flowRules"), { nodeName: "新區塊", messageType: "group_box", customLabel: "規劃中", width: 400, height: 300, position: { x: (window.innerWidth / 2 - x) / zoom - 200, y: (window.innerHeight / 2 - y) / zoom - 150 }, updatedAt: serverTimestamp() }); };
  const addTimeRouterNode = async () => { const { x, y, zoom } = getViewport(); await addDoc(collection(db, "flowRules"), { nodeName: "時間條件分流", messageType: "time_router", config: { startTime: "09:00", endTime: "18:00", workDays: [1,2,3,4,5], forceOffHours: false }, position: { x: (window.innerWidth / 2 - x) / zoom - 100, y: (window.innerHeight / 2 - y) / zoom - 45 }, updatedAt: serverTimestamp() }); };

  const handleOpenSaveModal = () => { setSaveName(`自動回覆設定_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`); setShowSaveModal(true); };
  const executeSave = async () => { if (!saveName.trim()) return; setIsSaving(true); try { const nodeS = await getDocs(collection(db, "flowRules")); const edgeS = await getDocs(collection(db, "flowEdges")); await addDoc(collection(db, "flowSnapshots"), { name: saveName.trim(), nodes: nodeS.docs.map(d => ({ id: d.id, ...d.data() })), edges: edgeS.docs.map(d => ({ id: d.id, ...d.data() })), createdAt: serverTimestamp() }); setShowSaveModal(false); alert("✅ 儲存成功"); } catch (e) { alert("失敗"); } finally { setIsSaving(false); } };
  const loadSnapshot = async (snap: any) => { if (!window.confirm(`載入「${snap.name}」？`)) return; const batch = writeBatch(db); const nS = await getDocs(collection(db, "flowRules")); const eS = await getDocs(collection(db, "flowEdges")); nS.forEach(d => batch.delete(d.ref)); eS.forEach(d => batch.delete(d.ref)); snap.nodes.forEach((n: any) => { const { id, ...r } = n; batch.set(doc(db, "flowRules", id), r); }); snap.edges.forEach((e: any) => { const { id, ...r } = e; batch.set(doc(db, "flowEdges", id), r); }); await batch.commit(); setShowSnapshots(false); alert("✅ 載入成功"); };

  return (
    <>
      {showSaveModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-96 flex flex-col gap-5">
            <div><h3 className="font-black text-[#deff9a] text-lg flex items-center gap-2"><Save size={18} /> 儲存版本</h3><p className="text-xs text-slate-400">輸入存檔名稱：</p></div>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-1 ring-[#deff9a]" autoFocus />
            <div className="flex gap-3"><button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 bg-slate-800 rounded-xl text-xs font-bold text-slate-300">取消</button><button onClick={executeSave} disabled={isSaving} className="flex-1 py-3 bg-[#deff9a] text-black font-black rounded-xl text-xs">{isSaving ? "處理中" : "儲存"}</button></div>
          </div>
        </div>
      )}

      <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
          <button onClick={addNewNode} className="bg-[#deff9a] text-black px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center gap-2 hover:scale-105"><Plus size={20} /> ADD NODE</button>
          <button onClick={addTimeRouterNode} className="bg-indigo-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center gap-2 hover:scale-105"><Clock size={20} /> TIME ROUTER</button>
          <button onClick={addGroupBox} className="bg-white/10 text-white px-6 py-3 rounded-2xl shadow-2xl font-black tracking-widest flex items-center gap-2 hover:bg-white/20 border border-white/10"><BoxSelect size={20} /> ADD GROUP</button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-4 py-2 rounded-xl text-xs font-bold flex justify-center gap-2 border ${snapToGrid ? 'bg-slate-800 text-[#deff9a] border-[#deff9a]/30' : 'bg-slate-900/50 text-slate-500 border-transparent hover:bg-slate-800'}`}><Magnet size={14}/> 對齊 {snapToGrid ? 'ON' : 'OFF'}</button>
          <div className="h-px bg-white/5 my-2 w-full"></div>
          <button onClick={handleOpenSaveModal} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex justify-center gap-2 hover:bg-blue-500"><Save size={14}/> 儲存版本</button>
          <button onClick={() => setShowSnapshots(!showSnapshots)} className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex justify-center gap-2 hover:bg-slate-700"><History size={14}/> 歷史紀錄</button>
      </div>

      {showSnapshots && (
          <div className="absolute top-64 left-8 z-50 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 bg-slate-800/50 border-b flex justify-between"><span className="text-[10px] font-black text-slate-400">SAVED VERSIONS</span><button onClick={() => setShowSnapshots(false)}><X size={14} className="text-slate-500"/></button></div>
              <div className="max-h-80 overflow-y-auto p-2">
                  {snapshots.map(snap => (<div key={snap.id} className="p-3 bg-slate-950/50 hover:bg-slate-800 rounded-xl mb-1 cursor-pointer flex justify-between" onClick={() => loadSnapshot(snap)}><div className="flex flex-col"><span className="text-xs text-white truncate max-w-[160px]">{snap.name}</span></div><Download size={14} className="text-[#deff9a]"/></div>))}
              </div>
          </div>
      )}

      <ReactFlow 
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
        onNodesChange={(c) => setNodes(s => applyNodeChanges(c, s))} onEdgesChange={(c) => setEdges(s => applyEdgeChanges(c, s))} 
        onEdgeUpdate={useCallback(async (o: Edge, n: Connection) => { try { await updateDoc(doc(db, "flowEdges", o.id), { source: n.source, target: n.target, sourceHandle: n.sourceHandle, targetHandle: n.targetHandle }); } catch(e){} }, [])}
        onConnect={useCallback(async (p: Connection) => { await addDoc(collection(db, "flowEdges"), { ...p, color: '#deff9a', strokeWidth: 2, dashed: true, arrowDirection: 'forward', createdAt: serverTimestamp() }); }, [])} 
        onNodesDelete={useCallback(async (dn: Node[]) => { for (const n of dn) await deleteDoc(doc(db, "flowRules", n.id)); }, [])} 
        onEdgesDelete={useCallback(async (de: Edge[]) => { for (const e of de) await deleteDoc(doc(db, "flowEdges", e.id)); }, [])} 
        onNodeClick={(_, n) => { setSelectedId(n.id); setActivePanel('node'); }} onEdgeClick={(_, e) => { setSelectedId(e.id); setActivePanel('edge'); }} onPaneClick={() => { setActivePanel(null); setSelectedId(null); }} 
        onNodeDragStop={async (_, n) => { 
            if (n.type === 'group') { await updateDoc(doc(db, "flowRules", n.id), { position: n.position, width: n.width || n.style?.width, height: n.height || n.style?.height }); } 
            else {
                const absX = n.positionAbsolute?.x || n.position.x; const absY = n.positionAbsolute?.y || n.position.y;
                const tg = nodes.find(g => { if(g.type !== 'group') return false; const gX = g.position.x; const gY = g.position.y; const gW = parseInt(g.style?.width as string)||400; const gH = parseInt(g.style?.height as string)||300; return absX+100>=gX && absX+100<=gX+gW && absY+40>=gY && absY+40<=gY+gH; });
                if (tg) await updateDoc(doc(db, "flowRules", n.id), { parentNode: tg.id, position: { x: absX - tg.position.x, y: absY - tg.position.y } });
                else await updateDoc(doc(db, "flowRules", n.id), { parentNode: deleteField(), position: { x: absX, y: absY } });
            }
        }} 
        connectionMode={ConnectionMode.Loose} snapToGrid={snapToGrid} snapGrid={[20, 20]} fitView
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
  return <div className="w-full h-full bg-[#020617] flex overflow-hidden font-sans"><ReactFlowProvider><FlowContent /></ReactFlowProvider></div>;
}
