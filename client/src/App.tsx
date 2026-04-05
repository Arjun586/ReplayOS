// client/src/App.tsx
import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import IncidentTable from './components/IncidentTable';
import FileUploader from './components/FileUploader';
import IncidentTimeline from './pages/IncidentTimeline';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/auth';
import AcceptInvite from './pages/AcceptInvite';

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

// A layout component that wraps the protected routes
// It ensures the Sidebar and Main padding only appear when logged in
function AuthenticatedLayout() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-10">
                <Outlet /> {/* This is where the nested routes (Dashboard, Timeline) will render */}
            </main>
        </div>
    );
}

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* 
                PUBLIC ROUTES
                If the user is already logged in, kick them back to the Dashboard.
                These pages do NOT have the Sidebar.
            */}
            <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            <Route 
                path="/register" 
                element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
            />

            <Route path="/invite/:token" element={isAuthenticated ? <Navigate to="/" replace /> : <AcceptInvite />} />

            {/* 
                PROTECTED ROUTES 
                Wrapped by ProtectedRoute -> Redirects to /login if unauthenticated.
                Wrapped by AuthenticatedLayout -> Provides the Sidebar and spacing.
            */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/incident/:id" element={<IncidentTimeline />} />
                </Route>
            </Route>

            {/* Catch-All Route: Redirect to home (or login if unauthenticated) */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;