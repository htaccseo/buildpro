-- Migration to add created_by column to reminders table
-- This is required because the previous migration missed this column, causing INSERTs to fail
ALTER TABLE reminders ADD COLUMN created_by TEXT;
