import type { Metadata } from 'next'
import { ProfileAuthGuard } from '@/components/profile/ProfileAuthGuard'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileAuthGuard>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ProfileAuthGuard>
  )
}