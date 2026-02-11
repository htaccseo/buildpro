// @ts-nocheck removed
import { Router } from 'itty-router'; // Unused but kept for reference if needed

// Define the environment interface
interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
}

// Middleware to handle CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

const withCors = (response: Response) => {
    if (!response) {
        // Fallback if null response
        return new Response('Internal Router Error: No response', {
            status: 500,
            headers: corsHeaders
        });
    }

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

export default {
    fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
        // PARANOID GLOBAL TRY-CATCH
        try {
            // Handle CORS Preflight globally and immediately
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    headers: corsHeaders
                });
            }

            const url = new URL(request.url);

            // API Request Handling
            if (url.pathname.startsWith('/api/')) {
                // GET /api/data
                if (url.pathname === '/api/data' && request.method === 'GET') {
                    const logs: string[] = [];
                    logs.push('Start /api/data');

                    try {
                        const email = url.searchParams.get('email');
                        logs.push(`Fetch user for email: ${email}`);

                        if (!email) {
                            return withCors(Response.json({ user: null }));
                        }

                        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
                        logs.push(`User found: ${!!user}`);

                        if (!user) {
                            return withCors(Response.json({ user: null }));
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
                        let projectUpdates: any[] = [];
                        logs.push(`Project IDs: ${projectIds.join(',')}`);

                        if (projectIds.length > 0) {
                            const placeholders = projectIds.map(() => '?').join(',');
                            logs.push(`Fetching tasks with placeholders: ${placeholders}`);
                            const { results: taskResults } = await env.DB.prepare(`SELECT * FROM tasks WHERE project_id IN (${placeholders})`).bind(...projectIds).all();
                            tasks = taskResults || [];

                            logs.push(`Fetching project updates...`);
                            const { results: updateResults } = await env.DB.prepare(`SELECT * FROM project_updates WHERE project_id IN (${placeholders})`).bind(...projectIds).all();
                            projectUpdates = updateResults || [];
                        }
                        logs.push(`Tasks found: ${tasks.length}`);
                        logs.push(`Project Updates found: ${projectUpdates.length}`);

                        logs.push('Fetching other data');
                        const { results: users } = await env.DB.prepare('SELECT * FROM users WHERE organization_id = ?').bind(orgId).all();
                        const { results: meetings } = await env.DB.prepare('SELECT * FROM meetings WHERE organization_id = ?').bind(orgId).all();
                        const { results: invoices } = await env.DB.prepare('SELECT * FROM invoices WHERE organization_id = ?').bind(orgId).all();
                        const { results: notifications } = await env.DB.prepare('SELECT * FROM notifications WHERE organization_id = ?').bind(orgId).all();
                        logs.push('All data fetched');

                        return withCors(Response.json({
                            user,
                            organization,
                            users,
                            projects,
                            tasks,
                            projectUpdates,
                            meetings,
                            invoices,
                            notifications
                        }));

                    } catch (e: any) {
                        return withCors(Response.json({
                            message: `Worker Error in /api/data: ${e.message}`,
                            logs: logs
                        }, { status: 500 }));
                    }
                }

                // POST /api/signup
                if (url.pathname === '/api/signup' && request.method === 'POST') {
                    const logs: string[] = [];
                    logs.push('Start /api/signup (Manual Handler)');
                    console.log('[Worker] Start /api/signup (Manual Handler)');

                    try {
                        let data;
                        try {
                            data = await request.json();
                            logs.push(`Payload received: ${JSON.stringify(data)}`);
                            console.log(`[Worker] Payload received: ${JSON.stringify(data)}`);
                        } catch (jsonErr: any) {
                            logs.push(`JSON Parse Error: ${jsonErr.message}`);
                            console.error(`[Worker] JSON Parse Error: ${jsonErr.message}`);
                            throw new Error(`Invalid JSON body: ${jsonErr.message}`);
                        }

                        const { name, email, password, company, role, phone } = data;

                        const orgId = generateUUID();
                        const userId = generateUUID();
                        logs.push(`Generated IDs: Org=${orgId}, User=${userId}`);
                        console.log(`[Worker] Generated IDs: Org=${orgId}, User=${userId}`);

                        // Create Organization
                        logs.push(`Inserting Org: ${company}`);
                        console.log(`[Worker] Inserting Org: ${company} (ID: ${orgId})`);
                        try {
                            const orgResult = await env.DB.prepare(
                                'INSERT INTO organizations (id, name) VALUES (?, ?)'
                            ).bind(orgId, company || null).run();
                            console.log(`[Worker] Org Insert Result: ${JSON.stringify(orgResult)}`);
                        } catch (dbErr: any) {
                            console.error(`[Worker] DB Org Insert Error: ${dbErr.message}`);
                            logs.push(`DB Org Insert Error: ${dbErr.message}`);
                            throw dbErr;
                        }

                        logs.push('Org Inserted');
                        console.log('[Worker] Org Inserted');

                        // Create User
                        logs.push(`Inserting User: ${email}, Role: ${role}`);
                        console.log(`[Worker] Inserting User: ${email} (ID: ${userId})`);
                        try {
                            const userResult = await env.DB.prepare(
                                'INSERT INTO users (id, organization_id, name, email, role, company, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)'
                            ).bind(userId, orgId, name || null, email || null, role || null, company || null, 1).run();
                            console.log(`[Worker] User Insert Result: ${JSON.stringify(userResult)}`);
                        } catch (dbErr: any) {
                            console.error(`[Worker] DB User Insert Error: ${dbErr.message}`);
                            logs.push(`DB User Insert Error: ${dbErr.message}`);
                            throw dbErr;
                        }

                        logs.push('User Inserted');
                        console.log('[Worker] User Inserted');

                        return withCors(Response.json({ success: true, userId, orgId, logs }));

                    } catch (e: any) {
                        console.error(`[Worker] Signup Fatal Error: ${e.message}`, e.stack);
                        return withCors(Response.json({
                            message: `Signup Error: ${e.message}`,
                            stack: e.stack,
                            logs: logs
                        }, { status: 500 }));
                    }
                }

                // POST /api/project
                if (url.pathname === '/api/project' && request.method === 'POST') {
                    try {
                        const project = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO projects (id, organization_id, name, address, client_name, client_email, client_phone, start_date, end_date, color, status, progress)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            project.id, project.organizationId, project.name, project.address || null, project.clientName || null,
                            project.clientEmail || null, project.clientPhone || null, project.startDate || null, project.endDate || null, project.color || null,
                            project.status || 'active', project.progress || 0
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Project Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/task
                if (url.pathname === '/api/task' && request.method === 'POST') {
                    try {
                        const task = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO tasks (id, project_id, title, description, status, required_date, assigned_to)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            task.id, task.projectId, task.title, task.description || null, task.status || 'pending', task.requiredDate || null, task.assignedTo || null
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Task Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/project/update
                if (url.pathname === '/api/project/update' && request.method === 'POST') {
                    try {
                        const project = await request.json();
                        // Only update fields that are typically editable
                        await env.DB.prepare(`
                            UPDATE projects 
                            SET name = ?, address = ?, status = ?, progress = ?, start_date = ?, end_date = ?
                            WHERE id = ?
                        `).bind(
                            project.name, project.address || null, project.status || 'active', project.progress || 0, project.startDate || null, project.endDate || null, project.id
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Project Update Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/task/update
                if (url.pathname === '/api/task/update' && request.method === 'POST') {
                    try {
                        const task = await request.json();
                        await env.DB.prepare(`
                            UPDATE tasks 
                            SET title = ?, description = ?, status = ?, required_date = ?, assigned_to = ?
                            WHERE id = ?
                        `).bind(
                            task.title, task.description || null, task.status || 'pending', task.requiredDate || null, task.assignedTo || null, task.id
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Task Update Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/task/complete
                if (url.pathname === '/api/task/complete' && request.method === 'POST') {
                    try {
                        const data = await request.json();
                        await env.DB.prepare(`
                            UPDATE tasks 
                            SET status = 'completed', completed_at = ?, completion_note = ?, completion_image = ?
                            WHERE id = ?
                        `).bind(
                            new Date().toISOString(), data.note || null, data.image || null, data.taskId
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Task Complete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/invite
                if (url.pathname === '/api/invite' && request.method === 'POST') {
                    try {
                        const data = await request.json();
                        const { email, role, organizationId } = data;

                        // Check if user exists
                        const existingUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

                        // Ideally send email here. For now, we simulate success or create a placeholder if needed.
                        // In this app design, invites are links.

                        return withCors(Response.json({ success: true, link: `https://buildpro.old-dream-22e5.workers.dev/login?orgId=${organizationId}&email=${email}&role=${role}` }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Invite Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/invoice
                if (url.pathname === '/api/invoice' && request.method === 'POST') {
                    try {
                        const invoice = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO invoices (id, organization_id, type, amount, client_name, due_date, status, date, description, project_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            invoice.id, invoice.organizationId, invoice.type, invoice.amount, invoice.clientName || null, invoice.dueDate || null, invoice.status || 'pending', invoice.date || null, invoice.description || null, invoice.projectId || null
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Invoice Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/meeting
                if (url.pathname === '/api/meeting' && request.method === 'POST') {
                    try {
                        const meeting = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO meetings (id, organization_id, title, date, time, project_id, attendees, address)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            meeting.id, meeting.organizationId, meeting.title, meeting.date, meeting.time, meeting.projectId || null, meeting.attendees ? JSON.stringify(meeting.attendees) : '[]', meeting.address || null
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Meeting Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/project/update-post (Progress Notification)
                if (url.pathname === '/api/project/update-post' && request.method === 'POST') {
                    try {
                        const update = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO project_updates (id, project_id, message, date, author_name)
                            VALUES (?, ?, ?, ?, ?)
                        `).bind(
                            update.id, update.projectId, update.message, update.date, update.authorName
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Project Update Post Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/notification
                if (url.pathname === '/api/notification' && request.method === 'POST') {
                    try {
                        const notification = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO notifications (id, organization_id, user_id, message, read, date, type, data)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            notification.id, notification.organizationId, notification.userId, notification.message, notification.read ? 1 : 0, notification.date || null, notification.type || null, notification.data ? JSON.stringify(notification.data) : '{}'
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Notification Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/user/update
                if (url.pathname === '/api/user/update' && request.method === 'POST') {
                    try {
                        const user = await request.json();
                        await env.DB.prepare(`
                            UPDATE users 
                            SET name = ?, email = ?, phone = ?, company = ?, role = ?
                            WHERE id = ?
                        `).bind(
                            user.name, user.email, user.phone || null, user.company || null, user.role, user.id
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `User Update Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // 404 for unknown API
                return new Response('API Endpoint Not Found', { status: 404 });
            }

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

            // Asset Handling (Bypassing Router for performance and safety)
            try {
                let response = await env.ASSETS.fetch(request);

                if (response.status === 404 && !url.pathname.includes('.')) {
                    const indexRequest = new Request(new URL('/index.html', request.url), request);
                    response = await env.ASSETS.fetch(indexRequest);
                }
                return response;
            } catch (e: any) {
                return new Response(`Worker Global Asset Error: ${e.message}\n${e.stack}`, { status: 500 });
            }

        } catch (globalError: any) {
            // This catches completely unexpected errors (like syntax errors at runtime, or weird env issues)
            return new Response(`CRITICAL WORKER FAILURE: ${globalError.message}\n${globalError.stack}`, { status: 500 });
        }
    }
};
