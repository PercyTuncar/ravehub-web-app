import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ravehub Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar />

      {/* Main Content Area - Shifted right by sidebar width on desktop */}
      <main className="md:ml-64 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}