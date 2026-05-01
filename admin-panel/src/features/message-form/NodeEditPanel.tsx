import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Library, Maximize2, Minimize2, Smile, Search, Tag, Info, Copy, ChevronDown, ChevronUp, Globe, Clock, CalendarDays, AlertTriangle } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LineSimulator from '../simulator/LineSimulator'

// 🚀 新增 Props：isReadOnly (唯讀模式), sourceCollection (資料來源)
export default function NodeEditPanel({ nodeId, onClose, isReadOnly = false, sourceCollection = "flowRules" }: { nodeId: string | null, onClose: () => void, isReadOnly?: boolean, sourceCollection?: string }) {
  const [nodeData, setNodeData] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [activeLib, setActiveLib] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [libFilter, setLibFilter] = useState<'all' | 'image' | 'video' | 'file'>('all');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    const fetch = async () => {
      // 🚀 根據來源讀取資料 (若是正式機監控，則從快照中提取或直接讀取 production 文件)
      let data: any = null;
      if (sourceCollection === "botConfig/production") {
          const prodSnap = await getDoc(doc(db, "botConfig", "production"));
          if (prodSnap.exists()) {
              data = prodSnap.data().nodes.find((n: any) => n.id === nodeId);
          }
      } else {
          const snap = await getDoc(doc(db, sourceCollection, nodeId));
          if (snap.exists()) data = snap.data();
      }

      if (data) {
          if (data.messageType === 'time_router' && !data.config) {
              data.config = { startTime: "09:00", endTime: "18:00", workDays: [1,2,3,4,5], forceOffHours: false };
          }
          data.isGlobal = data.isGlobal || false;
          setNodeData(data);
      }
      const libSnap = await getDocs(collection(db, "resources"));
      setLibrary(libSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetch();
  }, [nodeId, sourceCollection]);

  const handleSave = async () => {
    if (!nodeId || isReadOnly) return;
    setIsSaving(true);
    const payload = { ...nodeData, updatedAt: serverTimestamp() };
    delete payload.position; 
    await updateDoc(doc(db, "flowRules", nodeId), payload);
    setIsSaving(false);
    alert("✅ 配置已儲存！");
  };

  if (!nodeData) return null;

  const isGroup = nodeData.messageType === 'group_box';
  const isTimeRouter = nodeData.messageType === 'time_router';

  return (
    <div className={`w-full h-full bg-[#1e293b] flex flex-col shadow-2xl text-white font-sans ${isReadOnly ? 'border-l-4 border-rose-500' : ''}`}>
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <div className="flex flex-col">
            <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a] uppercase">{isReadOnly ? 'READ-ONLY MONITOR' : 'COMMAND CENTER'}</h3>
            {isReadOnly && <span className="text-[9px] text-rose-400 font-bold">這是目前線上的真實邏輯，禁止修改</span>}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col p-6 space-y-6">
          {/* 基礎設定區 - 加上 disabled 邏輯 */}
          <fieldset disabled={isReadOnly} className="space-y-6">
              {!isGroup && (
                  <div className="flex gap-4">
                    <div className="flex-[2] space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">啟動關鍵字</label>
                        <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" />
                    </div>
                    {nodeData.messageType !== 'time_router' && (
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">自定義標籤</label>
                            <input value={nodeData.customLabel || ""} onChange={e => setNodeData({...nodeData, customLabel: e.target.value})} className="w-full bg-slate-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-400" />
                        </div>
                    )}
                  </div>
              )}

              {isTimeRouter && (
                  <div className="space-y-5 bg-indigo-950/20 p-5 rounded-2xl border border-indigo-500/20">
                      <div className="flex items-center gap-3">
                        <input type="time" value={nodeData.config?.startTime || "09:00"} disabled={isReadOnly} className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark]" />
                        <span className="text-slate-500 font-black">至</span>
                        <input type="time" value={nodeData.config?.endTime || "18:00"} disabled={isReadOnly} className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark]" />
                      </div>
                  </div>
              )}

              {/* 內容編輯區 */}
              {!isGroup && !isTimeRouter && (
                <div className="space-y-4">
                    <textarea value={nodeData.textContent || ""} disabled={isReadOnly} className="w-full bg-slate-900 rounded-xl p-4 text-sm min-h-[100px]" />
                    <div className="space-y-2">
                        {(nodeData.buttons || []).map((btn: any, i: number) => (
                            <div key={i} className="flex gap-2">
                                <input value={btn.label} disabled={isReadOnly} className="flex-1 bg-slate-900 rounded-lg p-2 text-xs" />
                                <input value={btn.target} disabled={isReadOnly} className="flex-[1.5] bg-slate-900 rounded-lg p-2 text-xs" />
                            </div>
                        ))}
                    </div>
                </div>
              )}
          </fieldset>

          {/* 預覽區不受影響 */}
          <div className="space-y-4 border-t border-white/5 pt-6">
              <button onClick={() => setShowPreview(!showPreview)} className="w-full flex justify-between items-center bg-slate-800/50 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">實機預覽</span>
                  {showPreview ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
              {showPreview && <LineSimulator data={nodeData} />}
          </div>
      </div>

      {!isReadOnly && (
          <div className="p-6 border-t border-white/10 bg-slate-900 flex gap-3">
            <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg hover:brightness-110">
                {isSaving ? "處理中..." : "儲存配置"}
            </button>
          </div>
      )}
    </div>
  )
}
