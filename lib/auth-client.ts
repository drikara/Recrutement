// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // ⭐ IMPORTANT: Ajoutez cette option
  fetchOptions: {
    credentials: "include", // Pour que les cookies soient envoyés
  },
})

export const { signIn, signUp, signOut, useSession } = authClient