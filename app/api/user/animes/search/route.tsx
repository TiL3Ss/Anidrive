// app/api/user/animes/search/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
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

        const client = getTursoClient();

        // Verificar que el usuario objetivo existe (solo si es diferente al usuario actual)
        if (targetUserId && parseInt(targetUserId) !== session.user.id) {
            const userExistsResult = await client.execute({
                sql: 'SELECT id FROM users WHERE id = ?',
                args: [userId]
            });
            
            if (userExistsResult.rows.length === 0) {
                return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
            }
        }

        // Construir consulta SQL
        let sql = `
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
        
        const args: (string | number)[] = [userId];

        // Filtros
        if (searchQuery) {
            sql += ' AND (a.name LIKE ? OR a.name_mal LIKE ?)';
            args.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        if (stateFilter) {
            sql += ' AND ua.state_name = ?';
            args.push(stateFilter);
        }

        if (yearFilter) {
            sql += ' AND a.year = ?';
            args.push(parseInt(yearFilter));
        }

        if (seasonFilter) {
            sql += ' AND a.season_name = ?';
            args.push(seasonFilter);
        }

        if (ratingFilter) {
            const ratingValue = parseFloat(ratingFilter);
            switch (ratingOp) {
                case 'gte':
                    sql += ' AND CAST(ua.rating_value AS REAL) >= ?';
                    break;
                case 'lte':
                    sql += ' AND CAST(ua.rating_value AS REAL) <= ?';
                    break;
                case 'eq':
                    sql += ' AND CAST(ua.rating_value AS REAL) = ?';
                    break;
            }
            args.push(ratingValue);
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
        
        sql += ` ORDER BY ${orderByClause} ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}`;

        // Paginación
        sql += ' LIMIT ? OFFSET ?';
        args.push(limit, offset);

        // Consulta para los resultados
        const animesResult = await client.execute({
            sql: sql,
            args: args
        });

        // Consulta para el total (sin paginación)
        let countSql = `
            SELECT COUNT(*) as total
            FROM animes a
            JOIN user_animes ua ON a.id = ua.anime_id
            WHERE ua.user_id = ?
        `;
        
        const countArgs: (string | number)[] = [userId];
        
        // Aplicar los mismos filtros que en la consulta principal
        if (searchQuery) {
            countSql += ' AND (a.name LIKE ? OR a.name_mal LIKE ?)';
            countArgs.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }
        if (stateFilter) {
            countSql += ' AND ua.state_name = ?';
            countArgs.push(stateFilter);
        }
        if (yearFilter) {
            countSql += ' AND a.year = ?';
            countArgs.push(parseInt(yearFilter));
        }
        if (seasonFilter) {
            countSql += ' AND a.season_name = ?';
            countArgs.push(seasonFilter);
        }
        if (ratingFilter) {
            const ratingValue = parseFloat(ratingFilter);
            switch (ratingOp) {
                case 'gte':
                    countSql += ' AND CAST(ua.rating_value AS REAL) >= ?';
                    break;
                case 'lte':
                    countSql += ' AND CAST(ua.rating_value AS REAL) <= ?';
                    break;
                case 'eq':
                    countSql += ' AND CAST(ua.rating_value AS REAL) = ?';
                    break;
            }
            countArgs.push(ratingValue);
        }

        const totalResult = await client.execute({
            sql: countSql,
            args: countArgs
        });
        
        const total = totalResult.rows[0]?.total as number || 0;

        // Convertir las filas al formato esperado
        const animes: AnimeRow[] = animesResult.rows.map(row => ({
            id: row.id as number,
            name: row.name as string,
            name_mal: row.name_mal as string | null,
            season: row.season as string,
            total_chapters: row.total_chapters as number | null,
            current_chapter: row.current_chapter as number | null,
            state_name: row.state_name as string | null,
            rating_value: row.rating_value as string | null,
            year: row.year as number,
            season_name: row.season_name as string | null,
            image_url: row.image_url as string | null,
            created_at: row.created_at as string,
            updated_at: row.updated_at as string,
            user_id: row.user_id as number
        }));

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