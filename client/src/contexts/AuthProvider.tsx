import React, { useState,  } from 'react';
import  type{ ReactNode } from 'react';
import { AuthContext } from './auth'
import type {User, Organization, Project} from './auth'

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));

    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [activeOrganization, setActiveOrganization] = useState<Organization | null>(() => {
        const saved = localStorage.getItem('active_org');
        return saved ? JSON.parse(saved) : null;
    });
    
    const [activeProject, setActiveProjectState] = useState<Project | null>(() => {
        const saved = localStorage.getItem('activeProject');
        return saved ? JSON.parse(saved) : null;
    });

    const setActiveProject = (project: Project) => {
        setActiveProjectState(project);
        localStorage.setItem('activeProject', JSON.stringify(project));
    };

    const login = (newToken: string, userData: User, organizations: Organization[]) => {
        const primaryOrg = organizations[0];
        setToken(newToken);
        setUser(userData);
        setActiveOrganization(primaryOrg);
        setActiveProjectState(null);
        localStorage.removeItem('activeProject');
        localStorage.setItem('jwt_token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('active_org', JSON.stringify(primaryOrg));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setActiveOrganization(null);
        setActiveProjectState(null);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        localStorage.removeItem('active_org');
        localStorage.removeItem('activeProject');
    };

    return (
        <AuthContext.Provider value={{
            token,
            user,
            activeOrganization,
            activeProject,         
            setActiveProject,      
            login,
            logout,
            isAuthenticated: !!token
        }}>
        {children}
        </AuthContext.Provider>
    );
}