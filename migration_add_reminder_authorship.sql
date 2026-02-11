-- Migration to add assignment and completion columns to reminders
ALTER TABLE reminders ADD COLUMN assigned_to TEXT;
ALTER TABLE reminders ADD COLUMN completed_by TEXT;
