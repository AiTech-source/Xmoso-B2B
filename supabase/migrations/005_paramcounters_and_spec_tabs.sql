-- Add editable param_counters, spec_tabs, and eco_features to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS param_counters JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS spec_tabs JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS eco_features JSONB DEFAULT '[
  {"value": "A++", "label": "Energy Rating", "color": "ice"},
  {"value": "0", "label": "Ozone Depletion", "color": "forest"},
  {"value": "85%", "label": "Recyclable", "color": "ice"},
  {"value": "✓", "label": "RoHS Compliant", "color": "forest"}
]';
