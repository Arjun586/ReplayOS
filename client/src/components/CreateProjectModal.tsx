import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/auth';
import { isAxiosError } from 'axios';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newProject: any) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
    const { activeOrganization } = useAuth();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrganization) return;
        setError(null);
        setIsLoading(true);

        try {
            const response = await apiClient.post('/projects', {
                name,
                organizationId: activeOrganization.id
            });
            onSuccess(response.data.data);
            setName('');
            onClose();
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.message || 'Failed to create project.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-surface border border-surfaceBorder rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surfaceBorder bg-surface/50">
                            <div className="flex items-center gap-2">
                                <FolderPlus size={18} className="text-primary" />
                                <h2 className="text-lg font-bold text-gray-100">Create New Project</h2>
                            </div>
                            <button onClick={onClose} className="text-muted hover:text-gray-200 p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Mobile API, Frontend App" className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors" />
                                </div>

                                <button type="submit" disabled={isLoading || !name} className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-4">
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                                    Create Project
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}