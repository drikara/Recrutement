
// lib/error-handler.ts


export interface ApiError {
  status: number
  message: string
  userMessage: string
  code?: string
}

export class ApiErrorHandler {
  static getErrorMessage(status: number, defaultMessage?: string): string {
    const errorMessages: Record<number, string> = {
      400: "❌ Les données envoyées sont invalides. Veuillez vérifier votre saisie.",
      401: "🔒 Vous n'êtes pas connecté. Veuillez vous reconnecter.",
      403: "⛔ Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
      404: "🔍 Les données demandées sont introuvables. Elles ont peut-être été supprimées.",
      409: "⚠️ Un conflit s'est produit. Cette donnée existe déjà.",
      422: "❌ Les données fournies ne sont pas valides.",
      429: "⏳ Trop de requêtes. Veuillez patienter quelques instants.",
      500: "🔧 Une erreur serveur s'est produite. Nos équipes ont été notifiées.",
      502: "🌐 Le serveur est temporairement indisponible. Veuillez réessayer.",
      503: "⚙️ Le service est en maintenance. Veuillez réessayer dans quelques minutes.",
      504: "⏱️ Le serveur met trop de temps à répondre. Veuillez réessayer."
    }

    return errorMessages[status] || defaultMessage || "❌ Une erreur inattendue s'est produite."
  }

  static async handleApiError(response: Response): Promise<never> {
    let errorData: any = null
    
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        errorData = await response.json()
      } else {
        errorData = { message: await response.text() }
      }
    } catch (e) {
      errorData = { message: 'Erreur inconnue' }
    }

    const userMessage = this.getErrorMessage(
      response.status, 
      errorData?.message || errorData?.error
    )

    throw new Error(userMessage)
  }
}