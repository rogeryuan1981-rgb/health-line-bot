import { 
  LayoutDashboard, 
  Library, 
  ChevronRight
} from 'lucide-react';

// 👉 定義組件接收的參數介面
interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

// 👉 核心修正：僅保留流程編輯器與資源庫，移除不開發的項目
const menuItems = [
  { id: 'flow', title: "流程編輯器", icon: <LayoutDashboard size={20} /> },
  { id: 'resources', title: "自動回覆資源庫", icon: <Library size={20} />, badge: "NEW" }
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 h-full bg-[#0F172A] border-r border-white/10 flex flex-col shadow-sm">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-[#06C755] to-blue-500 bg-clip-text text-transparent italic">
          PRE-HEALTH
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-[#06C755] text-white shadow-lg' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm font-semibold">{item.title}</span>
            </div>
            {item.badge && (
              <span className="bg-red-500 text-[8px] px-1.5 py-0.5 rounded-full text-white font-bold">
                {item.badge}
              </span>
            )}
            {currentView !== item.id && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />}
          </div>
        ))}
      </nav>

      {/* 底部管理員資訊區 */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[#06C755]/20 flex items-center justify-center font-bold text-[#06C755] text-xs">R</div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Roger Admin</span>
            <span className="text-[10px] text-[#06C755]">系統連線中</span>
          </div>
        </div>
      </div>
    </div>
  );
}
