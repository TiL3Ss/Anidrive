// app/api/register/route.tsx
import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, tag, email, password } = await req.json();

    if (!username || !tag || !email || !password) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios: nombre de usuario, tag, correo electrónico o contraseña.' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Verifica si ya existe un usuario con el mismo username+tag O el mismo email
    const existingUser = await db.get(
      'SELECT id FROM users WHERE (username = ? AND tag = ?) OR email = ?', 
      [username, tag, email]
    );

    if (existingUser) {
      // Determina qué campo causó el conflicto
      const message = existingUser.email === email 
        ? 'El correo electrónico ya está registrado.' 
        : 'La combinación de nombre de usuario y tag ya existe.';
      
      return NextResponse.json(
        { message },
        { status: 409 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Corregí los parámetros para incluir el tag (faltaba en el array original)
    const result = await db.run(
      'INSERT INTO users (username, tag, email, password) VALUES (?, ?, ?, ?)',
      [username, tag, email, hashedPassword]
    );

    if (result.changes && result.changes > 0) {
      return NextResponse.json(
        { message: 'Usuario registrado exitosamente.' },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { message: 'No se pudo registrar el usuario por un motivo desconocido.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en la ruta de registro:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al intentar registrar el usuario.' },
      { status: 500 }
    );
  }
}