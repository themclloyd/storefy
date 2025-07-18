import { supabase } from '@/integrations/supabase/client';

// PayChangu API configuration
const PAYCHANGU_API_BASE = 'https://api.paychangu.com';
const PAYCHANGU_SECRET_KEY = import.meta.env.VITE_PAYCHANGU_SECRET_KEY || '';

export interface PaychanguPaymentRequest {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  callback_url: string;
  return_url: string;
  tx_ref: string;
  customization?: {
    title: string;
    description: string;
  };
  meta?: Record<string, any>;
}

export interface PaychanguPaymentResponse {
  message: string;
  status: string;
  data: {
    event: string;
    checkout_url: string;
    data: {
      tx_ref: string;
      currency: string;
      amount: number;
      mode: string;
      status: string;
    };
  };
}

export interface PaychanguWebhookPayload {
  event_type: string;
  currency: string;
  amount: number;
  charge: string;
  mode: string;
  type: string;
  status: string;
  charge_id: string;
  reference: string;
  authorization: {
    channel: string;
    card_details?: any;
    bank_payment_details?: any;
    mobile_money?: any;
    completed_at: string;
  };
  created_at: string;
  updated_at: string;
}

export class PaychanguService {
  private secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || PAYCHANGU_SECRET_KEY;
    console.log('PayChangu service initialized with key:', this.secretKey ? 'Present' : 'Missing');
    if (!this.secretKey) {
      throw new Error('PayChangu secret key is required');
    }
  }

  /**
   * Create a subscription payment session with PayChangu
   */
  async createSubscriptionPayment(
    subscriptionId: string,
    amount: number,
    userEmail: string,
    userName: string,
    planName: string
  ): Promise<PaychanguPaymentResponse> {
    const tx_ref = `sub_${subscriptionId}_${Date.now()}`;
    
    const paymentData: PaychanguPaymentRequest = {
      amount,
      currency: 'USD',
      email: userEmail,
      first_name: userName.split(' ')[0] || 'Customer',
      last_name: userName.split(' ').slice(1).join(' ') || '',
      callback_url: `${window.location.origin}/payment-result?subscription_id=${subscriptionId}`,
      return_url: `${window.location.origin}/payment-result?subscription_id=${subscriptionId}`,
      tx_ref,
      customization: {
        title: `${planName} Subscription`,
        description: `Monthly subscription payment for ${planName} plan`
      },
      meta: {
        subscription_id: subscriptionId,
        payment_type: 'subscription'
      }
    };

    try {
      console.log('PayChangu payment request:', {
        url: `${PAYCHANGU_API_BASE}/payment`,
        data: paymentData,
        hasSecretKey: !!this.secretKey
      });

      const response = await fetch(`${PAYCHANGU_API_BASE}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      console.log('PayChangu response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayChangu API error response:', errorText);
        throw new Error(`PayChangu API error: ${response.status} - ${errorText}`);
      }

      const result: PaychanguPaymentResponse = await response.json();
      console.log('PayChangu payment response:', result);

      // Store payment record in database
      await this.storePaymentRecord(subscriptionId, tx_ref, result, amount);

      return result;
    } catch (error) {
      console.error('Error creating PayChangu payment:', error);
      throw error;
    }
  }

  /**
   * Store payment record in database
   */
  private async storePaymentRecord(
    subscriptionId: string,
    txRef: string,
    paymentResponse: PaychanguPaymentResponse,
    amount: number
  ) {
    // Get subscription details for billing period
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('current_period_start, current_period_end')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const { error } = await supabase
      .from('subscription_payments')
      .insert({
        subscription_id: subscriptionId,
        paychangu_tx_ref: txRef,
        checkout_url: paymentResponse.data.checkout_url,
        amount,
        currency: 'USD',
        status: 'pending',
        billing_period_start: subscription.current_period_start,
        billing_period_end: subscription.current_period_end
      });

    if (error) {
      console.error('Error storing payment record:', error);
      throw error;
    }
  }

  /**
   * Verify payment status with PayChangu
   */
  async verifyPayment(txRef: string): Promise<any> {
    try {
      console.log('PayChangu - Verifying payment for tx_ref:', txRef);

      const response = await fetch(`${PAYCHANGU_API_BASE}/verify-payment/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Accept': 'application/json'
        }
      });

      console.log('PayChangu - Verification response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayChangu - Verification error response:', errorText);
        throw new Error(`PayChangu verification error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PayChangu - Verification result:', result);

      return result;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Process webhook payload and update subscription status
   */
  async processWebhook(payload: PaychanguWebhookPayload): Promise<void> {
    try {
      // Find the payment record
      const { data: payment } = await supabase
        .from('subscription_payments')
        .select('*, user_subscriptions(*)')
        .eq('paychangu_tx_ref', payload.reference)
        .single();

      if (!payment) {
        console.error('Payment record not found for tx_ref:', payload.reference);
        return;
      }

      // Update payment status
      const paymentStatus = payload.status === 'success' ? 'completed' : 'failed';
      const updateData: any = {
        status: paymentStatus,
        paychangu_charge_id: payload.charge_id,
        payment_method: payload.authorization.channel,
        webhook_data: payload
      };

      if (paymentStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.failed_at = new Date().toISOString();
      }

      await supabase
        .from('subscription_payments')
        .update(updateData)
        .eq('id', payment.id);

      // Update subscription status if payment successful
      if (paymentStatus === 'completed') {
        await this.updateSubscriptionAfterPayment(payment.subscription_id);
      } else {
        await this.handleFailedPayment(payment.subscription_id);
      }

    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Update subscription after successful payment
   */
  private async updateSubscriptionAfterPayment(subscriptionId: string) {
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        last_payment_date: now.toISOString(),
        next_billing_date: nextBillingDate.toISOString(),
        failed_payment_attempts: 0,
        updated_at: now.toISOString()
      })
      .eq('id', subscriptionId);
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(subscriptionId: string) {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('failed_payment_attempts')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) return;

    const failedAttempts = (subscription.failed_payment_attempts || 0) + 1;
    const status = failedAttempts >= 3 ? 'past_due' : 'active';

    await supabase
      .from('user_subscriptions')
      .update({
        status,
        failed_payment_attempts: failedAttempts,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
  }

  /**
   * Validate webhook signature (implement based on PayChangu documentation)
   */
  validateWebhookSignature(payload: string, signature: string, webhookSecret: string): boolean {
    // Implement SHA-256 HMAC validation as per PayChangu docs
    const crypto = require('crypto');
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return computedSignature === signature;
  }
}

export const paychanguService = new PaychanguService();
