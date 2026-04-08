// client/src/contexts/ThemeProvider.tsx
import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme } from './theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('app-theme') as Theme) || 'purple';
    });

    useEffect(() => {
        localStorage.setItem('app-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}