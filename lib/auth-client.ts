// lib/auth-client.ts - CORRIGÉ
import { createAuthClient } from "better-auth/react"

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 
  (typeof window !== 'undefined' ? window.location.origin : '')

export const authClient = createAuthClient({
  baseURL: baseURL,
  // ⭐ IMPORTANT: Configuration fetch corrigée
  fetchOptions: {
    credentials: "include",
    mode: "cors",
  },
})

export const { signIn, signUp, signOut, useSession } = authClient