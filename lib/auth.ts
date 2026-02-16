// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"
import bcrypt from "bcrypt"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  trustedOrigins: [
    "https://recrutementest.vercel.app",
    "https://recrutementest-*.vercel.app", // ✅ Correction du wildcard
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  
  // ✅ DÉSACTIVER LE RATE LIMITING EN DÉVELOPPEMENT
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60, // 60 secondes
    max: 10, // 10 requêtes max
  },
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10)
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        return await bcrypt.compare(password, hash)
      }
    }
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour
    },
  },
  
  advanced: {
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: false, // ✅ Désactiver en dev local
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    generateSchema: false,
  },

  admin: {
    enabled: true
  }
})