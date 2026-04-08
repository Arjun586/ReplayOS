// client/src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    const location = useLocation(); // Keep track of where they were trying to go

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to in state. This allows us to redirect them back after they log in.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If they are authenticated, render the child routes!
    return <Outlet />;
}