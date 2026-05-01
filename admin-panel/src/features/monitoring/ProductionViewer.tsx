import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Clock, Globe, Zap, ExternalLink, AlertTriangle } from 'lucide-react';

export default function ProductionViewer() {
  const [prodConfig, setProdConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 即時監聽正式機文件
    const unsub = onSnapshot(doc(db, "botConfig", "production"), (snap) => {
      if (snap.exists()) {
        setProdConfig(snap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="flex-1 bg-[#0F172A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold tracking-widest text-xs">正在連線至正式環境數據庫...</p>
      </div>
    </div>
  );

  if (!prodConfig) return (
    <div className="flex-1 bg-[#0F172A] flex items-center justify-center p-10 text-center">
        <div className="max-w-md space-y-4">
            <AlertTriangle className="text-amber-500 mx-auto" size={48} />
            <h2 className="text-white text-xl font-black">尚未發布正式版本</h2>
            <p className="text-slate-400 text-sm leading-relaxed">目前線上數據庫中查無正式設定。請先於流程編輯器中完成編輯，並點擊「立即發布正式機」。</p>
        </div>
    </div>
  );

  const publishDate = prodConfig.publishedAt?.toDate ? prodConfig.publishedAt.toDate().toLocaleString() : '未知時間';

  return (
    <div className="flex-1 bg-[#020617] overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500 scrollbar-hide">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-8">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <div className="bg-rose-500 p-2 rounded-lg"><ShieldCheck className="text-white" size={24} /></div>
                <h1 className="text-3xl font-black text-white tracking-tighter italic">PRODUCTION LIVE MONITOR</h1>
            </div>
            <p className="text-slate-400 text-sm font-medium">目前正式機正在運行中的邏輯版本（唯讀模式）</p>
        </div>
        <div className="text-right">
            <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">最後發布時間</div>
            <div className="text-xl font-black text-white">{publishDate}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
            <div className="text-slate-500 text-[10px] font-black uppercase mb-1">節點總數</div>
            <div className="text-3xl font-black text-white">{prodConfig.nodes?.length || 0} <span className="text-xs text-slate-600 font-normal ml-1">Nodes</span></div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
            <div className="text-slate-500 text-[10px] font-black uppercase mb-1">連線總數</div>
            <div className="text-3xl font-black text-white">{prodConfig.edges?.length || 0} <span className="text-xs text-slate-600 font-normal ml-1">Edges</span></div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl border-l-4 border-l-indigo-500">
            <div className="text-slate-500 text-[10px] font-black uppercase mb-1">全域觸發</div>
            <div className="text-3xl font-black text-indigo-400">{prodConfig.nodes?.filter((n:any)=>n.isGlobal).length || 0} <span className="text-xs text-slate-600 font-normal ml-1">Globals</span></div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl border-l-4 border-l-purple-500">
            <div className="text-slate-500 text-[10px] font-black uppercase mb-1">時間路由</div>
            <div className="text-3xl font-black text-purple-400">{prodConfig.nodes?.filter((n:any)=>n.messageType==='time_router').length || 0} <span className="text-xs text-slate-600 font-normal ml-1">Routers</span></div>
        </div>
      </div>

      {/* Node Detail List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-[#deff9a] tracking-widest uppercase mb-4 flex items-center gap-2"><Zap size={16}/> 運行邏輯詳情 (Live Logic Details)</h3>
        
        <div className="grid grid-cols-1 gap-3">
            {prodConfig.nodes?.sort((a:any, b:any) => (b.isGlobal ? 1 : -1)).map((node: any) => (
                <div key={node.id} className="bg-slate-900/30 border border-white/5 hover:border-white/10 transition-colors p-5 rounded-2xl flex items-center gap-6 group">
                    {/* Status Badge */}
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors">
                        {node.messageType === 'time_router' ? <Clock className="text-purple-400" size={20}/> : <Zap className="text-blue-400" size={20}/>}
                    </div>

                    {/* Node Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-white truncate">{node.nodeName}</h4>
                            {node.isGlobal && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black rounded-full border border-indigo-500/30 flex items-center gap-1"><Globe size={8}/> 全域觸發</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">TYPE: {node.messageType} • ID: {node.id.slice(0,8)}...</p>
                    </div>

                    {/* Specific Logic */}
                    <div className="flex-[1.5] flex gap-4">
                        {node.messageType === 'time_router' ? (
                            <div className="bg-slate-950/50 px-4 py-2 rounded-xl border border-white/5 flex-1">
                                <span className="text-[9px] text-slate-500 block mb-1 font-bold uppercase">Time Range</span>
                                <span className="text-xs text-purple-300 font-mono">{node.config?.startTime || '09:00'} - {node.config?.endTime || '18:00'}</span>
                                {node.config?.forceOffHours && <span className="ml-2 text-rose-500 text-[9px] font-black animate-pulse">● 預警關閉模式</span>}
                            </div>
                        ) : (
                            <div className="flex-1 min-w-0">
                                <span className="text-[9px] text-slate-500 block mb-1 font-bold uppercase">Actions / Buttons</span>
                                <div className="flex flex-wrap gap-1">
                                    {(node.buttons || node.options || []).map((btn: any, idx: number) => (
                                        <div key={idx} className="bg-slate-800/50 px-2 py-1 rounded text-[9px] text-slate-300 border border-white/5">
                                            {btn.label || '無名稱'} → {btn.target || 'N/A'}
                                        </div>
                                    ))}
                                    {(!node.buttons?.length && !node.options?.length) && <span className="text-[9px] text-slate-600 italic">無分支按鈕</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Links Check */}
                    <div className="w-32 text-right">
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Outgoing Edges</div>
                        <div className="text-xs font-black text-white">
                            {prodConfig.edges?.filter((e:any)=>e.source === node.id).length || 0} <span className="text-slate-600">條連線</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
