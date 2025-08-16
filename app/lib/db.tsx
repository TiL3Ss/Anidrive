// app/lib/db.tsx
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Variable para almacenar la instancia de la base de datos
let dbInstance = null;

/**
 * @function getDb
 * @description Obtiene una instancia de la base de datos SQLite.
 * Si la instancia ya existe, la devuelve; de lo contrario, crea una nueva conexión.
 * Utiliza un patrón Singleton para asegurar que solo haya una conexión a la base de datos.
 * @returns {Promise<sqlite.Database>} Una promesa que resuelve con la instancia de la base de datos.
 */
export async function getDb() {
  // Si la instancia de la base de datos ya existe, la devolvemos.
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Construye la ruta absoluta a la base de datos.
    // 'process.cwd()' devuelve el directorio de trabajo actual del proceso de Node.js.
    // 'path.join' une segmentos de ruta de forma segura.
    const dbPath = path.join(process.cwd(), 'baseDatos.db');

    // Abre la base de datos.
    // 'sqlite3.Database' es el driver de SQLite.
    // 'sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE' asegura que la base de datos se puede leer, escribir y crear si no existe.
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log('Conexión Exitosa.');
    return dbInstance;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    // Relanza el error para que sea manejado por el código que llama a esta función.
    throw error;
  }
}
