-- NISIT MATCH v32: notify on incoming likes and matches only.
-- Run once in Supabase SQL Editor. Does not delete any existing notifications.
-- Old message notifications are hidden by the v32 app, not erased.
BEGIN;

-- Stop generating new notifications for every chat message.
DROP TRIGGER IF EXISTS t_msg ON public.messages;

-- One notification when someone likes you, unless it immediately becomes a match.
-- The existing t_like trigger continues to create match notifications.
CREATE OR REPLACE FUNCTION public.notify_incoming_interest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.is_like IS TRUE
     AND (TG_OP = 'INSERT' OR OLD.is_like IS DISTINCT FROM TRUE)
     AND NOT public.is_blocked_pair(NEW.from_id, NEW.to_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.likes l
       WHERE l.from_id = NEW.to_id AND l.to_id = NEW.from_id AND l.is_like IS TRUE
     ) THEN
    INSERT INTO public.notifications(user_id, type, ref_id)
    VALUES (NEW.to_id, 'interest', NEW.from_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_notify_incoming_interest ON public.likes;
CREATE TRIGGER t_notify_incoming_interest
AFTER INSERT OR UPDATE OF is_like ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.notify_incoming_interest();

-- Queue only interest/match notifications for device push.
-- Existing queue records for messages are marked processed, not deleted.
DO $$
BEGIN
  IF to_regclass('public.push_queue') IS NOT NULL THEN
    UPDATE public.push_queue SET processed_at = now()
    WHERE type NOT IN ('interest','match') AND processed_at IS NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.queue_push_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.type IN ('interest', 'match') AND to_regclass('public.push_queue') IS NOT NULL THEN
    INSERT INTO public.push_queue(notification_id,user_id,type)
    VALUES (NEW.id,NEW.user_id,NEW.type)
    ON CONFLICT(notification_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
COMMIT;
