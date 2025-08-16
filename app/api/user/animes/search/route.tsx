// app/api/user/animes/search/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

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
}

const STATES_VIEW_OPTIONS = [
    { id: 1, name: 'Viendo' }, 
    { id: 2, name: 'Terminado' }, 
    { id: 3, name: 'Pendiente' }, 
    { id: 4, name: 'Abandonado' }
];

const SEASONS_OPTIONS = [
    { id: 1, name: 'Invierno' }, 
    { id: 2, name: 'Primavera' }, 
    { id: 3, name: 'Verano' }, 
    { id: 4, name: 'Otoño' }
];

export async function GET(request: Request) {
    try {
        console.log('GET /api/user/animes/search: Solicitud recibida.');

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            console.warn('GET /api/user/animes/search: No autenticado.');
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        
        // Parámetros de búsqueda
        const searchQuery = searchParams.get('q');
        const stateFilter = searchParams.get('state');
        const yearFilter = searchParams.get('year');
        const seasonFilter = searchParams.get('season');
        const ratingFilter = searchParams.get('rating');
        const ratingOp = searchParams.get('ratingOp') || 'gte';
        const sortBy = searchParams.get('sortBy') || 'name';
        const sortOrder = searchParams.get('sortOrder') || 'ASC';
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        
        // Nuevo parámetro para especificar el usuario del que queremos buscar
        const targetUserId = searchParams.get('userId');
        
        // Si se proporciona userId, usar ese; si no, usar el del usuario actual (sesión)
        const userId = targetUserId ? parseInt(targetUserId) : session.user.id;

        const db = await getDb();

        // Verificar que el usuario objetivo existe (solo si es diferente al usuario actual)
        if (targetUserId && parseInt(targetUserId) !== session.user.id) {
            const userExists = await db.get(
                'SELECT id FROM users WHERE id = ?',
                [userId]
            );
            
            if (!userExists) {
                return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
            }
        }

        // Construir consulta SQL
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
                ua.user_id
            FROM
                animes a
            JOIN
                user_animes ua ON a.id = ua.anime_id
            WHERE
                ua.user_id = ?
        `;
        
        const params: (string | number)[] = [userId];

        // Filtros
        if (searchQuery) {
            query += ' AND (a.name LIKE ? OR a.name_mal LIKE ?)';
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        if (stateFilter) {
            query += ' AND ua.state_name = ?';
            params.push(stateFilter);
        }

        if (yearFilter) {
            query += ' AND a.year = ?';
            params.push(parseInt(yearFilter));
        }

        if (seasonFilter) {
            query += ' AND a.season_name = ?';
            params.push(seasonFilter);
        }

        if (ratingFilter) {
            const ratingValue = parseFloat(ratingFilter);
            switch (ratingOp) {
                case 'gte':
                    query += ' AND CAST(ua.rating_value AS REAL) >= ?';
                    break;
                case 'lte':
                    query += ' AND CAST(ua.rating_value AS REAL) <= ?';
                    break;
                case 'eq':
                    query += ' AND CAST(ua.rating_value AS REAL) = ?';
                    break;
            }
            params.push(ratingValue);
        }

        // Ordenamiento
        let orderByClause = '';
        switch (sortBy) {
            case 'name':
                orderByClause = 'a.name';
                break;
            case 'year':
                orderByClause = 'a.year';
                break;
            case 'rating':
                orderByClause = 'ua.rating_value';
                break;
            case 'created_at':
                orderByClause = 'a.created_at';
                break;
            default:
                orderByClause = 'a.name';
        }
        
        query += ` ORDER BY ${orderByClause} ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}`;

        // Paginación
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Consulta para los resultados
        const animes = await db.all<AnimeRow[]>(query, params);

        // Consulta para el total (sin paginación)
        let countQuery = `
            SELECT COUNT(*) as total
            FROM animes a
            JOIN user_animes ua ON a.id = ua.anime_id
            WHERE ua.user_id = ?
        `;
        
        const countParams: (string | number)[] = [userId];
        
        // Aplicar los mismos filtros que en la consulta principal
        if (searchQuery) {
            countQuery += ' AND (a.name LIKE ? OR a.name_mal LIKE ?)';
            countParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }
        if (stateFilter) {
            countQuery += ' AND ua.state_name = ?';
            countParams.push(stateFilter);
        }
        if (yearFilter) {
            countQuery += ' AND a.year = ?';
            countParams.push(parseInt(yearFilter));
        }
        if (seasonFilter) {
            countQuery += ' AND a.season_name = ?';
            countParams.push(seasonFilter);
        }
        if (ratingFilter) {
            const ratingValue = parseFloat(ratingFilter);
            switch (ratingOp) {
                case 'gte':
                    countQuery += ' AND CAST(ua.rating_value AS REAL) >= ?';
                    break;
                case 'lte':
                    countQuery += ' AND CAST(ua.rating_value AS REAL) <= ?';
                    break;
                case 'eq':
                    countQuery += ' AND CAST(ua.rating_value AS REAL) = ?';
                    break;
            }
            countParams.push(ratingValue);
        }

        const totalResult = await db.get<{ total: number }>(countQuery, countParams);
        const total = totalResult?.total || 0;

        // Formatear respuesta
        return NextResponse.json({
            animes: animes.map(anime => ({
                ...anime,
                rating_value: anime.rating_value ? `${anime.rating_value}/5★` : null
            })),
            total,
            searchedUserId: userId // Incluir información sobre qué usuario se buscó
        });

    } catch (error: any) {
        console.error('GET /api/user/animes/search: Error:', error.message, 'Stack:', error.stack);
        return NextResponse.json(
            { message: 'Error interno del servidor al buscar animes.', detail: error.message },
            { status: 500 }
        );
    }
}