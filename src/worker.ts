// @ts-nocheck
import { Router } from 'itty-router';

// Define the environment interface
interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
}

const router = Router();

// Middleware to handle CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

const withCors = (response: Response) => {
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
};


// API Endpoints

// GET /api/data?email=...
// Fetch all data for a user (initial load)
router.get('/api/data', async (request, env: Env) => {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) return new Response('Email required', { status: 400 });

    try {
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

        if (!user) {
            // Return empty structure if user not found (client handles signup redirect)
            return Response.json({ user: null });
        }

        const orgId = user.organization_id;
        const organization = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first();

        // Fetch related data
        const { results: projects } = await env.DB.prepare('SELECT * FROM projects WHERE organization_id = ?').bind(orgId).all();

        // Fetch tasks for all projects
        const projectIds = projects.map((p: any) => p.id);
        let tasks: any[] = [];
        if (projectIds.length > 0) {
            const placeholders = projectIds.map(() => '?').join(',');
            const { results } = await env.DB.prepare(`SELECT * FROM tasks WHERE project_id IN (${placeholders})`).bind(...projectIds).all();
            tasks = results || [];
        }

        const { results: users } = await env.DB.prepare('SELECT * FROM users WHERE organization_id = ?').bind(orgId).all();
        const { results: meetings } = await env.DB.prepare('SELECT * FROM meetings WHERE organization_id = ?').bind(orgId).all();
        const { results: invoices } = await env.DB.prepare('SELECT * FROM invoices WHERE organization_id = ?').bind(orgId).all();
        const { results: notifications } = await env.DB.prepare('SELECT * FROM notifications WHERE organization_id = ?').bind(orgId).all();

        return Response.json({
            user,
            organization,
            users,
            projects,
            tasks,
            meetings,
            invoices,
            notifications
        });

    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
});

// POST /api/signup
// Create new organization and user
router.post('/api/signup', async (request, env: Env) => {
    const data = await request.json();
    const { name, email, password, company, role, phone } = data;

    // Transaction? D1 doesn't fully support heavy transactions yet in all modes via fetch, 
    // but we'll do sequential inserts.

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    try {
        // Create Organization
        await env.DB.prepare(
            'INSERT INTO organizations (id, name) VALUES (?, ?)'
        ).bind(orgId, company).run();

        // Create User
        await env.DB.prepare(
            'INSERT INTO users (id, organization_id, name, email, role, company, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(userId, orgId, name, email, role, company, 1).run();

        return Response.json({ success: true, userId, orgId });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
});

// POST /api/project
router.post('/api/project', async (request, env: Env) => {
    const project = await request.json();
    try {
        await env.DB.prepare(`
            INSERT INTO projects (id, organization_id, name, address, client_name, client_email, client_phone, start_date, end_date, color, status, progress)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            project.id, project.organizationId, project.name, project.address, project.clientName,
            project.clientEmail, project.clientPhone, project.startDate, project.endDate, project.color,
            project.status || 'active', project.progress || 0
        ).run();
        return Response.json({ success: true });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
});

// POST /api/task
router.post('/api/task', async (request, env: Env) => {
    const task = await request.json();
    try {
        await env.DB.prepare(`
            INSERT INTO tasks (id, project_id, title, description, status, required_date, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            task.id, task.projectId, task.title, task.description, task.status || 'pending', task.requiredDate, task.assignedTo
        ).run();
        return Response.json({ success: true });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
});

// Default Handler
router.all('*', async (request, env) => {
    // OPTIONS for CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
        return new Response('Not Found', { status: 404 });
    }

    // Serve Assets
    let response = await env.ASSETS.fetch(request);

    // SPA Fallback
    if (response.status === 404 && !url.pathname.includes('.')) {
        response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    return response;
});


export default {
    fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
        const response = await router.handle(request, env, ctx);
        // Apply CORS if it's an API route
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api/')) {
            return withCors(response);
        }
        return response;
    }
};
