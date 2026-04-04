// client/src/components/Sidebar.tsx
import { LayoutDashboard, AlertCircle, FileText, Settings } from "lucide-react";
import { motion } from "framer-motion";

// --- TYPESCRIPT LESSON 1 ---
// We are creating a "blueprint" for our navigation links.
// This tells TypeScript: "Every link MUST have a string name and a React icon. It MIGHT have an isActive boolean."
// The "?" makes it optional!
type NavItem = {
    name: string;
    icon: React.ElementType;
    isActive?: boolean;
};

// Now we use that blueprint. If you try to add `age: 25` here, TypeScript will stop you!
const navItems: NavItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, isActive: true },
    { name: "Incidents", icon: AlertCircle },
    { name: "Postmortems", icon: FileText },
    { name: "Settings", icon: Settings },
];

export default function Sidebar() {
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
        </aside>
    );
}
