// client/src/contexts/theme.ts
import { createContext, useContext } from 'react';

export type Theme = 'purple' | 'blue' | 'red' | 'gray';

export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Move the hook here
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}