import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UseWhatsAppRedirectProps {
  whatsappNumber?: string;
  message: string;
  enabled: boolean;
  delay?: number; // in seconds
  onRedirect?: () => void;
}

export function useWhatsAppRedirect({
  whatsappNumber,
  message,
  enabled,
  delay = 3,
  onRedirect
}: UseWhatsAppRedirectProps) {
  const [countdown, setCountdown] = useState(delay);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!enabled || !whatsappNumber || redirected) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to WhatsApp
          const cleanPhone = whatsappNumber.replace(/\D/g, '');
          const encodedMessage = encodeURIComponent(message);
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
          
          window.open(whatsappUrl, '_blank');
          setRedirected(true);
          
          toast.success('Redirected to WhatsApp!', {
            description: 'Your order details have been sent',
            duration: 3000,
          });
          
          onRedirect?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled, whatsappNumber, message, redirected, onRedirect]);

  const redirectNow = () => {
    if (!whatsappNumber) return;
    
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setRedirected(true);
    onRedirect?.();
  };

  const cancelRedirect = () => {
    setRedirected(true); // This will stop the countdown
  };

  return {
    countdown,
    redirected,
    redirectNow,
    cancelRedirect,
    progress: delay > 0 ? ((delay - countdown) / delay) * 100 : 0
  };
}
