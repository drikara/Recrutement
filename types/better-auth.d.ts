// types/better-auth.d.ts
import { User as PrismaUser } from '@prisma/client';

declare module "better-auth" {
  interface User extends PrismaUser {}
  
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}