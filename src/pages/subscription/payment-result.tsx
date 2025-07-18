import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { paychanguService } from '@/services/paychangu';
import { subscriptionService } from '@/services/subscription';
import { useAuth } from '@/contexts/AuthContext';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'cancelled';

export default function PaymentResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    const { tx_ref, status: urlStatus } = router.query;

    if (tx_ref && typeof tx_ref === 'string') {
      setTransactionRef(tx_ref);
      
      if (urlStatus === 'failed') {
        setStatus('failed');
        setMessage('Payment was not completed. Please try again.');
      } else {
        // Verify payment with PayChangu
        verifyPayment(tx_ref);
      }
    }
  }, [router.query]);

  const verifyPayment = async (txRef: string) => {
    try {
      setStatus('loading');
      setMessage('Verifying your payment...');

      // Verify payment with PayChangu
      const verification = await paychanguService.verifyPayment(txRef);
      
      if (verification.status === 'success') {
        setStatus('success');
        setMessage('Payment successful! Your subscription has been activated.');
        
        // Update subscription usage if user is available
        if (user) {
          await subscriptionService.updateSubscriptionUsage(user.id);
        }
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support if you believe this is an error.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('failed');
      setMessage('Unable to verify payment. Please contact support.');
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      router.push('/subscription?tab=status');
    } else {
      router.push('/subscription?tab=plans');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'failed':
      case 'cancelled':
        return 'text-red-600';
    }
  };

  return (
    <>
      <Head>
        <title>Payment Result - Storefy</title>
        <meta name="description" content="Payment processing result" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full px-4">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {getStatusIcon()}
              </div>
              <CardTitle className={`text-2xl font-bold ${getStatusColor()}`}>
                {getStatusTitle()}
              </CardTitle>
              <CardDescription className="text-base">
                {message}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {transactionRef && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Transaction Reference</div>
                  <div className="font-mono text-sm break-all">{transactionRef}</div>
                </div>
              )}

              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">What's Next?</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Your subscription is now active</li>
                    <li>• You can start using all plan features</li>
                    <li>• Check your subscription status anytime</li>
                    <li>• You'll receive email confirmations</li>
                  </ul>
                </div>
              )}

              {(status === 'failed' || status === 'cancelled') && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">Need Help?</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Check your payment method details</li>
                    <li>• Ensure sufficient funds are available</li>
                    <li>• Try a different payment method</li>
                    <li>• Contact support if issues persist</li>
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  onClick={handleContinue}
                  className="w-full"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : status === 'success' ? (
                    <>
                      View Subscription
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Try Again
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {status !== 'loading' && (
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push('/dashboard')}
                    className="text-sm"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Contact */}
          <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-center">
                <h3 className="font-medium text-blue-900 mb-1">Need Support?</h3>
                <p className="text-sm text-blue-700">
                  Contact us at{' '}
                  <a 
                    href="mailto:support@storefy.com" 
                    className="underline hover:no-underline"
                  >
                    support@storefy.com
                  </a>
                  {' '}or through our help center.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
