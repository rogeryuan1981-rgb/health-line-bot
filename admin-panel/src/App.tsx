import { MessageSquare, Settings, Users, LayoutTemplate } from 'lucide-react'

export default function App() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* 左側導覽列 (Sidebar) */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* 系統標籤 */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            +
          </div>
          <h1 className="font-semibold text-lg tracking-wide">預防保健客服</h1>
        </div>

        {/* 選單項目 */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground transition-colors font-medium">
            <LayoutTemplate size={18} />
            <span>對話流程編輯</span>
          </button>
          
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <MessageSquare size={18} />
            <span>懶人包庫存</span>
          </button>

          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Users size={18} />
            <span>受眾標籤管理</span>
          </button>
        </nav>

        {/* 底部設定 */}
        <div className="p-4 border-t border-border">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Settings size={18} />
            <span>系統設定</span>
          </button>
        </div>
      </aside>

      {/* 右側主內容區 (Main Content) */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* 頂部 Header */}
        <header className="h-[73px] border-b border-border flex items-center px-8 bg-background z-10">
          <h2 className="text-xl font-semibold">對話流程編輯 (Visual Flow)</h2>
        </header>

        {/* 內容渲染區 */}
        <div className="flex-1 p-6 bg-muted/10 overflow-hidden flex flex-col">
          {/* 預留給 React Flow 的畫布區域 */}
          <div className="flex-1 border-2 border-border border-dashed rounded-xl flex items-center justify-center bg-card text-muted-foreground shadow-sm">
            [視覺化流程編輯器載入中... 將於下一個步驟實作]
          </div>
        </div>
      </main>
      
    </div>
  )
}
