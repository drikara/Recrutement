// scripts/create-full-wfm-admin.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmlozif6i0000m3u3nnaqt0jr'; // Votre utilisateur actuel

  console.log('🔍 Mise à jour vers WFM + WFM_JURY...');

  // Vérifier l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { juryMember: true }
  });

  if (!user) {
    console.log('❌ Utilisateur introuvable');
    return;
  }

  console.log('📊 État actuel:');
  console.log('  - Email:', user.email);
  console.log('  - Rôle User:', user.role);
  console.log('  - JuryMember:', user.juryMember ? `Existe (${user.juryMember.roleType})` : 'Manquant');

  // 1. Mettre à jour le rôle User vers WFM
  console.log('\n🔄 Mise à jour du rôle User vers WFM...');
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'WFM' }
  });
  console.log('✅ Rôle User = WFM');

  // 2. Créer ou mettre à jour le JuryMember avec WFM_JURY
  if (user.juryMember) {
    console.log('\n🔄 Mise à jour du JuryMember vers WFM_JURY...');
    await prisma.juryMember.update({
      where: { id: user.juryMember.id },
      data: { roleType: 'WFM_JURY' }
    });
    console.log('✅ JuryMember mis à jour');
  } else {
    console.log('\n➕ Création du profil JuryMember WFM_JURY...');
    await prisma.juryMember.create({
      data: {
        userId: user.id,
        fullName: user.name || 'Admin WFM',
        roleType: 'WFM_JURY',
        isActive: true,
        notes: 'Administrateur WFM avec accès jury'
      }
    });
    console.log('✅ JuryMember créé');
  }

  // 3. Supprimer les sessions
  console.log('\n🔒 Suppression des sessions...');
  const deleted = await prisma.session.deleteMany({
    where: { userId: user.id }
  });
  console.log(`✅ ${deleted.count} session(s) supprimée(s)`);

  // 4. Vérification finale
  const final = await prisma.user.findUnique({
    where: { id: userId },
    include: { juryMember: true }
  });

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ✅ ADMIN COMPLET CRÉÉ               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`📧 Email:          ${final?.email}`);
  console.log(`🎭 Rôle User:      ${final?.role}`);
  console.log(`👔 Rôle Jury:      ${final?.juryMember?.roleType}`);
  console.log(`🆔 User ID:        ${final?.id}`);
  console.log(`🎯 JuryMember ID:  ${final?.juryMember?.id}`);
  console.log('╚════════════════════════════════════════╝\n');

  console.log('🎉 TERMINÉ!');
  console.log('\nCet utilisateur a maintenant:');
  console.log('  ✅ Accès au dashboard WFM (rôle WFM)');
  console.log('  ✅ Accès au dashboard Jury (roleType WFM_JURY)');
  console.log('  ✅ Permissions complètes sur tout le système');
  console.log('\nProchaines étapes:');
  console.log('  1. Videz les cookies du navigateur');
  console.log('  2. Reconnectez-vous avec admin.wfm@orange.com');
  console.log('  3. Vous aurez accès aux deux dashboards');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });