-- Migration to add created_by column to existing tables
ALTER TABLE projects ADD COLUMN created_by TEXT;
ALTER TABLE meetings ADD COLUMN created_by TEXT;
ALTER TABLE invoices ADD COLUMN created_by TEXT;
ALTER TABLE reminders ADD COLUMN created_by TEXT;
ALTER TABLE other_matters ADD COLUMN created_by TEXT;
