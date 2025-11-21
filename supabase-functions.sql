-- =============================================================================
-- HMAPP SUPABASE RPC FUNCTIONS
-- These functions handle critical business logic with transaction safety
-- =============================================================================

-- =============================================================================
-- FUNCTION 1: cancel_job_and_refund
-- Purpose: Cancel a job and refund the customer's wallet
-- Called from: app/actions.ts (cancelJobAction)
-- =============================================================================

CREATE OR REPLACE FUNCTION cancel_job_and_refund(
  p_job_id uuid,
  p_customer_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id integer;
  v_job_total_price numeric;
  v_job_status text;
BEGIN
  -- 1. Get customer ID from user_id
  SELECT id INTO v_customer_id
  FROM customers
  WHERE user_id = p_customer_user_id;

  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Customer not found');
  END IF;

  -- 2. Get job details and verify ownership
  SELECT total_price, status INTO v_job_total_price, v_job_status
  FROM jobs
  WHERE id = p_job_id AND customer_id = v_customer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Job not found or not owned by customer');
  END IF;

  -- 3. Check if job can be cancelled (not completed)
  IF v_job_status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot cancel completed job');
  END IF;

  -- 4. If job was already paid (has total_price), refund to wallet
  IF v_job_total_price IS NOT NULL AND v_job_total_price > 0 THEN
    UPDATE wallets
    SET balance = balance + v_job_total_price,
        updated_at = now()
    WHERE customer_id = v_customer_id;
  END IF;

  -- 5. Update job status to cancelled
  UPDATE jobs
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_job_id;

  -- 6. Reject all pending offers for this job
  UPDATE price_offers
  SET status = 'rejected',
      updated_at = now()
  WHERE job_id = p_job_id AND status = 'pending';

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Job cancelled successfully',
    'refunded_amount', COALESCE(v_job_total_price, 0)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Error: ' || SQLERRM
    );
END;
$$;

-- =============================================================================
-- FUNCTION 2: accept_price_offer
-- Purpose: Accept a technician's offer, assign job, and deduct from wallet
-- Called from: app/actions.ts (acceptOfferAction)
-- =============================================================================

CREATE OR REPLACE FUNCTION accept_price_offer(
  p_offer_id uuid,
  p_customer_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id integer;
  v_job_id uuid;
  v_technician_id integer;
  v_offer_price numeric;
  v_wallet_balance numeric;
  v_job_status text;
BEGIN
  -- 1. Get customer ID
  SELECT id INTO v_customer_id
  FROM customers
  WHERE user_id = p_customer_user_id;

  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Customer not found');
  END IF;

  -- 2. Get offer details
  SELECT po.job_id, po.technician_id, po.price, j.status
  INTO v_job_id, v_technician_id, v_offer_price, v_job_status
  FROM price_offers po
  JOIN jobs j ON j.id = po.job_id
  WHERE po.id = p_offer_id
    AND j.customer_id = v_customer_id
    AND po.status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Offer not found or already processed');
  END IF;

  -- 3. Check job status
  IF v_job_status != 'waiting_for_offers' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Job is not accepting offers');
  END IF;

  -- 4. Check wallet balance
  SELECT balance INTO v_wallet_balance
  FROM wallets
  WHERE customer_id = v_customer_id;

  IF v_wallet_balance IS NULL THEN
    -- Create wallet if doesn't exist
    INSERT INTO wallets (customer_id, balance, currency)
    VALUES (v_customer_id, 0, 'SAR');
    v_wallet_balance := 0;
  END IF;

  IF v_wallet_balance < v_offer_price THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Insufficient wallet balance',
      'required', v_offer_price,
      'available', v_wallet_balance
    );
  END IF;

  -- 5. Deduct from wallet
  UPDATE wallets
  SET balance = balance - v_offer_price,
      updated_at = now()
  WHERE customer_id = v_customer_id;

  -- 6. Accept the offer
  UPDATE price_offers
  SET status = 'accepted',
      updated_at = now()
  WHERE id = p_offer_id;

  -- 7. Reject all other offers for this job
  UPDATE price_offers
  SET status = 'rejected',
      updated_at = now()
  WHERE job_id = v_job_id 
    AND id != p_offer_id 
    AND status = 'pending';

  -- 8. Update job: assign technician, set price, change status
  UPDATE jobs
  SET assigned_technician_id = v_technician_id,
      total_price = v_offer_price,
      status = 'assigned',
      updated_at = now()
  WHERE id = v_job_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Offer accepted successfully',
    'job_id', v_job_id,
    'technician_id', v_technician_id,
    'amount_deducted', v_offer_price
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM
    );
END;
$$;

-- =============================================================================
-- FUNCTION 3: complete_job_and_transfer
-- Purpose: Mark job complete, transfer 85% to technician, 15% platform commission
-- Called from: app/actions.ts (completeJobAction)
-- =============================================================================

CREATE OR REPLACE FUNCTION complete_job_and_transfer(
  p_job_id uuid,
  p_technician_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_total_price numeric;
  v_job_status text;
  v_assigned_tech_id integer;
  v_technician_amount numeric;
  v_platform_commission numeric;
  v_tech_wallet_id integer;
BEGIN
  -- 1. Get job details and verify
  SELECT total_price, status, assigned_technician_id
  INTO v_job_total_price, v_job_status, v_assigned_tech_id
  FROM jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Job not found');
  END IF;

  -- 2. Verify job is assigned to this technician
  IF v_assigned_tech_id != p_technician_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Job not assigned to this technician');
  END IF;

  -- 3. Check job status
  IF v_job_status != 'assigned' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Job is not in assigned status');
  END IF;

  -- 4. Check if job has a price
  IF v_job_total_price IS NULL OR v_job_total_price <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Job has no valid price');
  END IF;

  -- 5. Calculate amounts (85% to technician, 15% platform commission)
  v_technician_amount := v_job_total_price * 0.85;
  v_platform_commission := v_job_total_price * 0.15;

  -- 6. Get or create technician wallet
  SELECT id INTO v_tech_wallet_id
  FROM technician_wallets
  WHERE technician_id = p_technician_id;

  IF v_tech_wallet_id IS NULL THEN
    INSERT INTO technician_wallets (technician_id, balance, currency)
    VALUES (p_technician_id, 0, 'SAR')
    RETURNING id INTO v_tech_wallet_id;
  END IF;

  -- 7. Transfer to technician wallet
  UPDATE technician_wallets
  SET balance = balance + v_technician_amount,
      updated_at = now()
  WHERE technician_id = p_technician_id;

  -- 8. Update job status to completed
  UPDATE jobs
  SET status = 'completed',
      completed_at = now(),
      updated_at = now()
  WHERE id = p_job_id;

  -- 9. Update technician stats (increment jobs_done)
  UPDATE technicians
  SET jobs_done = COALESCE(jobs_done, 0) + 1,
      updated_at = now()
  WHERE id = p_technician_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Job completed successfully',
    'job_id', p_job_id,
    'total_price', v_job_total_price,
    'technician_amount', v_technician_amount,
    'platform_commission', v_platform_commission
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM
    );
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION cancel_job_and_refund TO authenticated;
GRANT EXECUTE ON FUNCTION accept_price_offer TO authenticated;
GRANT EXECUTE ON FUNCTION complete_job_and_transfer TO authenticated;

-- =============================================================================
-- NOTES FOR DEPLOYMENT:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Ensure tables exist: jobs, customers, technicians, wallets, 
--    technician_wallets, price_offers
-- 3. Test each function individually before production use
-- 4. Monitor function performance in Supabase Dashboard
-- =============================================================================
