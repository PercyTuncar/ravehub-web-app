'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    Music,
    FileText,
    Package,
    CreditCard,
    Users,
    BarChart3,
    Settings,
    Menu,
    LogOut,
    DollarSign,
    ShoppingBag,
    Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

const mainMenuItems = [
    { title: 'Overview', href: '/admin', icon: LayoutDashboard },
    { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { title: 'Bio Link Stats', href: '/admin/bio-link', icon: Link2 },
];

const managementItems = [
    { title: 'Eventos', href: '/admin/events', icon: Calendar },
    { title: 'Entradas', href: '/admin/tickets', icon: Ticket },
    { title: 'DJs', href: '/admin/djs', icon: Music },
    { title: 'Blog', href: '/admin/blog', icon: FileText },
];

const shopItems = [
    { title: 'Productos', href: '/admin/products', icon: Package },
    { title: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
    { title: 'Pagos', href: '/admin/installments', icon: DollarSign },
];

const systemItems = [
    { title: 'Usuarios', href: '/admin/users', icon: Users },
    { title: 'Configuración', href: '/admin/settings', icon: Settings },
];

interface SidebarContentProps {
    pathname: string;
}

const SidebarContent = ({ pathname }: SidebarContentProps) => {
    const renderNavGroup = (items: typeof mainMenuItems, label?: string) => (
        <div className="mb-6">
            {label && (
                <p className="px-3 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2 font-mono">
                    {label}
                </p>
            )}
            <div className="space-y-1">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}>
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                                )}
                                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                <span className="font-medium text-sm">{item.title}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="h-6"></div> {/* Spacer */}

            <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
                {renderNavGroup(mainMenuItems)}
                {renderNavGroup(managementItems, 'Gestión')}
                {renderNavGroup(shopItems, 'Tienda')}
                {renderNavGroup(systemItems, 'Sistema')}
            </nav>

            <div className="p-4 border-t border-white/5">
                <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 h-9">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Cerrar Sesión</span>
                </Button>
                <div className="mt-4 flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">v2.1.0 • Stable</span>
                </div>
            </div>
        </div>
    );
};

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-20 bottom-0 z-40 bg-[#0a0a0a] border-r border-white/5 w-64 flex-col">
                {/* Reusing the content logic, but we need to strip the outer div if we want exact same styling or just use the component */}
                {/* The original desktop sidebar had the same structure as SidebarContent, so we can just use SidebarContent but we need to remove the fixed positioning from SidebarContent if it's there. 
                    Wait, SidebarContent has w-64 and flex-col h-full. 
                    The desktop aside has fixed positioning. 
                    So we can put SidebarContent INSIDE the aside? 
                    The aside ALREADY has the positioning. 
                    SidebarContent has 'bg-[#0a0a0a] border-r border-white/5 w-64'.
                    The aside has 'bg-[#0a0a0a] border-r border-white/5 w-64'.
                    Double border/bg? 
                    Let's adjust SidebarContent to fill parent.
                 */}
                <SidebarContent pathname={pathname} />
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <div className="md:hidden fixed top-24 left-4 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-[#0a0a0a] border-white/10 text-white shadow-lg">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-[#0a0a0a] border-white/10 w-64">
                        <SheetTitle className="sr-only">Menu de Navegación</SheetTitle>
                        <SidebarContent pathname={pathname} />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
