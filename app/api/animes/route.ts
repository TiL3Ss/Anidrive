// app/api/animes/route.ts

import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

interface AnimeRow {
    id: number;
    name: string;
    name_mal: string | null;
    season: string;
    total_chapters: number | null;
    current_chapter: number | null;
    state_name: string | null;
    rating_value: string | null;
    year: number;
    season_name: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
    user_id: number;
    recommended?: string | null;
    review?: string | null;
}

const STATES_VIEW_OPTIONS = [
    { id: 1, name: 'Viendo' }, 
    { id: 2, name: 'Terminado' }, 
    { id: 3, name: 'Pendiente' }, 
    { id: 4, name: 'Abandonado' }
];

export async function GET(request: Request) {
    try {
        console.log('GET /api/animes: Solicitud recibida.');

        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            console.warn('GET /api/animes: No autenticado.');
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('userId');
        const stateFilter = searchParams.get('state');

        // CAMBIO PRINCIPAL: Determinar qué userId usar
        let targetUserId: string;
        
        if (userIdParam) {
            // Si se proporciona userId en los parámetros, usarlo
            targetUserId = userIdParam;
            console.log('GET /api/animes: Usando userId de parámetros:', targetUserId);
            
            // Verificar que el userId proporcionado existe (opcional, para seguridad)
            const db = await getDb();
            const userExists = await db.get('SELECT id FROM users WHERE id = ?', [targetUserId]);
            if (!userExists) {
                console.warn('GET /api/animes: Usuario no encontrado:', targetUserId);
                return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
            }
        } else {
            // Si no se proporciona userId, usar el de la sesión (comportamiento original)
            targetUserId = session.user.id;
            console.log('GET /api/animes: Usando userId de sesión:', targetUserId);
        }

        const db = await getDb();

        let query = `
            SELECT
                a.id,
                a.name,
                a.name_mal,
                a.season,
                a.total_chapters,
                ua.current_chapter,
                ua.state_name,
                ua.rating_value,
                a.year,
                a.season_name,
                a.image_url,
                a.created_at,
                a.updated_at,
                ua.user_id,
                ua.recommended,
                ua.review
            FROM
                animes a
            JOIN
                user_animes ua ON a.id = ua.anime_id
            WHERE
                ua.user_id = ?
        `;
        const params: (string | number | null)[] = [targetUserId];

        if (stateFilter === 'viendo') {
            const viendoStateName = STATES_VIEW_OPTIONS.find(s => s.name === 'Viendo')?.name;
            if (viendoStateName) {
                query += ' AND ua.state_name = ?';
                params.push(viendoStateName);
                console.log('GET /api/animes: Aplicando filtro de estado:', viendoStateName);
            } else {
                console.warn('GET /api/animes: Estado "Viendo" no encontrado en configuración estática del backend.');
            }
        }

        query += ' ORDER BY a.year DESC, a.name ASC';

        console.log('GET /api/animes: Ejecutando query para userId:', targetUserId);
        const animes = await db.all<AnimeRow[]>(query, params);
        
        console.log('GET /api/animes: Animes encontrados:', animes.length, 'para usuario:', targetUserId);

        return NextResponse.json(animes);

    } catch (error: any) {
        console.error('GET /api/animes: Error CRÍTICO en la API Route (Server-side):', error.message, 'Stack:', error.stack);
        return NextResponse.json(
            { message: 'Error interno del servidor al obtener animes.', detail: error.message },
            { status: 500 }
        );
    }
}