import { useRef } from 'react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

export function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = ''
}: TurnstileCaptchaProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Use the site key that corresponds to the secret key configured in Supabase
  // For development, use Cloudflare's test key
  const siteKey = import.meta.env.DEV
    ? '1x00000000000000000000AA' // Cloudflare test key for development
    : '0x4AAAAAABneaJauDiUynU9m'; // Production site key - this should match your Cloudflare Turnstile site

  const handleSuccess = (token: string) => {
    onVerify(token);
  };

  const handleError = () => {
    onError?.('CAPTCHA verification failed. Please try again.');
  };

  const handleExpire = () => {
    onExpire?.();
  };

  const resetCaptcha = () => {
    turnstileRef.current?.reset();
  };

  return (
    <div className={className}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        options={{
          theme,
          size,
        }}
      />
    </div>
  );
}
