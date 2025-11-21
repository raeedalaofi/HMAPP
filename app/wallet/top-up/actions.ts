'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function topUpWallet(formData: FormData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!customer) redirect('/signup')

  // Get amount (custom takes priority over preset)
  const customAmount = formData.get('customAmount') as string
  const presetAmount = formData.get('amount') as string
  const amount = customAmount ? parseFloat(customAmount) : parseFloat(presetAmount)

  // Validate amount
  if (!amount || isNaN(amount) || amount < 50 || amount > 10000) {
    redirect('/wallet/top-up?error=invalid_amount')
  }

  try {
    // NOTE: In production, integrate with a payment gateway here
    // For now, we'll simulate the payment and add to wallet directly
    // TODO: Integrate with Stripe/PayPal/Moyasar/Hyperpay
    
    // Get or create wallet using owner_type/owner_id schema
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id, balance, hold_balance')
      .eq('owner_type', 'customer')
      .eq('owner_id', customer.id)
      .eq('is_deleted', false)
      .maybeSingle()

    let walletId: string;
    let newBalance: number;

    if (!existingWallet) {
      // Create new wallet
      const { data: newWallet, error: insertError } = await supabase
        .from('wallets')
        .insert({
          owner_type: 'customer',
          owner_id: customer.id,
          balance: amount,
          hold_balance: 0,
          currency: 'SAR',
          created_by: user.id
        })
        .select('id, balance')
        .single()

      if (insertError) throw insertError
      walletId = newWallet.id
      newBalance = newWallet.balance
    } else {
      // Update existing wallet
      newBalance = existingWallet.balance + amount
      
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWallet.id)

      if (updateError) throw updateError
      walletId = existingWallet.id
    }

    // Record transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        direction: 'credit',
        amount: amount,
        balance_after: newBalance,
        tx_type: 'top_up',
        metadata: { method: 'manual', note: 'Wallet top-up' },
        created_by: user.id
      })

    // Redirect with success message
    redirect(`/wallet/top-up?success=${newBalance.toFixed(2)}`)

  } catch (error) {
    console.error('Top-up error:', error)
    redirect('/wallet/top-up?error=payment_failed')
  }
}
