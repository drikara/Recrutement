export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/session"

export default async function HomePage() {
  const session = await getCurrentSession()

  console.log("Session in homepage:", session)

  if (session?.user) {
    const userRole = session.user.role

    console.log("User role:", userRole)

    if (userRole === "WFM") {
      redirect("/wfm/dashboard")
    } else if (userRole === "JURY") {
      redirect("/jury/dashboard")
    } else {
      console.warn("Rôle inconnu, redirection vers login")
      redirect("/auth/login?error=unknown_role")
    }
  }

  redirect("/auth/login")
}