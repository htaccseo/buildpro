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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
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

// Safe JSON Parse Helper for Lists
function safeParseList(data: any): string[] {
    if (!data) return [];
    if (Array.isArray(data)) return data; // Already an array
    if (typeof data === 'string') {
        const trimmed = data.trim();
        if (trimmed.startsWith('[')) {
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                console.error("JSON Parse Error:", e, data);
                return [];
            }
        }
        // Treat as single item if not JSON array
        return trimmed ? [trimmed] : [];
    }
    // Fallback for other types
    return [];
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

                        const projectIds = (projects || []).map((p: any) => p.id);
                        let tasks: any[] = [];
                        let projectUpdates: any[] = [];
                        let comments: any[] = [];
                        logs.push(`Project IDs: ${projectIds.join(',')}`);

                        if (projectIds.length > 0) {
                            const placeholders = projectIds.map(() => '?').join(',');
                            logs.push(`Fetching tasks with placeholders: ${placeholders}`);
                            const { results: taskResults } = await env.DB.prepare(`SELECT * FROM tasks WHERE project_id IN (${placeholders})`).bind(...projectIds).all();
                            tasks = (taskResults || []).map((t: any) => ({
                                ...t,
                                attachments: t.attachments ? JSON.parse(t.attachments) : [],
                                completionImages: t.completion_images ? JSON.parse(t.completion_images) : []
                            }));

                            logs.push(`Fetching project updates...`);
                            const { results: updateResults } = await env.DB.prepare(`SELECT * FROM project_updates WHERE project_id IN (${placeholders})`).bind(...projectIds).all();
                            projectUpdates = (updateResults || []).map((u: any) => ({
                                ...u,
                                userId: u.user_id,
                                authorName: u.author_name
                            }));

                            // Fetch Comments
                            logs.push('Fetching comments');
                            const { results: commentResults } = await env.DB.prepare(`
                                SELECT * FROM task_comments WHERE task_id IN (
                                    SELECT id FROM tasks WHERE project_id IN (${placeholders})
                                )
                            `).bind(...projectIds).all();
                            comments = commentResults || [];
                            logs.push(`Comments found: ${comments.length}`);
                        }
                        logs.push(`Tasks found: ${tasks.length}`);
                        logs.push(`Project Updates found: ${projectUpdates.length}`);

                        logs.push('Fetching other data');
                        const { results: users } = await env.DB.prepare('SELECT * FROM users WHERE organization_id = ?').bind(orgId).all();
                        const { results: meetings } = await env.DB.prepare('SELECT * FROM meetings WHERE organization_id = ?').bind(orgId).all();
                        const { results: invoices } = await env.DB.prepare('SELECT * FROM invoices WHERE organization_id = ?').bind(orgId).all();
                        const { results: notifications } = await env.DB.prepare('SELECT * FROM notifications WHERE organization_id = ?').bind(orgId).all();
                        const { results: reminders } = await env.DB.prepare('SELECT * FROM reminders WHERE organization_id = ?').bind(orgId).all();
                        const { results: otherMatters } = await env.DB.prepare('SELECT * FROM other_matters WHERE organization_id = ?').bind(orgId).all();
                        logs.push('All data fetched');

                        // Map comments to tasks
                        tasks = tasks.map(t => ({
                            ...t,
                            projectId: t.project_id,
                            requiredDate: t.required_date,
                            assignedTo: t.assigned_to,
                            createdBy: t.created_by,
                            completedAt: t.completed_at,
                            completionNote: t.completion_note,
                            completionImages: safeParseList(t.completion_images),
                            attachments: safeParseList(t.attachments),
                            comments: comments
                                ? comments
                                    .filter((c: any) => c.task_id === t.id)
                                    .map((c: any) => ({
                                        id: c.id,
                                        taskId: c.task_id,
                                        userId: c.user_id,
                                        message: c.message,
                                        images: safeParseList(c.images),
                                        createdAt: c.created_at
                                    }))
                                : []
                        }));

                        return withCors(Response.json({
                            user,
                            organization,
                            users,
                            projects,
                            tasks,
                            projectUpdates,
                            meetings,
                            invoices,
                            notifications,
                            reminders: reminders || [],
                            otherMatters: otherMatters || []
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

                        const { name, email, password, company, role, phone, organizationId } = data;

                        let orgId = organizationId;
                        const userId = generateUUID();
                        logs.push(`IDs: Org=${orgId || 'New'}, User=${userId}`);

                        if (!orgId) {
                            orgId = generateUUID();
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
                        } else {
                            logs.push(`Joining Existing Org: ${orgId}`);
                        }

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
                            INSERT INTO projects (id, organization_id, name, address, client_name, client_email, client_phone, start_date, end_date, color, status, progress, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            project.id, project.organizationId, project.name, project.address || null, project.clientName || null,
                            project.clientEmail || null, project.clientPhone || null, project.startDate || null, project.endDate || null, project.color || null,
                            project.status || 'active', project.progress || 0, project.createdBy || null
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
                            INSERT INTO tasks (id, project_id, title, description, status, required_date, assigned_to, created_by, attachments)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            task.id, task.projectId, task.title, task.description || null, task.status || 'pending', task.requiredDate || null, task.assignedTo || null, task.createdBy || null, JSON.stringify(task.attachments || [])
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
                            SET title = ?, description = ?, status = ?, required_date = ?, assigned_to = ?, attachments = ?
                            WHERE id = ?
                        `).bind(
                            task.title, task.description || null, task.status || 'pending', task.requiredDate || null, task.assignedTo || null, JSON.stringify(task.attachments || []), task.id
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

                        // Fetch task to get created_by and project name
                        const task: any = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(data.taskId).first();
                        const project: any = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(task.project_id).first();
                        const completedByUser: any = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(data.completedBy).first();

                        const now = new Date().toISOString();

                        await env.DB.prepare(`
                            UPDATE tasks 
                            SET status = 'completed', completed_at = ?, completion_note = ?, completion_image = ?, completion_images = ?, completed_by = ?
                            WHERE id = ?
                        `).bind(
                            now, data.note || null, data.image || null, JSON.stringify(data.completionImages || []), data.completedBy || null, data.taskId
                        ).run();

                        // Create Notification for the Task Creator (if they didn't complete it themselves)
                        // If I complete my own task, I don't need a notification.
                        if (task && task.created_by && task.created_by !== data.completedBy) {
                            const notificationId = crypto.randomUUID();
                            const message = `Task "${task.title}" in ${project ? project.name : 'Project'} completed by ${completedByUser ? completedByUser.name : 'Assignee'}`;

                            await env.DB.prepare(`
                                INSERT INTO notifications (id, organization_id, user_id, message, read, date, type, data)
                                VALUES (?, ?, ?, ?, 0, ?, 'task_completed', ?)
                             `).bind(
                                notificationId, task.organization_id || project.organization_id, task.created_by, message, now, JSON.stringify({ taskId: data.taskId })
                            ).run();
                        }

                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Task Complete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/task/uncomplete
                if (url.pathname === '/api/task/uncomplete' && request.method === 'POST') {
                    try {
                        const data = await request.json();
                        await env.DB.prepare(`
                            UPDATE tasks 
                            SET status = 'pending', completed_at = NULL, completion_note = NULL, completion_image = NULL, completion_images = NULL
                            WHERE id = ?
                        `).bind(data.taskId).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Task Uncomplete Error: ${e.message}` }, { status: 500 }));
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
                        const insertQuery = `
                            INSERT INTO invoices (id, organization_id, type, amount, client_name, due_date, status, date, description, project_id, created_by, attachment_url)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        try {
                            await env.DB.prepare(insertQuery).bind(
                                invoice.id, invoice.organizationId, invoice.type, invoice.amount, invoice.clientName || null, invoice.dueDate || null, invoice.status || 'pending', invoice.date || null, invoice.description || null, invoice.projectId || null, invoice.createdBy || null, invoice.attachmentUrl || null
                            ).run();
                        } catch (err: any) {
                            // CATCH D1 SPECIFIC ERROR MESSAGES
                            // Standard SQLite: "no such column: attachment_url"
                            // Cloudflare D1: "table invoices has no column named attachment_url"
                            const errorMsg = (err.message || '').toLowerCase();
                            if (errorMsg.includes('no such column') || errorMsg.includes('no column named') || errorMsg.includes('has no column')) {
                                console.log('Attempting auto-migration: Adding attachment_url column');
                                await env.DB.prepare('ALTER TABLE invoices ADD COLUMN attachment_url TEXT').run();
                                // Retry
                                await env.DB.prepare(insertQuery).bind(
                                    invoice.id, invoice.organizationId, invoice.type, invoice.amount, invoice.clientName || null, invoice.dueDate || null, invoice.status || 'pending', invoice.date || null, invoice.description || null, invoice.projectId || null, invoice.createdBy || null, invoice.attachmentUrl || null
                                ).run();
                            } else {
                                throw err;
                            }
                        }
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Invoice Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/invoice/update
                if (url.pathname === '/api/invoice/update' && request.method === 'POST') {
                    try {
                        const invoice = await request.json();
                        const updateQuery = `
                            UPDATE invoices 
                            SET type = ?, amount = ?, client_name = ?, due_date = ?, status = ?, date = ?, description = ?, attachment_url = ?
                            WHERE id = ?
                        `;
                        try {
                            await env.DB.prepare(updateQuery).bind(
                                invoice.type, invoice.amount, invoice.clientName || null, invoice.dueDate || null, invoice.status || 'pending', invoice.date || null, invoice.description || null, invoice.attachmentUrl || null, invoice.id
                            ).run();
                        } catch (err: any) {
                            // CATCH D1 SPECIFIC ERROR MESSAGES
                            const errorMsg = (err.message || '').toLowerCase();
                            if (errorMsg.includes('no such column') || errorMsg.includes('no column named') || errorMsg.includes('has no column')) {
                                console.log('Attempting auto-migration: Adding attachment_url column');
                                await env.DB.prepare('ALTER TABLE invoices ADD COLUMN attachment_url TEXT').run();
                                // Retry
                                await env.DB.prepare(updateQuery).bind(
                                    invoice.type, invoice.amount, invoice.clientName || null, invoice.dueDate || null, invoice.status || 'pending', invoice.date || null, invoice.description || null, invoice.attachmentUrl || null, invoice.id
                                ).run();
                            } else {
                                throw err;
                            }
                        }
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Invoice Update Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // DELETE /api/invoice
                if (url.pathname === '/api/invoice' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        await env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Invoice Delete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/meeting
                if (url.pathname === '/api/meeting' && request.method === 'POST') {
                    try {
                        const meeting = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO meetings (id, organization_id, title, date, time, project_id, attendees, address, description, created_by, assigned_to, completed)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            meeting.id, meeting.organizationId, meeting.title, meeting.date, meeting.time, meeting.projectId || null, JSON.stringify(meeting.attendees || []), meeting.address || null, meeting.description || null, meeting.createdBy || null, meeting.assignedTo || null, meeting.completed ? 1 : 0
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Meeting Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/meeting/update
                if (url.pathname === '/api/meeting/update' && request.method === 'POST') {
                    try {
                        const meeting = await request.json();
                        // This handles both content updates and completion toggles
                        // We update all fields to be safe, but primarily used for completion and basic edits
                        await env.DB.prepare(`
                            UPDATE meetings 
                            SET title = ?, date = ?, time = ?, address = ?, description = ?, assigned_to = ?, completed = ?, completed_by = ?
                            WHERE id = ?
                        `).bind(
                            meeting.title, meeting.date, meeting.time, meeting.address || null, meeting.description || null, meeting.assignedTo || null, meeting.completed ? 1 : 0, meeting.completedBy || null, meeting.id
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Meeting Update Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // DELETE /api/meeting
                if (url.pathname === '/api/meeting' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        await env.DB.prepare('DELETE FROM meetings WHERE id = ?').bind(id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Meeting Delete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/project/update-post (Progress Notification)
                if (url.pathname === '/api/project/update-post' && request.method === 'POST') {
                    try {
                        const update = await request.json();
                        // Debug log
                        console.log('Project Update Payload:', JSON.stringify(update));

                        await env.DB.prepare(`
                            INSERT INTO project_updates (id, project_id, message, date, author_name, user_id)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `).bind(
                            update.id || null, update.projectId || null, update.message || null, update.date || null, update.authorName || 'Admin', update.userId || null
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Project Update Post Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // PUT /api/project/update
                if (url.pathname === '/api/project/update' && request.method === 'PUT') {
                    try {
                        const { id, message } = await request.json();
                        await env.DB.prepare('UPDATE project_updates SET message = ? WHERE id = ?').bind(message, id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Project Update Update Error: ${e.message}` }, { status: 500 }));
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

                // POST /api/reminder
                if (url.pathname === '/api/reminder' && request.method === 'POST') {
                    try {
                        const reminder = await request.json();
                        console.log('Creating Reminder:', JSON.stringify(reminder, null, 2));

                        const query = `
                            INSERT INTO reminders (id, organization_id, title, description, date, completed, created_by, assigned_to)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        await env.DB.prepare(query).bind(
                            reminder.id, reminder.organizationId, reminder.title, reminder.description || null, reminder.date || null, reminder.completed ? 1 : 0, reminder.createdBy || null, reminder.assignedTo || null
                        ).run();

                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        console.error('Reminder Creation Failed:', e);
                        console.error('Error Message:', e.message);
                        console.error('Stack:', e.stack);
                        return withCors(Response.json({ message: `Reminder Error: ${e.message}`, stack: e.stack }, { status: 500 }));
                    }
                }

                // POST /api/reminder/update
                if (url.pathname === '/api/reminder/update' && request.method === 'POST') {
                    try {
                        const reminder = await request.json();
                        console.log('Updating Reminder:', JSON.stringify(reminder, null, 2));

                        const result = await env.DB.prepare(`
                            UPDATE reminders 
                            SET title = ?, description = ?, date = ?, assigned_to = ?, completed = ?, completed_by = ?
                            WHERE id = ?
                        `).bind(
                            reminder.title, reminder.description || null, reminder.date || null, reminder.assignedTo || null, reminder.completed ? 1 : 0, reminder.completedBy || null, reminder.id
                        ).run();

                        console.log('Reminder Update Result:', JSON.stringify(result));
                        return withCors(Response.json({ success: true, result }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Reminder Update Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // DELETE /api/reminder
                if (url.pathname === '/api/reminder' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        await env.DB.prepare('DELETE FROM reminders WHERE id = ?').bind(id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Reminder Delete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/other-matter
                if (url.pathname === '/api/other-matter' && request.method === 'POST') {
                    try {
                        const matter = await request.json();
                        await env.DB.prepare(`
                            INSERT INTO other_matters (id, organization_id, title, address, note, date, created_by, assigned_to)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            matter.id, matter.organizationId, matter.title, matter.address || null, matter.note || null, matter.date || null, matter.createdBy || null, matter.assignedTo || null
                        ).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Other Matter Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // DELETE /api/other-matter
                if (url.pathname === '/api/other-matter' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        await env.DB.prepare('DELETE FROM other_matters WHERE id = ?').bind(id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Other Matter Delete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // PUT /api/other-matter
                if (url.pathname === '/api/other-matter' && request.method === 'PUT') {
                    try {
                        const { id, title, address, note, assignedTo } = await request.json();
                        await env.DB.prepare('UPDATE other_matters SET title = ?, address = ?, note = ?, assigned_to = ? WHERE id = ?')
                            .bind(title, address, note, assignedTo || null, id)
                            .run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Other Matter Update Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // DELETE /api/project
                if (url.pathname === '/api/project' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        // Manual cascade delete
                        await env.DB.batch([
                            env.DB.prepare('DELETE FROM tasks WHERE project_id = ?').bind(id),
                            env.DB.prepare('DELETE FROM project_updates WHERE project_id = ?').bind(id),
                            env.DB.prepare('DELETE FROM invoices WHERE project_id = ?').bind(id),
                            env.DB.prepare('DELETE FROM meetings WHERE project_id = ?').bind(id),
                            env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id)
                        ]);
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Destructive Project Delete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // DELETE /api/task
                if (url.pathname === '/api/task' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Task Delete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // DELETE /api/project/update
                if (url.pathname === '/api/project/update' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        await env.DB.prepare('DELETE FROM project_updates WHERE id = ?').bind(id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Project Update Delete Error: ${e.message}` }, { status: 500 }));
                    }
                }

                // POST /api/task/comment
                if (url.pathname === '/api/task/comment' && request.method === 'POST') {
                    const { taskId, userId, message, images } = await request.json() as any;
                    const id = generateUUID();
                    const createdAt = new Date().toISOString();

                    await env.DB.prepare(`
                        INSERT INTO task_comments (id, task_id, user_id, message, images, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).bind(
                        id, taskId, userId, message, JSON.stringify(images || []), createdAt
                    ).run();

                    return withCors(Response.json({ success: true, id }));
                }

                // DELETE /api/task/comment
                if (url.pathname === '/api/task/comment' && request.method === 'DELETE') {
                    try {
                        const { id } = await request.json();
                        await env.DB.prepare('DELETE FROM task_comments WHERE id = ?').bind(id).run();
                        return withCors(Response.json({ success: true }));
                    } catch (e: any) {
                        return withCors(Response.json({ message: `Comment Delete Error: ${e.message}` }, { status: 500 }));
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
                // explicit SPA routing: if path is not API and not a file, serve index.html (via root / to avoid 307)
                if (!url.pathname.startsWith('/api') && !url.pathname.includes('.')) {
                    const indexRequest = new Request(new URL('/', request.url), request);
                    return await env.ASSETS.fetch(indexRequest);
                }

                let response = await env.ASSETS.fetch(request);

                if (response.status === 404 && !url.pathname.includes('.')) {
                    const indexRequest = new Request(new URL('/', request.url), request);
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
