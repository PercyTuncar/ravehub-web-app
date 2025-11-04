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
    <div className="min-h-screen bg-black">
      {/* Admin Header - Premium Design (Not Fixed) */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-xl border-b border-orange-500/30 mt-16"> {/* Add margin-top to account for navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Ravehub Admin
                </h1>
                <p className="text-sm text-gray-300 font-medium">Panel de Administración</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-200 font-medium">Sistema Activo</span>
              </div>
              <div className="text-sm text-gray-300 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/30">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl border border-gray-800 shadow-2xl">
          {children}
        </div>
      </main>
    </div>
  )
}