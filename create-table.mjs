const sql = `
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

fetch("https://api.supabase.com/v1/projects/khauqgzdxkpejdoijzqf/database/query", {
  method: "POST",
  headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXVxZ3pkeGtwZWpkb2lqenFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM5MzMzNywiZXhwIjoyMDk1OTY5MzM3fQ.smj_DON1TnkIC_X158qBz4xA_Ok3W5dtLhXv3KT5m68",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query: sql })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2))).catch(e => console.error(e.message));
