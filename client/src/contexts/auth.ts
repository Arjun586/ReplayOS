import { createContext, useContext } from 'react';

export interface User {
    id: string;
    email: string;
    name: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
}

export interface AuthContextType {
    token: string | null;
    user: User | null;
    activeOrganization: Organization | null;
    login: (token: string, user: User, organizations: Organization[]) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};