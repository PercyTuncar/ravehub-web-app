import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { cookies } from 'next/headers'
import { User } from '@/lib/types'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function getCurrentUser(): Promise<User | null> {
  try {
    // For now, we'll use a simplified approach for server-side auth
    // In production, implement proper session verification with Firebase Admin SDK
    // This is a placeholder that assumes the user is authenticated via client-side auth

    // Since we can't easily verify server-side auth without Admin SDK setup,
    // we'll allow access and rely on client-side auth for now
    // In production, this should be properly implemented

    return null // For now, return null to force login
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // For now, we'll rely on client-side authentication
  // In production, implement proper server-side auth with Firebase Admin SDK

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Ravehub Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Panel de Administración
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}