// setup-db.js  activar: node setup-db.js
import db from './lib/db'; // Asegúrate de que la ruta sea correcta

function setupDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS animes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      image_url TEXT,
      rating TEXT,
      current_episode INTEGER,
      total_episodes INTEGER,
      season_name TEXT,
      year INTEGER,
      season_order INTEGER, -- 1=Invierno, 2=Primavera, etc.
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Opcional: Insertar algunos datos de prueba
  try {
    const userStmt = db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    );
    userStmt.run('testuser', 'user@example.com', 'password123'); // En producción, hashea esto
    console.log('Usuario de prueba insertado.');

    const animeStmt = db.prepare(
      'INSERT INTO animes (user_id, title, image_url, rating, current_episode, total_episodes, season_name, year, season_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    animeStmt.run(
      1,
      'Mushoku Tensei Season 2',
      'https://cdn.myanimelist.net/100/ADD8E6/000000?text=MT2',
      '4★',
      10,
      12,
      'Invierno',
      new Date().getFullYear(),
      1
    );
    animeStmt.run(
      1,
      'Solo Leveling',
      'https://cdn.myanimelist.net/100/87CEEB/000000?text=SL',
      '5★',
      8,
      12,
      'Invierno',
      new Date().getFullYear(),
      1
    );
    animeStmt.run(
      1,
      "Frieren Beyond Journey's End",
      'https://cdn.myanimelist.net/100/6A5ACD/FFFFFF?text=Frieren',
      '5★',
      24,
      28,
      'Invierno',
      new Date().getFullYear(),
      1
    );
    animeStmt.run(
      1,
      'Kaiju No. 8',
      'https://cdn.myanimelist.net/100/90EE90/000000?text=K8',
      '4★',
      5,
      12,
      'Primavera',
      new Date().getFullYear(),
      2
    );
    animeStmt.run(
      1,
      'Sono Bisque Doll wa Koi wo Suru',
      'https://cdn.myanimelist.net/100/ADD8E6/000000?text=MyDressUpDarling',
      '5★',
      12,
      12,
      'Invierno',
      new Date().getFullYear() - 2,
      1
    );
    console.log('Animes de prueba insertados.');
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      console.log('Datos de prueba ya existentes, saltando inserción.');
    } else {
      console.error('Error inserting test data:', e);
    }
  }

  console.log('Base de datos inicializada o verificada.');
}

setupDatabase();
