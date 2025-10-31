import { auth } from "./auth"
import { headers } from "next/headers"

export async function getCurrentSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("Raw session:", session)

    if (!session?.user) {
      return null
    }

    // S'assurer que le rôle est présent
    const userWithRole = session.user as any

    return {
      ...session,
      user: {
        ...userWithRole,
        role: userWithRole.role || "JURY"
      }
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}