// client/src/App.tsx
import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import IncidentTable from './components/IncidentTable';
import FileUploader from './components/FileUploader';
import IncidentTimeline from './pages/IncidentTimeline';

// I moved the Dashboard into its own mini-component to keep things clean
function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-2">
        <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Dashboard</h2>
        <p className="text-muted mt-2">Monitor and investigate system failures in real-time.</p>
      </header>
      
      <FileUploader onUploadSuccess={() => setRefreshKey(prev => prev + 1)} />
      <IncidentTable key={refreshKey} />
    </div>
  );
}

function App() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-10">
        {/* React Router decides which page to show here! */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/incident/:id" element={<IncidentTimeline />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;