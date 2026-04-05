import React, { useState,  } from 'react';
import  type{ ReactNode } from 'react';
import { AuthContext } from './auth'
import type {User, Organization} from './auth'

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

    const login = (newToken: string, userData: User, organizations: Organization[]) => {
        const primaryOrg = organizations[0];
        setToken(newToken);
        setUser(userData);
        setActiveOrganization(primaryOrg);
        localStorage.setItem('jwt_token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('active_org', JSON.stringify(primaryOrg));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setActiveOrganization(null);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        localStorage.removeItem('active_org');
    };

    return (
        <AuthContext.Provider value={{ token, user, activeOrganization, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}