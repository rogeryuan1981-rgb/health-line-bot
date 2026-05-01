import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import FlowEditor from './features/node-editor/FlowEditor';
import ResourceLibrary from './features/resources/ResourceLibrary';
import AuthWrapper from './auth/AuthWrapper';
import { InteractiveSimulator } from './features/simulator/LineSimulator';
import ProductionViewer from './features/monitoring/ProductionViewer'; // 🚀 稍後建立

export default function App() {
  const [currentView, setCurrentView] = useState('flow'); 
  const [activePath, setActivePath] = useState<{nodes: string[], edges: string[]}>({ nodes: [], edges: [] });

  return (
    <AuthWrapper>
      <div className="flex h-screen w-full bg-[#0F172A] overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        
        <main className="flex-1 relative overflow-hidden flex">
          {currentView === 'resources' && <ResourceLibrary />}
          {currentView === 'production' && <ProductionViewer />}
          
          {(currentView === 'flow' || currentView === 'simulator') && (
            <>
              <div className="flex-1 relative h-full">
                <FlowEditor activePath={activePath} />
              </div>

              {currentView === 'simulator' && (
                <div className="w-[420px] h-full bg-slate-900 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20 flex flex-col animate-in slide-in-from-right relative">
                   <InteractiveSimulator onPathUpdate={setActivePath} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AuthWrapper>
  );
}
