// client/src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Building, Loader2, AlertCircle, TerminalSquare } from 'lucide-react';
import { isAxiosError } from 'axios';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/auth';

export default function Register() {
    const [name, setName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
        const response = await apiClient.post('/auth/register', {
            name,
            organizationName,
            email,
            password,
        });

        // The register endpoint returns a single organization object
        const { token, user, organization } = response.data;

        // Our auth context expects an array of organizations
        login(token, user, [organization]);

        navigate('/');
        } catch (err) {
        if (isAxiosError(err)) {
            const errData = err.response?.data?.error;
            
            // Zod validation errors from the backend return as an array
            if (Array.isArray(errData)) {
            setError(errData[0].message); // E.g., "Password must be at least 8 characters"
            } else {
            setError(errData || 'Failed to create account.');
            }
        } else {
            setError('An unexpected error occurred.');
        }
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
                className="w-full max-w-md bg-surface border border-surfaceBorder rounded-2xl shadow-xl overflow-hidden my-8"
                >
                <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4">
                        <TerminalSquare size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-100">Create an Account</h1>
                        <p className="text-muted text-sm mt-1">Set up your workspace to get started</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm"
                        >
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-muted" />
                                </div>
                                <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                placeholder="Jane Doe"
                                />
                            </div>
                        </div>

                        {/* Organization Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Organization Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building size={18} className="text-muted" />
                                </div>
                                <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                required
                                className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                placeholder="Acme Corp"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Work Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-muted" />
                                </div>
                                <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                placeholder="jane@acme.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-muted" />
                                </div>
                                <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                placeholder="••••••••"
                                />
                            </div>
                            <p className="text-xs text-muted mt-1.5">Must be at least 8 characters.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="border-t border-surfaceBorder bg-surfaceBorder/10 p-4 text-center">
                    <p className="text-sm text-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}