-- Add show_banner toggle and vignette_enabled to page_contents
ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS show_banner BOOLEAN DEFAULT true;
ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS vignette_enabled BOOLEAN DEFAULT true;

-- Update existing records
UPDATE page_contents SET show_banner = true, vignette_enabled = true WHERE show_banner IS NULL;
