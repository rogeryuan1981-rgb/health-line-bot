import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import FlowEditor from './features/node-editor/FlowEditor';
import ResourceLibrary from './features/resources/ResourceLibrary';
import AuthWrapper from './auth/AuthWrapper';
import { InteractiveSimulator } from './features/simulator/LineSimulator';

export default function App() {
  const [currentView, setCurrentView] = useState('flow'); // 'flow' | 'resources' | 'simulator'
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  return (
    <AuthWrapper>
      <div className="flex h-screen w-full bg-[#0F172A] overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        
        <main className="flex-1 relative overflow-hidden flex">
          {currentView === 'resources' ? (
            <ResourceLibrary />
          ) : (
            <>
              {/* 畫布區域 (當切換到模擬器時，畫布仍然存在，只是寬度被擠壓) */}
              <div className="flex-1 relative h-full">
                <FlowEditor activeSimulatorNodeId={activeNodeId} />
              </div>

              {/* 🚀 模擬器右側滑出面板 */}
              {currentView === 'simulator' && (
                <div className="w-[420px] h-full bg-slate-900 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20 flex flex-col animate-in slide-in-from-right relative">
                   <InteractiveSimulator onNodeActive={setActiveNodeId} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AuthWrapper>
  );
}
