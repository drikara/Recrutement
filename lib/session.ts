// lib/session.ts
import { auth } from "./auth"
import { headers } from "next/headers"

export async function getCurrentSession() {
  try {
    const headersList = await headers()
    
    const session = await auth.api.getSession({
      headers: headersList,
    })

    console.log("🔐 Session - User:", session?.user?.email, "Role:", (session?.user as any)?.role)

    return session
  } catch (error) {
    console.error("❌ Error getting session:", error)
    return null
  }
}