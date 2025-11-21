-- =====================================================
-- HMAPP Critical RPC Functions
-- Created: 21 نوفمبر 2025
-- =====================================================

-- Function 1: Cancel Job and Refund Customer
-- =====================================================
DROP FUNCTION IF EXISTS cancel_job_and_refund(UUID, UUID);

CREATE OR REPLACE FUNCTION cancel_job_and_refund(
  p_job_id UUID,
  p_customer_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job RECORD;
  v_customer RECORD;
  v_wallet RECORD;
  v_refund_amount NUMERIC;
BEGIN
  -- 1. Get job details
  SELECT * INTO v_job
  FROM jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job not found');
  END IF;

  -- 2. Get customer details
  SELECT * INTO v_customer
  FROM customers
  WHERE user_id = p_customer_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer not found');
  END IF;

  -- 3. Verify customer owns this job
  IF v_job.customer_id != v_customer.id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- 4. Check if job can be cancelled
  IF v_job.status NOT IN ('pending', 'waiting_for_offers', 'assigned') THEN
    RETURN json_build_object('success', false, 'error', 'Job cannot be cancelled in current status');
  END IF;

  -- 5. Get refund amount (total_price if set)
  v_refund_amount := COALESCE(v_job.total_price, 0);

  -- 6. Update job status
  UPDATE jobs
  SET status = 'cancelled',
      cancelled_at = NOW()
  WHERE id = p_job_id;

  -- 7. Refund to wallet if amount > 0
  IF v_refund_amount > 0 THEN
    -- Get customer wallet
    SELECT * INTO v_wallet
    FROM wallets
    WHERE owner_type = 'customer'
      AND owner_id = v_customer.id
      AND is_deleted = FALSE;
    
    IF FOUND THEN
      -- Update wallet balance
      UPDATE wallets
      SET balance = balance + v_refund_amount
      WHERE id = v_wallet.id;
      
      -- Record transaction
      INSERT INTO wallet_transactions (
        wallet_id,
        job_id,
        direction,
        amount,
        balance_after,
        tx_type,
        metadata,
        created_by
      ) VALUES (
        v_wallet.id,
        p_job_id,
        'credit',
        v_refund_amount,
        v_wallet.balance + v_refund_amount,
        'job_cancellation_refund',
        json_build_object('job_id', p_job_id, 'reason', 'Job cancelled'),
        p_customer_user_id
      );
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'job_id', p_job_id,
    'refund_amount', v_refund_amount
  );
END;
$$;


-- Function 2: Accept Price Offer
-- =====================================================
DROP FUNCTION IF EXISTS accept_price_offer(UUID, UUID);

CREATE OR REPLACE FUNCTION accept_price_offer(
  p_offer_id UUID,
  p_customer_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_job RECORD;
  v_customer RECORD;
  v_wallet RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Get offer details
  SELECT * INTO v_offer
  FROM price_offers
  WHERE id = p_offer_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Offer not found');
  END IF;

  -- 2. Check offer status
  IF v_offer.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Offer already processed');
  END IF;

  -- 3. Get job details
  SELECT * INTO v_job
  FROM jobs
  WHERE id = v_offer.job_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job not found');
  END IF;

  -- 4. Get customer details
  SELECT * INTO v_customer
  FROM customers
  WHERE user_id = p_customer_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer not found');
  END IF;

  -- 5. Verify customer owns this job
  IF v_job.customer_id != v_customer.id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- 6. Get customer wallet
  SELECT * INTO v_wallet
  FROM wallets
  WHERE owner_type = 'customer'
    AND owner_id = v_customer.id
    AND is_deleted = FALSE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- 7. Check sufficient balance
  IF v_wallet.balance < v_offer.amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- 8. Deduct from wallet balance
  v_new_balance := v_wallet.balance - v_offer.amount;
  
  UPDATE wallets
  SET balance = v_new_balance,
      hold_balance = hold_balance + v_offer.amount
  WHERE id = v_wallet.id;

  -- 9. Record transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    job_id,
    direction,
    amount,
    balance_after,
    tx_type,
    metadata,
    created_by
  ) VALUES (
    v_wallet.id,
    v_job.id,
    'debit',
    v_offer.amount,
    v_new_balance,
    'job_payment_hold',
    json_build_object('offer_id', p_offer_id, 'technician_id', v_offer.technician_id),
    p_customer_user_id
  );

  -- 10. Update offer status
  UPDATE price_offers
  SET status = 'accepted',
      decided_at = NOW()
  WHERE id = p_offer_id;

  -- 11. Reject other offers for this job
  UPDATE price_offers
  SET status = 'rejected',
      decided_at = NOW()
  WHERE job_id = v_job.id
    AND id != p_offer_id
    AND status = 'pending';

  -- 12. Update job
  UPDATE jobs
  SET status = 'assigned',
      technician_id = v_offer.technician_id,
      total_price = v_offer.amount,
      scheduled_at = NOW()
  WHERE id = v_job.id;

  RETURN json_build_object(
    'success', true,
    'job_id', v_job.id,
    'technician_id', v_offer.technician_id,
    'amount', v_offer.amount,
    'new_balance', v_new_balance
  );
END;
$$;


-- Function 3: Complete Job and Transfer Payment
-- =====================================================
DROP FUNCTION IF EXISTS complete_job_and_transfer(UUID, UUID);

CREATE OR REPLACE FUNCTION complete_job_and_transfer(
  p_job_id UUID,
  p_technician_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job RECORD;
  v_technician RECORD;
  v_customer_wallet RECORD;
  v_technician_wallet RECORD;
  v_technician_amount NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- 1. Get job details
  SELECT * INTO v_job
  FROM jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job not found');
  END IF;

  -- 2. Get technician details
  SELECT * INTO v_technician
  FROM technicians
  WHERE id = p_technician_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Technician not found');
  END IF;

  -- 3. Verify technician owns this job
  IF v_job.technician_id != v_technician.id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- 4. Check job status
  IF v_job.status != 'assigned' THEN
    RETURN json_build_object('success', false, 'error', 'Job cannot be completed in current status');
  END IF;

  -- 5. Check if total_price is set
  IF v_job.total_price IS NULL OR v_job.total_price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Job price not set');
  END IF;

  -- 6. Calculate split: 85% technician, 15% commission
  v_technician_amount := v_job.total_price * 0.85;
  v_commission_amount := v_job.total_price * 0.15;

  -- 7. Get customer wallet
  SELECT * INTO v_customer_wallet
  FROM wallets
  WHERE owner_type = 'customer'
    AND owner_id = v_job.customer_id
    AND is_deleted = FALSE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer wallet not found');
  END IF;

  -- 8. Get or create technician wallet
  SELECT * INTO v_technician_wallet
  FROM wallets
  WHERE owner_type = 'technician'
    AND owner_id = v_technician.id
    AND is_deleted = FALSE;
  
  IF NOT FOUND THEN
    -- Create wallet for technician
    INSERT INTO wallets (owner_type, owner_id, balance, currency)
    VALUES ('technician', v_technician.id, 0, 'SAR')
    RETURNING * INTO v_technician_wallet;
  END IF;

  -- 9. Release hold and update customer wallet
  UPDATE wallets
  SET hold_balance = hold_balance - v_job.total_price
  WHERE id = v_customer_wallet.id;

  -- 10. Transfer to technician wallet
  UPDATE wallets
  SET balance = balance + v_technician_amount
  WHERE id = v_technician_wallet.id;

  -- 11. Record technician transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    job_id,
    direction,
    amount,
    balance_after,
    tx_type,
    metadata,
    created_by
  ) VALUES (
    v_technician_wallet.id,
    p_job_id,
    'credit',
    v_technician_amount,
    v_technician_wallet.balance + v_technician_amount,
    'job_completion_payment',
    json_build_object('total', v_job.total_price, 'commission', v_commission_amount),
    v_technician.user_id
  );

  -- 12. Update job status
  UPDATE jobs
  SET status = 'completed',
      completed_at = NOW()
  WHERE id = p_job_id;

  -- 13. Update technician stats
  UPDATE technicians
  SET jobs_done = jobs_done + 1
  WHERE id = v_technician.id;

  RETURN json_build_object(
    'success', true,
    'job_id', p_job_id,
    'technician_amount', v_technician_amount,
    'commission_amount', v_commission_amount,
    'technician_new_balance', v_technician_wallet.balance + v_technician_amount
  );
END;
$$;


-- =====================================================
-- Grant Execute Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION cancel_job_and_refund TO authenticated;
GRANT EXECUTE ON FUNCTION accept_price_offer TO authenticated;
GRANT EXECUTE ON FUNCTION complete_job_and_transfer TO authenticated;

-- =====================================================
-- End of RPC Functions
-- =====================================================
