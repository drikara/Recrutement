// app/wfm/audit/page.tsx

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard-header'
import AuditLogViewer from '@/components/AuditLogViewer'

export const metadata = {
  title: 'Historique des Actions | WFM',
  description: 'Suivi et audit des actions administratives',
}

export default async function AuditPage() {
  // Vérifier l'authentification
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  // Vérifier que l'utilisateur est WFM
  const userRole = (session.user as any).role
  
  if (userRole !== 'WFM') {
    redirect('/jury/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={{
          name: session.user?.name || 'Utilisateur',
          email: session.user?.email || '',
          role: userRole
        }}
      />
      
      <AuditLogViewer />
      
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}