// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

const baseURL = process.env.BETTER_AUTH_URL || 
  process.env.NEXTAUTH_URL || 
  "https://consolidations-notes-1.vercel.app"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: baseURL,
  
  // ⭐ CORRECTION : Configuration simplifiée et correcte
  trustedOrigins: [baseURL],
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "JURY",
      },
      lastLogin: {
        type: "date",
        required: false,
      },
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 24 heures
  },
  
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
})

export type Auth = typeof auth