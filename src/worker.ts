// @ts-nocheck removed
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
    if (!response) return new Response('Internal Router Error', { status: 500 });

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

// UUID Helper (Manual implementation to be safe)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// API Endpoints

// GET /api/data?email=...
router.get('/api/data', async (request: Request, env: Env) => {
    const logs: string[] = [];
    logs.push('Start /api/data');

    try {
        const url = new URL(request.url);
        const email = url.searchParams.get('email');
        logs.push(`Fetch user for email: ${email}`);

        if (!email) {
            return Response.json({ user: null });
        }

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        logs.push(`User found: ${!!user}`);

        if (!user) {
            return Response.json({ user: null });
        }

        const orgId = user.organization_id;
        logs.push(`Org ID: ${orgId}`);

        logs.push('Fetching organization');
        const organization = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first();
        logs.push(`Organization found: ${!!organization}`);

        logs.push('Fetching projects');
        const { results: projects } = await env.DB.prepare('SELECT * FROM projects WHERE organization_id = ?').bind(orgId).all();
        logs.push(`Projects found: ${projects?.length}`);

        // Fetch tasks for all projects
        const projectIds = (projects || []).map((p: any) => p.id);
        let tasks: any[] = [];
        logs.push(`Project IDs: ${projectIds.join(',')}`);

        if (projectIds.length > 0) {
            const placeholders = projectIds.map(() => '?').join(',');
            logs.push(`Fetching tasks with placeholders: ${placeholders}`);
            const { results } = await env.DB.prepare(`SELECT * FROM tasks WHERE project_id IN (${placeholders})`).bind(...projectIds).all();
            tasks = results || [];
        }
        logs.push(`Tasks found: ${tasks.length}`);

        logs.push('Fetching other data');
        const { results: users } = await env.DB.prepare('SELECT * FROM users WHERE organization_id = ?').bind(orgId).all();
        const { results: meetings } = await env.DB.prepare('SELECT * FROM meetings WHERE organization_id = ?').bind(orgId).all();
        const { results: invoices } = await env.DB.prepare('SELECT * FROM invoices WHERE organization_id = ?').bind(orgId).all();
        const { results: notifications } = await env.DB.prepare('SELECT * FROM notifications WHERE organization_id = ?').bind(orgId).all();
        logs.push('All data fetched');

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
        return Response.json({
            message: `Worker Error in /api/data: ${e.message}`,
            logs: logs
        }, { status: 500 });
    }
});

// POST /api/signup
router.post('/api/signup', async (request, env: Env) => {
    const logs: string[] = [];
    logs.push('Start /api/signup');

    try {
        const data = await request.json();
        logs.push(`Payload received: ${JSON.stringify(data)}`);

        const { name, email, password, company, role, phone } = data;

        const orgId = generateUUID();
        const userId = generateUUID();
        logs.push(`Generated IDs: Org=${orgId}, User=${userId}`);

        // Create Organization
        logs.push(`Inserting Org: ${company}`);
        await env.DB.prepare(
            'INSERT INTO organizations (id, name) VALUES (?, ?)'
        ).bind(orgId, company || null).run();
        logs.push('Org Inserted');

        // Create User
        logs.push(`Inserting User: ${email}, Role: ${role}`);
        await env.DB.prepare(
            'INSERT INTO users (id, organization_id, name, email, role, company, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(userId, orgId, name || null, email || null, role || null, company || null, 1).run();
        logs.push('User Inserted');

        return Response.json({ success: true, userId, orgId });
    } catch (e: any) {
        return Response.json({
            message: `Signup Error: ${e.message}`,
            stack: e.stack,
            logs: logs
        }, { status: 500 });
    }
});

// POST /api/project
router.post('/api/project', async (request, env: Env) => {
    try {
        const project = await request.json();
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
        return new Response(`Project Error: ${e.message}`, { status: 500 });
    }
});

// POST /api/task
router.post('/api/task', async (request, env: Env) => {
    try {
        const task = await request.json();
        await env.DB.prepare(`
            INSERT INTO tasks (id, project_id, title, description, status, required_date, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            task.id, task.projectId, task.title, task.description, task.status || 'pending', task.requiredDate, task.assignedTo
        ).run();
        return Response.json({ success: true });
    } catch (e: any) {
        return new Response(`Task Error: ${e.message}`, { status: 500 });
    }
});

// 404 Handler for API
router.all('/api/*', () => new Response('API Endpoint Not Found', { status: 404 }));

export default {
    fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
        // Emergency Debug Check
        if (request.url.endsWith('/debug')) {
            const dbStatus = env.DB ? 'Present' : 'Missing';
            const assetsStatus = env.ASSETS ? 'Present' : 'Missing';

            let dbCheck = 'Not attempted';
            try {
                const { results } = await env.DB.prepare('SELECT * FROM users LIMIT 1').all();
                dbCheck = `Success (Found ${results.length} users). Sample: ${JSON.stringify(results[0] || {})}`;
            } catch (e: any) {
                dbCheck = `Failed: ${e.message}`;
            }

            let assetCheck = 'Not attempted';
            try {
                const assetReq = new Request(new URL('/index.html', request.url));
                const assetRes = await env.ASSETS.fetch(assetReq);
                assetCheck = `Success (${assetRes.status})`;
            } catch (e: any) {
                assetCheck = `Failed: ${e.message}`;
            }

            return new Response(`Worker Status:
- DB Binding: ${dbStatus}
- DB Query: ${dbCheck}
- ASSETS Binding: ${assetsStatus}
- Index Asset Fetch: ${assetCheck}
`);
        }

        const url = new URL(request.url);

        // API Request Handling
        if (url.pathname.startsWith('/api/')) {
            try {
                const response = await router.handle(request, env, ctx);
                if (!response) {
                    return new Response('API Router returned no response', { status: 500 });
                }
                return withCors(response);
            } catch (e: any) {
                return new Response(`Worker Global API Error: ${e.message}\n${e.stack}`, { status: 500 });
            }
        }

        // Asset Handling (Bypassing Router for performance and safety)
        try {
            let response = await env.ASSETS.fetch(request);

            if (response.status === 404 && !url.pathname.includes('.')) {
                const indexRequest = new Request(new URL('/index.html', request.url), request);
                response = await env.ASSETS.fetch(indexRequest);
            }
            return response;
        } catch (e: any) {
            // Check if it's an API request to return JSON
            if (request.url.includes('/api/')) {
                return withCors(Response.json({
                    message: `Worker Global Error: ${e.message}`,
                    stack: e.stack,
                    logs: [] // Add logs if available in scope context in future
                }, { status: 500 }));
            }
            return new Response(`Worker Global Error: ${e.message}\n${e.stack}`, { status: 500 });
        }
    }
};
