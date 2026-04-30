import { useState } from 'react'
import { LayoutGrid, Database, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={`h-full bg-[#0f172a] border-r border-white/5 flex flex-col transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* 頂部 Logo 區塊 */}
      <div className="p-6 mb-4 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-2xl font-black italic tracking-tighter text-[#22c55e]">
            PRE-HEALTH
          </h1>
        )}
        {/* 內縮切換按鈕 - 放在右上角或側邊 */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* 功能選單 */}
      <div className="flex-1 px-3 space-y-2">
        {/* 流程編輯器 */}
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isCollapsed ? 'justify-center' : ''
        } bg-[#22c55e] text-black font-bold`}>
          <LayoutGrid size={20} className="shrink-0" />
          {!isCollapsed && <span className="truncate">流程編輯器</span>}
        </button>

        {/* 自動回覆資源庫 */}
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isCollapsed ? 'justify-center' : ''
        } text-slate-400 hover:bg-white/5 hover:text-white font-medium group relative`}>
          <Database size={20} className="shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 overflow-hidden">
              <span className="truncate">自動回覆資源庫</span>
              <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-[10px] text-white rounded font-black italic">NEW</span>
            </div>
          )}
          {/* 內縮時的 Tooltip 提示 (選配) */}
          {isCollapsed && (
            <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              自動回覆資源庫
            </div>
          )}
        </button>
      </div>

      {/* 底部裝飾或資訊 */}
      {!isCollapsed && (
        <div className="p-6 border-t border-white/5">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            System v2.4.0
          </div>
        </div>
      )}
    </div>
  )
}
