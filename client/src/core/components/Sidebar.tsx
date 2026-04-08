// client/src/components/Sidebar.tsx
import { LayoutDashboard, AlertCircle, FileText, Settings, ChevronDown, FolderArchive  } from "lucide-react";
import { motion, AnimatePresence} from "framer-motion";
import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import InviteTeamModal from '../../features/auth/components/InviteTeamModal';

import { useAuth } from '../context/auth';
import { apiClient } from '../api/client';
import type { Project } from '../context/auth';
import { LogOut } from 'lucide-react';
import CreateProjectModal from '../../features/projects/components/CreateProjectModal';
import { useNavigate } from 'react-router-dom';



type NavItem = {
    name: string;
    icon: React.ElementType;
    isActive?: boolean;
    href: string;
};

// Now we use that blueprint. If you try to add `age: 25` here, TypeScript will stop you!
const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, isActive: true, href: '/dashboard' },
    { name: "Incidents", icon: AlertCircle, href: '/incidents' },
    { name: "Postmortems", icon: FileText, href: '/postmortems' },
    { name: "Settings", icon: Settings, href: '/settings' },
];

export default function Sidebar() {

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const { activeOrganization, activeProject, setActiveProject, user, logout } = useAuth();

    // Dropdown State
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    const navigate = useNavigate(); 


    // Fetch Projects when Sidebar mounts
    useEffect(() => {
        const fetchProjects = async () => {
            if (!activeOrganization) return;
            try {
                // We'll need to create this backend route next!
                const response = await apiClient.get(`/projects?orgId=${activeOrganization.id}`);
                setProjects(response.data.data);
                
                // If we don't have an active project set, default to the first one
                if (!activeProject && response.data.data.length > 0) {
                    setActiveProject(response.data.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch projects', error);
            }
        };
        fetchProjects();
    }, [activeOrganization]);

    return (
        <aside className="w-64 h-screen bg-surface border-r border-surfaceBorder p-4 flex flex-col">
            {/* Brand Logo Area */}
            <div className="flex items-center gap-3 px-2 mb-10 mt-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <AlertCircle size={20} className="text-white" />
                </div>
                <h1 className="text-gray-100 font-bold text-lg tracking-wide">
                Replay<span className="text-primary">OS</span>
                </h1>
            </div>

            {/* Project Switcher Dropdown */}
            <div className="relative mb-8">
                <button 
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-surfaceBorder/30 border border-surfaceBorder rounded-lg hover:bg-surfaceBorder/50 transition-colors"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FolderArchive size={16} className="text-primary shrink-0" />
                        <div className="flex flex-col items-start truncate">
                            <span className="text-xs text-muted font-medium">{activeOrganization?.name || 'Organization'}</span>
                            <span className="text-sm text-gray-200 font-semibold truncate">
                                {activeProject?.name || 'Loading Project...'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown size={16} className={`text-muted transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                
                <AnimatePresence>
                    {isProjectDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surfaceBorder rounded-lg shadow-xl overflow-hidden z-50"
                        >
                            <div className="max-h-48 overflow-y-auto py-1">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            setActiveProject(project);
                                            setIsProjectDropdownOpen(false);
                                            navigate('/dashboard');
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                            activeProject?.id === project.id 
                                                ? 'bg-primary/10 text-primary font-medium' 
                                                : 'text-gray-300 hover:bg-surfaceBorder/50 hover:text-gray-100'
                                        }`}
                                    >
                                        {project.name}
                                    </button>
                                ))}
                            </div>
                            
                            {/* ONLY ADMINS CAN CREATE PROJECTS */}
                            {activeOrganization?.role === 'ADMIN' && (
                                <div className="border-t border-surfaceBorder p-1">
                                    <button 
                                        onClick={() => {
                                            setIsProjectDropdownOpen(false);
                                            setIsCreateProjectModalOpen(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-muted hover:text-gray-200 hover:bg-surfaceBorder/50 transition-colors"
                                    >
                                        + Create New Project
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {/* Navigation Links */}
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    /* Framer Motion: whileHover smoothly pushes the link 4 pixels to the right! */
                    <motion.a
                    key={item.name}
                    href="#"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                        item.isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted hover:text-gray-200 hover:bg-surfaceBorder/50"
                    }`}
                    >
                    <Icon size={18} />
                    {item.name}
                    </motion.a>
                );
                })}
            </nav>

            {/* USER IDENTITY & ACTIONS SECTION */}
            <div className="mt-auto pt-4 border-t border-surfaceBorder/50">
                {/* User Profile Box */}
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-surfaceBorder flex items-center justify-center text-gray-200 font-bold border border-surfaceBorder/50">
                        {user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-semibold text-gray-200 truncate">{user?.name}</span>
                        <div className="flex items-center gap-2">
                            {activeOrganization?.role === 'ADMIN' ? (
                                <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">ADMIN</span>
                            ) : (
                                <span className="text-[10px] font-bold bg-surfaceBorder text-muted px-1.5 py-0.5 rounded">MEMBER</span>
                            )}
                        </div>
                    </div>
                    
                    {/* Logout Button */}
                    <button onClick={logout} className="text-muted hover:text-red-400 transition-colors p-2">
                        <LogOut size={16} />
                    </button>
                </div>

                {/* Only Admins see the Invite button */}
                {activeOrganization?.role === 'ADMIN' && (
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-surfaceBorder/30 rounded-md text-gray-300 hover:text-white hover:bg-surfaceBorder transition-colors border border-surfaceBorder/50"
                    >
                        <UserPlus size={16} />
                        <span className="font-medium text-sm">Invite Team</span>
                    </button>
                )}
            </div>

            {/* Modals */}
            <InviteTeamModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
            
            <CreateProjectModal 
                isOpen={isCreateProjectModalOpen} 
                onClose={() => setIsCreateProjectModalOpen(false)} 
                onSuccess={(newProject) => {
                    setProjects([...projects, newProject]);
                    setActiveProject(newProject);
                    window.location.reload();
                }}
            />
        </aside>
    );
}
