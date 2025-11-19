// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

export const authClient = createAuthClient({
  baseURL: baseURL,
  // ⭐ IMPORTANT : Configuration simplifiée
})

export const { signIn, signUp, signOut, useSession } = authClient