// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { DefaultSession } from 'next-auth';

// Constantes para mejor legibilidad
const SESSION_MAX_AGE = 60 * 60 * 3; // 3 horas en segundos
const SESSION_UPDATE_AGE = 30 * 60; // 30 minutos en segundos (refresh automático)
const JWT_EXPIRATION = 3 * 60 * 60 * 1000; // 3 horas en milisegundos (para JWT)

export const authOptions = { 
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<"identifier" | "password", string> | undefined, req) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Faltan credenciales');
        }

        const normalizedIdentifier = credentials.identifier.toLowerCase();

        const db = await getDb();
        const user = await db.get(
          'SELECT id, username, email, password FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
          [normalizedIdentifier, normalizedIdentifier]
        );

        if (!user) {
          throw new Error('Credenciales inválidas');
        }

        const passwordMatch = bcrypt.compareSync(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error('Credenciales inválidas');
        }

        return {
          id: user.id.toString(),
          name: user.username,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }: { token: any; user?: any; account?: any; trigger?: string }) {
      // Si es un nuevo login
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.accessTokenExpires = Date.now() + JWT_EXPIRATION; // 3 horas
        console.log('JWT: Nuevo login, token expira en:', new Date(token.accessTokenExpires));
      }
      
      // Si es una actualización manual (cuando se llama session.update())
      if (trigger === 'update') {
        console.log('JWT: Extendiendo sesión por update()');
        token.accessTokenExpires = Date.now() + JWT_EXPIRATION; // Extender 3 horas más
        console.log('JWT: Nuevo tiempo de expiración:', new Date(token.accessTokenExpires));
        return token;
      }
      
      // Verificar si el token está próximo a expirar (últimos 30 minutos)
      if (token.accessTokenExpires && Date.now() > (token.accessTokenExpires - (30 * 60 * 1000))) {
        console.log('JWT: Token próximo a expirar, refrescando...');
        token.accessTokenExpires = Date.now() + JWT_EXPIRATION; // Refrescar por 3 horas más
        return token;
      }
      
      return token;
    },
    
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.accessTokenExpires = token.accessTokenExpires;
        
        // Establecer session.expires para compatibilidad estándar
        if (token.accessTokenExpires) {
          session.expires = new Date(token.accessTokenExpires).toISOString();
        }
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: SESSION_MAX_AGE, // 3h en segundos
    updateAge: SESSION_UPDATE_AGE, // Se actualiza automáticamente cada 30 minutos
  },
  jwt: {
    maxAge: SESSION_MAX_AGE, // 3h en segundos (mismo que la sesión)
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/', 
  },
  events: {
    async session({ session, token }) {
      console.log('Session event - Token expires:', token?.accessTokenExpires ? new Date(token.accessTokenExpires) : 'No expiry set');
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Declaraciones de módulos para TypeScript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    } & DefaultSession['user'];
    accessTokenExpires?: number;
  }

  interface User {
    id: string;
    name: string;
    email: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    accessTokenExpires?: number;
  }
}