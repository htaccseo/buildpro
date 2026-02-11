-- Migration to enhance meetings and other_matters tables
ALTER TABLE meetings ADD COLUMN description TEXT;
ALTER TABLE meetings ADD COLUMN assigned_to TEXT;
ALTER TABLE meetings ADD COLUMN completed INTEGER DEFAULT 0;
ALTER TABLE meetings ADD COLUMN completed_by TEXT;

ALTER TABLE other_matters ADD COLUMN assigned_to TEXT;
