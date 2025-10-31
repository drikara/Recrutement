// app/wfm/dashboard/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { RecentCandidates } from "@/components/recent-candidates"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardFilters } from "@/components/dashboard-filters"

interface FilterParams {
  year?: string
  month?: string
  metier?: string
}

export default async function WFMDashboard({
  searchParams,
}: {
  searchParams: Promise<FilterParams>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const params = await searchParams
  
  // Gérer les valeurs des filtres
  const year = params.year || new Date().getFullYear().toString()
  const month = params.month
  const metier = params.metier

  try {
    // Récupérer les années disponibles depuis la base de données
    const availableYearsResult = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM created_at) as year 
      FROM candidates 
      ORDER BY year DESC
    `

    // Convertir le résultat en tableau de nombres
    const availableYears = availableYearsResult.map((row: any) => Number(row.year))

    // S'assurer qu'il y a au moins l'année courante
    const currentYear = new Date().getFullYear()
    if (!availableYears.includes(currentYear)) {
      availableYears.unshift(currentYear)
    }

    // Construire les conditions de filtre
    const baseConditions = [`EXTRACT(YEAR FROM c.created_at) = $1`]
    const queryParams: any[] = [parseInt(year)]

    if (month) {
      baseConditions.push(`EXTRACT(MONTH FROM c.created_at) = $${baseConditions.length + 1}`)
      queryParams.push(parseInt(month))
    }

    if (metier) {
      baseConditions.push(`c.metier = $${baseConditions.length + 1}`)
      queryParams.push(metier)
    }

    const whereClause = `WHERE ${baseConditions.join(' AND ')}`

    // Requêtes principales avec les filtres
    const candidatesQuery = `SELECT COUNT(*) as count FROM candidates c ${whereClause}`
    const admisQuery = `
      SELECT COUNT(*) as count FROM candidates c 
      JOIN scores s ON c.id = s.candidate_id 
      ${whereClause} AND s.final_decision = 'RECRUTE'
    `
    const elimineQuery = `
      SELECT COUNT(*) as count FROM candidates c 
      JOIN scores s ON c.id = s.candidate_id 
      ${whereClause} AND s.final_decision = 'NON_RECRUTE'
    `
    const enCoursQuery = `
      SELECT COUNT(*) as count FROM candidates c 
      LEFT JOIN scores s ON c.id = s.candidate_id 
      WHERE s.final_decision IS NULL AND ${baseConditions.join(' AND ')}
    `

    // Exécuter les requêtes
    const [candidatesCount, admisCount, elimineCount, enCoursCount] = await Promise.all([
      sql.unsafe(candidatesQuery, queryParams),
      sql.unsafe(admisQuery, queryParams),
      sql.unsafe(elimineQuery, queryParams),
      sql.unsafe(enCoursQuery, queryParams)
    ])

    // Statistiques par métier
    const statsByMetierQuery = `
      SELECT 
        c.metier,
        COUNT(*) as total,
        COUNT(CASE WHEN s.final_decision = 'RECRUTE' THEN 1 END) as admis,
        COUNT(CASE WHEN s.final_decision = 'NON_RECRUTE' THEN 1 END) as elimines,
        COUNT(CASE WHEN s.final_decision IS NULL THEN 1 END) as en_cours
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      ${whereClause}
      GROUP BY c.metier
      ORDER BY total DESC
    `

    const statsByMetier = await sql.unsafe(statsByMetierQuery, queryParams)

    const stats = {
      total: Number(candidatesCount[0]?.count || 0),
      admis: Number(admisCount[0]?.count || 0),
      elimine: Number(elimineCount[0]?.count || 0),
      enCours: Number(enCoursCount[0]?.count || 0),
      statsByMetier: statsByMetier.map((row: any) => ({
        metier: row.metier,
        total: Number(row.total),
        admis: Number(row.admis),
        elimines: Number(row.elimines),
        enCours: Number(row.en_cours)
      })),
      filters: {
        years: availableYears,
        currentYear: year,
        currentMonth: month,
        currentMetier: metier
      }
    }

    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session.user} role="WFM" />
        <main className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tableau de Bord WFM</h1>
              <p className="text-muted-foreground mt-1">
                Statistiques pour {month ? `${getMonthName(month)} ` : ''}{year}
                {metier && ` - ${metier}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/wfm/candidates/new">
                <Button className="bg-primary hover:bg-accent text-primary-foreground">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouveau Candidat
                </Button>
              </Link>
              <Link href="/wfm/results">
                <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Voir Résultats
                </Button>
              </Link>
            </div>
          </div>
          
          <DashboardFilters 
            years={stats.filters.years} 
            selectedYear={stats.filters.currentYear}
            selectedMonth={stats.filters.currentMonth}
            selectedMetier={stats.filters.currentMetier}
          />
          
          <StatsCards stats={stats} />
          <RecentCandidates filters={{ year, month, metier }} />
        </main>
      </div>
    )

  } catch (error) {
    console.error("Erreur:", error)
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session.user} role="WFM" />
        <main className="container mx-auto p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des statistiques
          </div>
        </main>
      </div>
    )
  }
}

// Fonction utilitaire pour obtenir le nom du mois
function getMonthName(month: string): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]
  return months[parseInt(month) - 1] || ""
}