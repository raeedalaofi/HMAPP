-- =====================================================
-- NOTIFICATIONS TABLE & TRIGGER FUNCTIONS
-- =====================================================
-- This file contains the notifications system infrastructure:
-- 1. Notifications table to store user alerts
-- 2. Trigger functions to auto-create notifications on key events
-- 3. Helper function to send notifications programmatically
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('job_offer', 'offer_accepted', 'offer_rejected', 'job_completed', 'payment_received', 'job_cancelled', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- System can insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTION: Create Notification
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (p_user_id, p_type, p_title, p_message, p_link)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- =====================================================
-- TRIGGER: Notify customer when technician submits offer
-- =====================================================
CREATE OR REPLACE FUNCTION notify_customer_on_new_offer()
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
        'عرض سعر جديد',
        format('تلقيت عرضاً جديداً من %s بسعر %s ريال للعمل: %s', v_technician_name, NEW.price, v_job_title),
        '/jobs/' || NEW.job_id
    );
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_offer
    AFTER INSERT ON price_offers
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_customer_on_new_offer();

-- =====================================================
-- TRIGGER: Notify technician when offer is accepted
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_on_offer_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_technician_user_id UUID;
    v_job_title TEXT;
BEGIN
    -- Only proceed if status changed to accepted
    IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
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
            '🎉 تم قبول عرضك',
            format('تم قبول عرض السعر الخاص بك للعمل: %s', v_job_title),
            '/technician/jobs/' || NEW.job_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_offer_accepted
    AFTER UPDATE ON price_offers
    FOR EACH ROW
    EXECUTE FUNCTION notify_technician_on_offer_accepted();

-- =====================================================
-- TRIGGER: Notify technician when offer is rejected
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_on_offer_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_technician_user_id UUID;
    v_job_title TEXT;
BEGIN
    -- Only proceed if status changed to rejected
    IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
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
            'لم يتم قبول عرضك',
            format('لم يتم قبول عرض السعر الخاص بك للعمل: %s', v_job_title),
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_offer_rejected
    AFTER UPDATE ON price_offers
    FOR EACH ROW
    EXECUTE FUNCTION notify_technician_on_offer_rejected();

-- =====================================================
-- TRIGGER: Notify customer when job is completed
-- =====================================================
CREATE OR REPLACE FUNCTION notify_customer_on_job_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_user_id UUID;
BEGIN
    -- Only proceed if status changed to completed
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        -- Get customer user_id
        SELECT user_id INTO v_customer_user_id
        FROM customers
        WHERE id = NEW.customer_id;
        
        -- Create notification
        PERFORM create_notification(
            v_customer_user_id,
            'job_completed',
            '✅ تم إنجاز العمل',
            format('تم إنجاز العمل: %s. يرجى تقييم الخدمة.', NEW.title),
            '/jobs/' || NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_job_completed
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_customer_on_job_completed();

-- =====================================================
-- TRIGGER: Notify technician when payment is received
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_technician_user_id UUID;
BEGIN
    -- Only for new balance increases
    IF (NEW.balance > OLD.balance) OR (OLD.balance IS NULL) THEN
        -- Get technician user_id
        SELECT user_id INTO v_technician_user_id
        FROM technicians
        WHERE id = NEW.technician_id;
        
        -- Create notification
        PERFORM create_notification(
            v_technician_user_id,
            'payment_received',
            '💰 تم استلام دفعة',
            format('تم إضافة %s ريال إلى محفظتك. الرصيد الحالي: %s ريال', (NEW.balance - COALESCE(OLD.balance, 0)), NEW.balance),
            '/technician/dashboard'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_payment_received
    AFTER INSERT OR UPDATE ON technician_wallets
    FOR EACH ROW
    EXECUTE FUNCTION notify_technician_on_payment();

-- =====================================================
-- TRIGGER: Notify technician when job is cancelled
-- =====================================================
CREATE OR REPLACE FUNCTION notify_on_job_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_technician_user_id UUID;
    v_customer_user_id UUID;
BEGIN
    -- Only proceed if status changed to cancelled
    IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
        
        -- Notify assigned technician if exists
        IF NEW.assigned_technician_id IS NOT NULL THEN
            SELECT user_id INTO v_technician_user_id
            FROM technicians
            WHERE id = NEW.assigned_technician_id;
            
            IF v_technician_user_id IS NOT NULL THEN
                PERFORM create_notification(
                    v_technician_user_id,
                    'job_cancelled',
                    '🚫 تم إلغاء العمل',
                    format('تم إلغاء العمل: %s', NEW.title),
                    NULL
                );
            END IF;
        END IF;
        
        -- Notify customer
        SELECT user_id INTO v_customer_user_id
        FROM customers
        WHERE id = NEW.customer_id;
        
        IF v_customer_user_id IS NOT NULL THEN
            PERFORM create_notification(
                v_customer_user_id,
                'job_cancelled',
                'تم إلغاء العمل',
                format('تم إلغاء العمل: %s وإرجاع المبلغ إلى محفظتك', NEW.title),
                '/profile'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_job_cancelled
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_job_cancelled();

-- =====================================================
-- FUNCTION: Clean old read notifications (maintenance)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM public.notifications
    WHERE is_read = true 
    AND created_at < now() - interval '30 days';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO authenticated;
