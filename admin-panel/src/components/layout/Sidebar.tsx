import { 
  LayoutDashboard, 
  Library, 
  Settings, 
  History, 
  Video, 
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';

// 定義導覽選單的結構
const menuItems = [
  { 
    title: "流程編輯器", 
    icon: <LayoutDashboard size={20} />, 
    active: true, 
    path: "/" 
  },
  { 
    title: "自動回覆資源庫", // 👉 這裡是您要求的更名點
    icon: <Library size={20} />, 
    active: false, 
    path: "/resources",
    badge: "NEW" // 標記為新功能
  },
  { 
    title: "對話紀錄查詢", 
    icon: <History size={20} />, 
    active: false, 
    path: "/history" 
  },
  { 
    title: "系統設定", 
    icon: <Settings size={20} />, 
    active: false, 
    path: "/settings" 
  }
];

export default function Sidebar() {
  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col shadow-sm">
      {/* 標題區域 */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent italic">
          PRE-HEALTH BOT
        </h1>
        <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">
          管理指揮中心
        </p>
      </div>

      {/* 選單區域 */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
              item.active 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm font-semibold">{item.title}</span>
            </div>
            {item.badge && (
              <span className="bg-destructive text-[8px] px-1.5 py-0.5 rounded-full text-white font-bold animate-pulse">
                {item.badge}
              </span>
            )}
            {!item.active && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
        ))}
      </nav>

      {/* 資源統計快照 (這是預留給自動回覆資源庫的功能區) */}
      <div className="p-4 m-4 bg-secondary/40 rounded-2xl border border-border/50">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">資源統計</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background/60 p-2 rounded-lg flex flex-col items-center">
            <Video size={14} className="text-red-500 mb-1" />
            <span className="text-xs font-bold">12 支</span>
            <span className="text-[8px] text-muted-foreground">教學影片</span>
          </div>
          <div className="bg-background/60 p-2 rounded-lg flex flex-col items-center">
            <ImageIcon size={14} className="text-blue-500 mb-1" />
            <span className="text-xs font-bold">8 份</span>
            <span className="text-[8px] text-muted-foreground">懶人包</span>
          </div>
        </div>
      </div>

      {/* 底部使用者資訊 */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
            R
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">Roger Admin</span>
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
              系統連線中
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
