-- Allow dropping tables for clean reset (dev only, apply with caution in prod)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;

CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'active',
    subscription_status TEXT DEFAULT 'trial'
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL, -- 'builder', 'worker', 'admin'
    company TEXT,
    avatar TEXT,
    is_admin INTEGER DEFAULT 0,
    is_super_admin INTEGER DEFAULT 0,
    password_hash TEXT, -- Simplified for demo
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    status TEXT DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    color TEXT,
    created_by TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'in-progress', 'completed'
    required_date TEXT,
    assigned_to TEXT, -- User ID
    completed_at TEXT,
    completion_note TEXT,
    completion_image TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE meetings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    project_id TEXT,
    attendees TEXT, -- JSON array of User IDs
    address TEXT,
    created_by TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'sent', 'received'
    amount REAL NOT NULL,
    client_name TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'pending',
    date TEXT,
    description TEXT,
    project_id TEXT,
    created_by TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    date TEXT,
    type TEXT,
    data TEXT, -- JSON blob
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE reminders (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    completed INTEGER DEFAULT 0,
    created_by TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE other_matters (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    title TEXT NOT NULL,
    address TEXT,
    note TEXT,
    date TEXT,
    created_by TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
