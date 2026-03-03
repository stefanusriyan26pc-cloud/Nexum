-- Seed data (optional - run after migrations)
-- Only inserts if tables are empty

INSERT INTO projects (id, name, description, status, progress, due_date, color)
SELECT 
  uuid_generate_v4(),
  'Website Redesign',
  'Overhaul of the main marketing site.',
  'active',
  75,
  '2026-10-15',
  'bg-indigo-500'
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);

INSERT INTO projects (id, name, description, status, progress, due_date, color)
SELECT 
  uuid_generate_v4(),
  'Mobile App Launch',
  'iOS and Android release.',
  'at-risk',
  40,
  '2026-11-01',
  'bg-rose-500'
WHERE (SELECT COUNT(*) FROM projects) < 2;

-- Get project IDs for tasks
DO $$
DECLARE
  p1_id UUID;
  p2_id UUID;
BEGIN
  SELECT id INTO p1_id FROM projects WHERE name = 'Website Redesign' LIMIT 1;
  SELECT id INTO p2_id FROM projects WHERE name = 'Mobile App Launch' LIMIT 1;
  
  IF p1_id IS NOT NULL AND (SELECT COUNT(*) FROM tasks) = 0 THEN
    INSERT INTO tasks (title, status, priority, project_id, due_date)
    VALUES 
      ('Design System Update', 'todo', 'high', p1_id, 'Today'),
      ('Q3 Planning Deck', 'done', 'medium', p1_id, 'Yesterday');
  END IF;
  
  IF p2_id IS NOT NULL THEN
    INSERT INTO tasks (title, status, priority, project_id, due_date)
    SELECT 'API Integration', 'in-progress', 'high', p2_id, 'Next Week'
    WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'API Integration' AND project_id = p2_id);
  END IF;
END $$;

INSERT INTO events (title, date, type, start_time, end_time)
SELECT 'Design Review', '2026-02-26', 'meeting', '10:00', '10:30'
WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1);

INSERT INTO events (title, date, type, start_time, end_time)
SELECT 'Launch App', '2026-02-28', 'milestone', '12:00', '12:30'
WHERE (SELECT COUNT(*) FROM events) < 2;
