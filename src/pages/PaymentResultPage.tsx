import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { subscriptionService } from '@/services/subscription';
import { paychanguService } from '@/services/paychangu';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        // Get parameters from URL
        const txRef = searchParams.get('tx_ref');
        const paymentStatus = searchParams.get('status');
        const subscriptionId = searchParams.get('subscription_id');

        console.log('PaymentResultPage - Processing payment result:', {
          txRef,
          paymentStatus,
          subscriptionId,
          allParams: Object.fromEntries(searchParams.entries())
        });

        // Handle explicit failure status from PayChangu
        if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
          console.log('PaymentResultPage - Payment explicitly failed or cancelled');
          setStatus('failed');
          setMessage('Payment was cancelled or failed. Please try again.');
          return;
        }

        if (!txRef) {
          console.error('PaymentResultPage - Missing transaction reference');
          setStatus('error');
          setMessage('Missing payment reference');
          return;
        }

        setMessage('Verifying your payment...');
        console.log('PaymentResultPage - Starting payment verification for:', txRef);

        // For test payments, we can skip PayChangu verification and manually confirm
        if (txRef.includes('test') || window.location.hostname === 'localhost') {
          console.log('PaymentResultPage - Test environment detected, manually confirming payment');
          if (subscriptionId) {
            await subscriptionService.confirmPayment(subscriptionId, txRef);
            setStatus('success');
            setMessage('Payment successful! Your subscription has been activated.');
            return;
          }
        }

        // Verify payment with PayChangu
        const verification = await paychanguService.verifyPayment(txRef);
        console.log('PaymentResultPage - Payment verification result:', verification);

        if (verification.status === 'success' && verification.data?.status === 'success' && subscriptionId) {
          console.log('PaymentResultPage - Payment verified successfully, confirming subscription');
          // Confirm payment and update subscription
          await subscriptionService.confirmPayment(subscriptionId, txRef);
          setStatus('success');
          setMessage('Payment successful! Your subscription has been activated.');
        } else if (verification.status === 'success' && verification.data?.status === 'failed') {
          console.log('PaymentResultPage - Payment verification failed');
          setStatus('failed');
          setMessage('Payment failed. Please try again or contact support.');
        } else {
          console.log('PaymentResultPage - Payment verification returned unexpected status:', {
            outerStatus: verification.status,
            dataStatus: verification.data?.status
          });
          setStatus('error');
          setMessage('Payment verification failed. Please contact support.');
        }
      } catch (error: any) {
        console.error('PaymentResultPage - Error processing payment result:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred while processing your payment.');
      }
    };

    processPaymentResult();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/subscription');
    } else {
      navigate('/subscription');
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'failed':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'error':
        return 'Payment Error';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'success':
        return 'View Subscription';
      case 'failed':
      case 'error':
        return 'Try Again';
      default:
        return 'Continue';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getIcon()}
            </div>
            <CardTitle className="text-xl">
              {getTitle()}
            </CardTitle>
            <CardDescription>
              {status === 'loading' 
                ? 'Please wait while we verify your payment...'
                : message
              }
            </CardDescription>
          </CardHeader>
          
          {status !== 'loading' && (
            <CardContent className="space-y-4">
              <Button 
                onClick={handleContinue}
                className="w-full"
                variant={status === 'success' ? 'default' : 'outline'}
              >
                {getButtonText()}
              </Button>
              
              {status !== 'success' && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/subscription')}
                  className="w-full"
                >
                  Back to Subscription
                </Button>
              )}
            </CardContent>
          )}
        </Card>

        {/* Debug Information (only in development) */}
        {import.meta.env.DEV && (
          <Card className="mt-4 bg-gray-100">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <div><strong>TX Ref:</strong> {searchParams.get('tx_ref')}</div>
                <div><strong>Status:</strong> {searchParams.get('status')}</div>
                <div><strong>Subscription ID:</strong> {searchParams.get('subscription_id')}</div>
                <div><strong>Current Status:</strong> {status}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
