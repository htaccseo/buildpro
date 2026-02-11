-- Migration to add authorship columns to tasks and project_updates
ALTER TABLE tasks ADD COLUMN created_by TEXT;
ALTER TABLE tasks ADD COLUMN completed_by TEXT;
ALTER TABLE project_updates ADD COLUMN user_id TEXT;
