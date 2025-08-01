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

  // Use the site key provided by the user
  const siteKey = import.meta.env.DEV
    ? '1x00000000000000000000AA' // Cloudflare test key for development
    : '0x4AAAAAABneaJauDiUynU9m'; // Production site key provided by user

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
