-- Existing databases only: run once before deploying the contact-aware Worker.
-- Preserves all existing feedback and gives older submissions an empty contact.
ALTER TABLE feedback ADD COLUMN contact TEXT NOT NULL DEFAULT '';
