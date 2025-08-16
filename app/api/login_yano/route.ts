// app/api/login/route.tsx
import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db'; // Importa la función para obtener la instancia de la base de datos
import bcrypt from 'bcryptjs'; // Importa bcryptjs para la comparación de contraseñas

/**
 * @function POST
 * @description Maneja las solicitudes POST para el inicio de sesión de usuarios.
 * Esta función es una ruta de API de Next.js que se activará cuando se envíe una solicitud POST a /api/login.
 * @param {Request} req La solicitud HTTP entrante.
 * @returns {NextResponse} Una respuesta HTTP con el estado del inicio de sesión.
 */
export async function POST(req: Request) {
  try {
    // Extrae los datos del cuerpo de la solicitud JSON.
    // 'identifier' puede ser el nombre de usuario o el correo electrónico.
    const { identifier, password } = await req.json();

    // Validaciones básicas de entrada.
    if (!identifier || !password) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios: correo electrónico/nombre de usuario o contraseña.' },
        { status: 400 } // Bad Request
      );
    }

    // Obtiene la instancia de la base de datos.
    const db = await getDb();

    // Busca al usuario por nombre de usuario O por correo electrónico.
    // Es crucial seleccionar la columna 'password' para poder compararla.
    const user = await db.get(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [identifier, identifier] // Se usa 'identifier' para ambos casos
    );

    // 1. Verifica si no se encontró ningún usuario.
    if (!user) {
      // Si no se encuentra ningún usuario, las credenciales son inválidas.
      return NextResponse.json(
        { message: 'Credenciales inválidas.' },
        { status: 401 } // Unauthorized
      );
    }

    // 2. Compara la contraseña proporcionada con la contraseña hasheada almacenada en la base de datos.
    // bcrypt.compareSync es síncrono, pero en una ruta de API, es aceptable para operaciones rápidas.
    const passwordMatch = bcrypt.compareSync(password, user.password);

    // 3. Si las contraseñas NO coinciden.
    if (!passwordMatch) {
      // Si las contraseñas no coinciden, las credenciales son inválidas.
      return NextResponse.json(
        { message: 'Credenciales inválidas.' },
        { status: 401 } // Unauthorized
      );
    }

    // Si ambos pasos anteriores (usuario encontrado Y contraseña coincidente) son exitosos,
    // entonces el inicio de sesión es válido.
    // En una aplicación real, aquí generarías y devolverías un token de sesión (JWT)
    // o establecerías una cookie de sesión.
    return NextResponse.json(
      { message: 'Inicio de sesión exitoso.', user: { id: user.id, username: user.username, email: user.email } },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Error en la ruta de login:', error);
    // Devuelve un error genérico del servidor para evitar dar pistas sobre la causa exacta del fallo.
    return NextResponse.json(
      { message: 'Error interno del servidor al intentar iniciar sesión.' },
      { status: 500 } // Internal Server Error
    );
  }
}
