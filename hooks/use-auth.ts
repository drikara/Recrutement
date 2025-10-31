// hooks/use-auth.ts
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(requiredRole?: 'WFM' | 'JURY') {
  const { data: session, isLoading, isError } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/login')
      return
    }

    if (session && requiredRole) {
      const userRole = (session.user as any).role
      if (userRole !== requiredRole) {
        router.push('/unauthorized')
      }
    }
  }, [session, isLoading, requiredRole, router])

  return {
    session,
    isLoading,
    isError,
    user: session?.user,
    role: (session?.user as any)?.role
  }
}