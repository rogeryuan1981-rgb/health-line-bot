import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import FlowEditor from './features/node-editor/FlowEditor';
import ResourceLibrary from './features/resources/ResourceLibrary';
import AuthWrapper from './features/auth/AuthWrapper'; // 🚀 匯入權限守衛

export default function App() {
  const [currentView, setCurrentView] = useState('flow'); // 'flow' | 'resources'

  return (
    // 使用 AuthWrapper 包裹整個介面
    <AuthWrapper>
      <div className="flex h-screen w-full bg-[#0F172A] overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 relative overflow-hidden">
          {currentView === 'flow' ? <FlowEditor /> : <ResourceLibrary />}
        </main>
      </div>
    </AuthWrapper>
  );
}
