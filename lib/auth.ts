// lib/auth.ts - CONFIGURATION CORRIGÉE
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "https://consolidations-notes-1.vercel.app",
  
  // ⭐ CORRECTION : Utiliser allowedOrigins au lieu de trustedOrigins
  allowedOrigins: [
    "https://consolidations-notes-1.vercel.app",
    "https://consolidations-notes-1-32sygcg4c.vercel.app",
    "http://localhost:3000",
  ],
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "JURY",
      },
      lastLogin: {
        type: "date",
        required: false,
      },
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  
  // ⭐ CORRECTION : Configuration cookies améliorée
  advanced: {
    cookiePrefix: "better-auth",
    // IMPORTANT: Pour Vercel
    useSecureCookies: process.env.NODE_ENV === "production",
    sameSite: "lax", // ou "none" si vous avez des problèmes cross-domain
  },
})

export type Auth = typeof auth