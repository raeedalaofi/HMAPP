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
    
    // Get or create wallet
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('customer_id', customer.id)
      .maybeSingle()

    if (!existingWallet) {
      // Create new wallet
      await supabase
        .from('wallets')
        .insert({
          customer_id: customer.id,
          balance: amount,
          currency: 'SAR'
        })
    } else {
      // Update existing wallet
      await supabase
        .from('wallets')
        .update({
          balance: existingWallet.balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customer.id)
    }

    // Get new balance
    const { data: updatedWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('customer_id', customer.id)
      .single()

    // Redirect with success message
    redirect(`/wallet/top-up?success=${updatedWallet?.balance.toFixed(2)}`)

  } catch (error) {
    console.error('Top-up error:', error)
    redirect('/wallet/top-up?error=payment_failed')
  }
}
