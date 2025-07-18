import { NextApiRequest, NextApiResponse } from 'next';
import { paychanguService, PaychanguWebhookPayload } from '@/services/paychangu';

// PayChangu webhook secret - should be stored in environment variables
const PAYCHANGU_WEBHOOK_SECRET = process.env.PAYCHANGU_WEBHOOK_SECRET || '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the raw body and signature
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['signature'] as string;

    if (!signature) {
      console.error('Missing signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Validate webhook signature
    const isValidSignature = paychanguService.validateWebhookSignature(
      rawBody,
      signature,
      PAYCHANGU_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse the webhook payload
    const payload: PaychanguWebhookPayload = req.body;

    console.log('Received PayChangu webhook:', {
      event_type: payload.event_type,
      status: payload.status,
      reference: payload.reference,
      amount: payload.amount
    });

    // Process the webhook based on event type
    switch (payload.event_type) {
      case 'api.charge.payment':
        await handlePaymentEvent(payload);
        break;
      
      case 'api.charge.failed':
        await handleFailedPaymentEvent(payload);
        break;
      
      default:
        console.log('Unhandled webhook event type:', payload.event_type);
    }

    // Respond with 200 to acknowledge receipt
    res.status(200).json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing PayChangu webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle successful payment events
 */
async function handlePaymentEvent(payload: PaychanguWebhookPayload) {
  try {
    if (payload.status === 'success') {
      await paychanguService.processWebhook(payload);
      console.log('Successfully processed payment webhook for:', payload.reference);
    } else {
      console.log('Payment not successful, status:', payload.status);
    }
  } catch (error) {
    console.error('Error handling payment event:', error);
    throw error;
  }
}

/**
 * Handle failed payment events
 */
async function handleFailedPaymentEvent(payload: PaychanguWebhookPayload) {
  try {
    await paychanguService.processWebhook(payload);
    console.log('Successfully processed failed payment webhook for:', payload.reference);
  } catch (error) {
    console.error('Error handling failed payment event:', error);
    throw error;
  }
}

// Disable body parser to get raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
