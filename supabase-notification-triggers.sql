-- =====================================================
-- HMAPP Notification Triggers
-- Created: 21 نوفمبر 2025
-- =====================================================

-- Function: Create Notification Helper
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, FALSE, NOW());
END;
$$;


-- Trigger 1: Notify customer when technician submits offer
-- =====================================================
CREATE OR REPLACE FUNCTION notify_customer_new_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_user_id UUID;
  v_job_title TEXT;
  v_technician_name TEXT;
BEGIN
  -- Get customer user_id and job title
  SELECT c.user_id, j.title
  INTO v_customer_user_id, v_job_title
  FROM jobs j
  JOIN customers c ON j.customer_id = c.id
  WHERE j.id = NEW.job_id;

  -- Get technician name
  SELECT full_name INTO v_technician_name
  FROM technicians
  WHERE id = NEW.technician_id;

  -- Create notification
  PERFORM create_notification(
    v_customer_user_id,
    'job_offer',
    'عرض سعر جديد 💼',
    v_technician_name || ' قدم عرض سعر بقيمة ' || NEW.amount || ' ريال لوظيفة "' || v_job_title || '"',
    '/jobs/' || NEW.job_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_customer_new_offer ON price_offers;
CREATE TRIGGER trigger_notify_customer_new_offer
AFTER INSERT ON price_offers
FOR EACH ROW
EXECUTE FUNCTION notify_customer_new_offer();


-- Trigger 2: Notify technician when offer accepted
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_offer_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_technician_user_id UUID;
  v_job_title TEXT;
BEGIN
  -- Check if status changed to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get technician user_id
    SELECT user_id INTO v_technician_user_id
    FROM technicians
    WHERE id = NEW.technician_id;

    -- Get job title
    SELECT title INTO v_job_title
    FROM jobs
    WHERE id = NEW.job_id;

    -- Create notification
    PERFORM create_notification(
      v_technician_user_id,
      'offer_accepted',
      'تم قبول عرضك ✅',
      'تم قبول عرضك بقيمة ' || NEW.amount || ' ريال لوظيفة "' || v_job_title || '". ابدأ العمل الآن!',
      '/technician/jobs/' || NEW.job_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_technician_offer_accepted ON price_offers;
CREATE TRIGGER trigger_notify_technician_offer_accepted
AFTER UPDATE ON price_offers
FOR EACH ROW
EXECUTE FUNCTION notify_technician_offer_accepted();


-- Trigger 3: Notify technician when offer rejected
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_offer_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_technician_user_id UUID;
  v_job_title TEXT;
BEGIN
  -- Check if status changed to rejected
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    -- Get technician user_id
    SELECT user_id INTO v_technician_user_id
    FROM technicians
    WHERE id = NEW.technician_id;

    -- Get job title
    SELECT title INTO v_job_title
    FROM jobs
    WHERE id = NEW.job_id;

    -- Create notification
    PERFORM create_notification(
      v_technician_user_id,
      'offer_rejected',
      'لم يتم قبول عرضك ❌',
      'لم يتم قبول عرضك لوظيفة "' || v_job_title || '". لا تقلق، هناك فرص أخرى!',
      '/technician/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_technician_offer_rejected ON price_offers;
CREATE TRIGGER trigger_notify_technician_offer_rejected
AFTER UPDATE ON price_offers
FOR EACH ROW
EXECUTE FUNCTION notify_technician_offer_rejected();


-- Trigger 4: Notify both when job completed
-- =====================================================
CREATE OR REPLACE FUNCTION notify_job_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_user_id UUID;
  v_technician_user_id UUID;
  v_job_title TEXT;
  v_amount NUMERIC;
BEGIN
  -- Check if status changed to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_job_title := NEW.title;
    v_amount := NEW.total_price;

    -- Get customer user_id
    SELECT user_id INTO v_customer_user_id
    FROM customers
    WHERE id = NEW.customer_id;

    -- Get technician user_id
    SELECT user_id INTO v_technician_user_id
    FROM technicians
    WHERE id = NEW.technician_id;

    -- Notify customer
    PERFORM create_notification(
      v_customer_user_id,
      'job_completed',
      'تم إكمال الوظيفة 🎉',
      'تم إكمال وظيفة "' || v_job_title || '" بنجاح. يمكنك الآن تقييم الفني.',
      '/jobs/' || NEW.id
    );

    -- Notify technician
    PERFORM create_notification(
      v_technician_user_id,
      'payment_received',
      'تم استلام الدفعة 💰',
      'تم تحويل ' || (v_amount * 0.85) || ' ريال لمحفظتك من وظيفة "' || v_job_title || '"',
      '/technician/wallet'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_job_completed ON jobs;
CREATE TRIGGER trigger_notify_job_completed
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION notify_job_completed();


-- Trigger 5: Notify both when job cancelled
-- =====================================================
CREATE OR REPLACE FUNCTION notify_job_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_user_id UUID;
  v_technician_user_id UUID;
  v_job_title TEXT;
  v_refund_amount NUMERIC;
BEGIN
  -- Check if status changed to cancelled
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    v_job_title := NEW.title;
    v_refund_amount := NEW.total_price;

    -- Get customer user_id
    SELECT user_id INTO v_customer_user_id
    FROM customers
    WHERE id = NEW.customer_id;

    -- Notify customer
    PERFORM create_notification(
      v_customer_user_id,
      'job_cancelled',
      'تم إلغاء الوظيفة 🚫',
      'تم إلغاء وظيفة "' || v_job_title || '" وإرجاع ' || COALESCE(v_refund_amount, 0) || ' ريال لمحفظتك.',
      '/wallet'
    );

    -- Notify technician if assigned
    IF NEW.technician_id IS NOT NULL THEN
      SELECT user_id INTO v_technician_user_id
      FROM technicians
      WHERE id = NEW.technician_id;

      PERFORM create_notification(
        v_technician_user_id,
        'job_cancelled',
        'تم إلغاء الوظيفة 🚫',
        'تم إلغاء وظيفة "' || v_job_title || '" من قبل العميل.',
        '/technician/dashboard'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_job_cancelled ON jobs;
CREATE TRIGGER trigger_notify_job_cancelled
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION notify_job_cancelled();


-- Trigger 6: Notify technicians when new job posted
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technicians_new_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_technician RECORD;
BEGIN
  -- Only notify for jobs waiting for offers
  IF NEW.status = 'waiting_for_offers' THEN
    -- Notify all active technicians in the same category (if needed)
    -- For now, we'll skip this to avoid spam
    -- You can enable this if you want push notifications to all technicians
    NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Uncomment to enable new job notifications for all technicians
-- DROP TRIGGER IF EXISTS trigger_notify_technicians_new_job ON jobs;
-- CREATE TRIGGER trigger_notify_technicians_new_job
-- AFTER INSERT ON jobs
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_technicians_new_job();


-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- =====================================================
-- End of Notification System
-- =====================================================
