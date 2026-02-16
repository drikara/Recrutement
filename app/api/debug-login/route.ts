// app/api/debug-login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminEmail = 'admin.wfm@orange.com';
    
    // 1. Vérifier l'utilisateur
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: adminEmail,
          mode: 'insensitive'
        }
      },
      include: {
        accounts: true,
        juryMember: true
      }
    });

    if (!user) {
      return NextResponse.json({
        error: 'USER_NOT_FOUND',
        message: 'Aucun utilisateur trouvé avec cet email'
      });
    }

    // 2. Vérifier le compte
    if (user.accounts.length === 0) {
      return NextResponse.json({
        error: 'NO_ACCOUNT',
        message: 'Utilisateur trouvé mais aucun compte credential',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    }

    const account = user.accounts[0];

    // 3. Tester le mot de passe
    const testPassword = 'Admin@12';
    let passwordValid = false;
    
    try {
      passwordValid = await bcrypt.compare(testPassword, account.password || '');
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      account: {
        providerId: account.providerId,
        accountId: account.accountId,
        hasPassword: !!account.password,
        passwordHashPreview: account.password?.substring(0, 20) + '...',
        isBcrypt: account.password?.startsWith('$2b$'),
      },
      juryMember: user.juryMember ? {
        roleType: user.juryMember.roleType,
        isActive: user.juryMember.isActive
      } : null,
      passwordTest: {
        tested: 'Admin@12',
        valid: passwordValid
      },
      env: {
        hasSecret: !!process.env.BETTER_AUTH_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        baseURL: process.env.BETTER_AUTH_URL,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'EXCEPTION',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}