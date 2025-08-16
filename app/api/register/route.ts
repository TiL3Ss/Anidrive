// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../lib/turso';
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

    const client = getTursoClient();

    // Verifica si ya existe un usuario con el mismo username+tag O el mismo email
    const existingUser = await client.execute({
      sql: 'SELECT id, email FROM users WHERE (username = ? AND tag = ?) OR email = ?',
      args: [username, tag, email]
    });

    if (existingUser.rows.length > 0) {
      // Determina qué campo causó el conflicto
      const userRow = existingUser.rows[0];
      const message = userRow.email === email 
        ? 'El correo electrónico ya está registrado.' 
        : 'La combinación de nombre de usuario y tag ya existe.';
      
      return NextResponse.json(
        { message },
        { status: 409 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await client.execute({
      sql: 'INSERT INTO users (username, tag, email, password) VALUES (?, ?, ?, ?)',
      args: [username, tag, email, hashedPassword]
    });

    if (result.rowsAffected && result.rowsAffected > 0) {
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

