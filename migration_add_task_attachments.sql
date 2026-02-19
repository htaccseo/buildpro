-- Migration: Add attachments and completion_images to tasks table
ALTER TABLE tasks ADD COLUMN attachments TEXT;
ALTER TABLE tasks ADD COLUMN completion_images TEXT;
