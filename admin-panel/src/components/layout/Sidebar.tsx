import { useState } from 'react' // 👉 移除 React 導入，直接從 'react' 導入 hooks
import { LayoutGrid, Database, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

// 定義 Props 介面，確保與 App.tsx 傳入的屬性匹配
interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  // 控制側邊欄內縮狀態
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`h-screen bg-[#0f172a] border-r border-white/5 flex flex-col transition-all duration-300 relative z-40 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* 頂部 Logo 區塊 */}
      <div className={`p-6 mb-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <h1 className="text-2xl font-black italic tracking-tighter text-[#22c55e] animate-in fade-in duration-500">
            PRE-HEALTH
          </h1>
        )}
        {/* 內縮切換按鈕 */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-90"
          title={isCollapsed ? "展開" : "縮小"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* 功能選單 */}
      <div className="flex-1 px-3 space-y-2">
        {/* 流程編輯器 */}
        <button 
          onClick={() => onViewChange('flow')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
            currentView === 'flow' 
              ? 'bg-[#22c55e] text-black font-bold shadow-lg shadow-[#22c55e]/20' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LayoutGrid size={20} className="shrink-0" />
          {!isCollapsed && <span className="truncate">流程編輯器</span>}
          
          {/* 內縮時的提示彈窗 */}
          {isCollapsed && (
            <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
              流程編輯器
            </div>
          )}
        </button>

        {/* 自動回覆資源庫 */}
        <button 
          onClick={() => onViewChange('resources')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
            currentView === 'resources' 
              ? 'bg-[#22c55e] text-black font-bold shadow-lg shadow-[#22c55e]/20' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Database size={20} className="shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 overflow-hidden">
              <span className="truncate text-sm">自動回覆資源庫</span>
              <span className="ml-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-[9px] text-white rounded-full font-black italic">
                <Sparkles size={8} /> NEW
              </span>
            </div>
          )}
          
          {isCollapsed && (
            <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
              自動回覆資源庫
            </div>
          )}
        </button>
      </div>

      {/* 底部版本與版權資訊 */}
      {!isCollapsed && (
        <div className="p-6 border-t border-white/5 animate-in slide-in-from-bottom-2">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            System v2.4.0
          </div>
          <div className="mt-1 text-[9px] text-slate-700">
            © 2026 Rehabotics Medical
          </div>
        </div>
      )}
    </aside>
  )
}
