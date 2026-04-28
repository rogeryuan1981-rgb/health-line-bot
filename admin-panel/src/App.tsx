import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import FlowEditor from './features/node-editor/FlowEditor';
import ResourceLibrary from './features/resources/ResourceLibrary';

function App() {
  const [currentView, setCurrentView] = useState('flow'); // 'flow' 或 'resources'

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar onViewChange={setCurrentView} currentView={currentView} />
      <main className="flex-1 relative">
        {currentView === 'flow' ? <FlowEditor /> : <ResourceLibrary />}
      </main>
    </div>
  );
}
