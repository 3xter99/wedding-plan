-- Events: separate guest lists per event; budget stays global
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_created_at ON events(created_at);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_delete" ON events FOR DELETE TO authenticated USING (true);

ALTER TABLE guests ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- Assign existing guests to a default event when possible
DO $$
DECLARE
  default_user UUID;
  default_event UUID;
BEGIN
  SELECT user_id INTO default_user FROM guests LIMIT 1;
  IF default_user IS NOT NULL THEN
    INSERT INTO events (user_id, name)
    VALUES (default_user, 'Основное мероприятие')
    RETURNING id INTO default_event;
    UPDATE guests SET event_id = default_event WHERE event_id IS NULL;
  END IF;
END $$;

ALTER TABLE guests ALTER COLUMN event_id SET NOT NULL;

CREATE INDEX idx_guests_event_id ON guests(event_id);

ALTER PUBLICATION supabase_realtime ADD TABLE events;
