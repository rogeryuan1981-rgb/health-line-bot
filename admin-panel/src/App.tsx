import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import FlowEditor from './features/node-editor/FlowEditor';
import ResourceLibrary from './features/resources/ResourceLibrary';

export default function App() {
  const [currentView, setCurrentView] = useState('flow'); // 'flow' | 'resources'

  return (
    <div className="flex h-screen w-full bg-[#0F172A] overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 relative overflow-hidden">
        {currentView === 'flow' ? <FlowEditor /> : <ResourceLibrary />}
      </main>
    </div>
  );
}
