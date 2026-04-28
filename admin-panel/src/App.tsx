import Sidebar from './components/layout/Sidebar';
import FlowEditor from './features/node-editor/FlowEditor';

function App() {
  return (
    // 使用 h-screen 確保撐滿整個瀏覽器高度
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* 1. 左側選單：自動回覆資源庫入口就在這 */}
      <Sidebar />

      {/* 2. 右側主要內容區：原本的流程編輯器 */}
      <main className="flex-1 relative">
        <FlowEditor />
      </main>
      
    </div>
  );
}

export default App;
