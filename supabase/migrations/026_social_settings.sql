INSERT INTO site_settings (key, value) VALUES
  ('social_youtube', ''), ('social_instagram', ''), ('social_tiktok', ''),
  ('social_linkedin', ''), ('social_wechat_qr', '')
ON CONFLICT (key) DO NOTHING;
