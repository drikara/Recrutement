import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
    // AJOUTEZ CETTE SECTION TRUSTED ORIGINS
  trustedOrigins: [
    "https://consolidations-notes-1.vercel.app",
    "https://consolidations-notes-1-32sygcg4c.vercel.app",
    // Pour le développement local
    "http://localhost:3000",
    // Pattern pour tous les déploiements preview Vercel (kept as a string to satisfy the type)
    "https://consolidations-notes-1-.*.vercel.app",
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
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    generateSchema: false, 
  },
  plugins: [],
})