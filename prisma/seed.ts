import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')
  
  try {
    console.log('🧹 Nettoyage des données existantes...')
    
    // Supprimer dans l'ordre inverse des dépendances
    await prisma.faceToFaceScore.deleteMany()
    await prisma.score.deleteMany()
    await prisma.juryPresence.deleteMany()
    await prisma.juryMember.deleteMany()
    await prisma.candidate.deleteMany()
    await prisma.recruitmentSession.deleteMany()
    await prisma.exportLog.deleteMany()
    
    // BetterAuth tables
    await prisma.verification.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Nettoyage terminé')
    console.log('👤 Création des utilisateurs...')

    // Créer les utilisateurs
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@recruitment.com',
        role: 'WFM',
        emailVerified: true,
      },
    })

    const juryUser = await prisma.user.create({
      data: {
        name: 'Jury Member',
        email: 'jury@recruitment.com',
        role: 'JURY',
        emailVerified: true,
      },
    })

    console.log('✅ Utilisateurs créés')

    console.log('💾 Création des comptes Better-auth...')

    // ⚠️ IMPORTANT : Créer les comptes SANS mot de passe
    // Better-auth gérera automatiquement les mots de passe
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.email,
        providerId: 'email', // ⚠️ CHANGER "credential" → "email"
        // ⚠️ NE PAS METTRE de champ password
      },
    })

    await prisma.account.create({
      data: {
        userId: juryUser.id,
        accountId: juryUser.email,
        providerId: 'email', // ⚠️ CHANGER "credential" → "email"
        // ⚠️ NE PAS METTRE de champ password
      },
    })

    console.log('✅ Comptes créés (Better-auth gérera les mots de passe)')

    // Vérifier que les comptes sont bien créés
    const accountCount = await prisma.account.count()
    console.log(`✅ ${accountCount} comptes dans la base`)

    console.log('🎯 Création des membres du jury...')

    // Créer les membres du jury
    await prisma.juryMember.create({
      data: {
        userId: adminUser.id,
        fullName: 'Admin User',
        roleType: 'ADMIN',
        specialite: 'CALL_CENTER',
        department: 'Ressources Humaines',
        phone: '+2250102030405',
      },
    })

    await prisma.juryMember.create({
      data: {
        userId: juryUser.id,
        fullName: 'Jury Member',
        roleType: 'EVALUATOR',
        specialite: 'CALL_CENTER',
        department: 'Ressources Humaines',
        phone: '+2250506070809',
      },
    })

    console.log('✅ Membres du jury créés')
    console.log('📅 Création d\'une session de recrutement...')

    // Créer une session de recrutement
    const session = await prisma.recruitmentSession.create({
      data: {
        metier: 'CALL_CENTER',
        date: new Date('2024-11-15'),
        jour: 'Vendredi',
        status: 'COMPLETED',
        description: 'Session de recrutement Call Center Novembre 2024',
        location: 'Siège Social',
      },
    })

    console.log('✅ Session de recrutement créée')
    console.log('👥 Création d\'un candidat...')

    // Créer un candidat
    await prisma.candidate.create({
      data: {
        fullName: 'Jean Dupont',
        phone: '+2250708091011',
        birthDate: new Date('1995-05-15'),
        age: 29,
        diploma: 'Bac+3 en Commerce',
        institution: 'Université de Cocody',
        email: 'jean.dupont@example.com',
        location: 'Abidjan, Cocody',
        availability: 'Immédiate',
        metier: 'CALL_CENTER',
        sessionId: session.id,
      },
    })

    console.log('✅ Candidat créé')
    console.log('')
    console.log('🎉 Seeding terminé avec succès!')
    console.log('')
    console.log('═══════════════════════════════════════')
    console.log('📋 COMPTES DE TEST CRÉÉS')
    console.log('═══════════════════════════════════════')
    console.log('👤 Admin (WFM)')
    console.log('   Email:    admin@recruitment.com')
    console.log('')
    console.log('👤 Jury')
    console.log('   Email:    jury@recruitment.com')
    console.log('')
    console.log('⚠️  IMPORTANT: Utilisez "Mot de passe oublié"')
    console.log('   pour définir les mots de passe de 8 caractères')
    console.log('═══════════════════════════════════════')

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })