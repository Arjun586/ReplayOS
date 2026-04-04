// client/src/App.tsx
import Sidebar from './components/Sidebar';

function App() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10">
        <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Dashboard</h2>
        <p className="text-muted mt-2">Welcome to your incident command center.</p>
        
        {/* A beautiful placeholder card for our future timeline */}
        <div className="mt-8 border border-surfaceBorder rounded-xl bg-surface/50 h-96 flex items-center justify-center border-dashed">
          <p className="text-muted">Incident timeline will live here...</p>
        </div>
      </main>
    </div>
  );
}

export default App;