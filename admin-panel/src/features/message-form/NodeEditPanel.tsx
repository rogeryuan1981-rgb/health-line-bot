// ... 保持原本 imports 不變

export default function NodeEditPanel({ nodeId, onClose }: { nodeId: string | null, onClose: () => void }) {
  // ... 保持原本 useState 不變

  // ... 保持原本 useEffect 與 handleSave, handleDuplicate 不變

  if (!nodeId) return null;

  // 👉 新增：判斷是否為群組框模式
  const isGroup = nodeData.messageType === 'group_box';

  return (
    <div className="w-[480px] h-full bg-[#1e293b] border-l border-white/10 flex flex-col shadow-2xl absolute right-0 top-0 z-30 text-white font-sans">
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <h3 className="font-black text-sm tracking-tighter italic text-[#deff9a]">
            {isGroup ? 'GROUP SETTINGS' : 'COMMAND CENTER'}
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col p-6 space-y-6">
          {/* 群組框專用介面 */}
          {isGroup ? (
            <div className="space-y-6 animate-in fade-in">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">區塊標題 (Title)</label>
                    <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-white/5" placeholder="例如：主流程、售後區..." />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">區塊狀態 (Status)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: '規劃中', color: 'bg-blue-600' },
                            { id: '待處理', color: 'bg-amber-600' },
                            { id: '已完成', color: 'bg-emerald-600' }
                        ].map(status => (
                            <button 
                                key={status.id}
                                onClick={() => setNodeData({...nodeData, customLabel: status.id})}
                                className={`py-3 rounded-xl text-[10px] font-black border transition-all ${nodeData.customLabel === status.id ? 'border-white bg-slate-700 shadow-lg' : 'border-transparent bg-slate-900 text-slate-500'}`}
                            >
                                <div className={`w-2 h-2 rounded-full inline-block mr-2 ${status.color}`}></div>
                                {status.id}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-[10px] text-slate-400 leading-relaxed">
                    💡 <span className="font-bold text-[#deff9a]">提示：</span><br/>
                    群組框僅作為視覺分類使用，不會影響 LINE 機器人的回覆邏輯。您可以直接在畫布上拖曳邊角來調整框框大小。
                </div>
            </div>
          ) : (
            /* 原本的節點編輯介面 (保持不變) */
            <>
                <div className="flex gap-4">
                  <div className="flex-[2] space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">啟動關鍵字</label>
                    <input value={nodeData.nodeName || ""} onChange={e => setNodeData({...nodeData, nodeName: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-[#deff9a]" placeholder="例如: 產品報價" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Tag size={10}/> 自定義標籤</label>
                    <input value={nodeData.customLabel || ""} onChange={e => setNodeData({...nodeData, customLabel: e.target.value})} className="w-full bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-400" placeholder="用途標註" />
                  </div>
                </div>
                {/* ... 中間的 messageType 按鈕、TEXT/IMAGE/FLEX 判斷邏輯全部維持不變 ... */}
            </>
          )}

          <button onClick={() => { if(window.confirm("刪除此區塊？")) deleteDoc(doc(db, "flowRules", nodeId!)); onClose(); }} className="w-full text-red-500/50 hover:text-red-500 text-[10px] py-4 uppercase font-bold tracking-widest flex items-center justify-center gap-1 mt-4 transition-colors border-t border-white/5 pt-8">
            <Trash2 size={12}/> Delete {isGroup ? 'Group' : 'Node'}
          </button>
      </div>

      <div className="p-6 border-t border-white/10 bg-slate-900 flex gap-3">
        {!isGroup && <button onClick={handleDuplicate} disabled={isSaving} className="flex-1 bg-slate-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-600"><Copy size={18}/> 複製</button>}
        <button onClick={handleSave} disabled={isSaving} className={`${isGroup ? 'w-full' : 'flex-[2]'} bg-[#deff9a] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all`}>
            儲存{isGroup ? '區塊' : '配置'}
        </button>
      </div>
    </div>
  )
}
