# Deployment Configuration for storefy.app

## Current Setup
The codebase is configured for Netlify deployment with proper configuration files.

## Deployment Solution

### Netlify Deployment (Recommended)
1. The `netlify.toml` file has been created with proper configuration
2. Ensure the build command is set to `npm run build`
3. Set the publish directory to `dist`
4. Configure environment variables in Netlify dashboard:
   ```
   VITE_SUPABASE_URL=https://irmuaqhwmtgbkftqlohx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAABneaJauDiUynU9m
   ```

### Alternative: Traditional Hosting
1. Build the project with `npm run build`
2. Upload the `dist` folder to your web server
3. Configure environment variables on your hosting platform

## Environment Variables Required
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://irmuaqhwmtgbkftqlohx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybXVhcWh3bXRnYmtmdHFsb2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NTU2NzQsImV4cCI6MjA2NzMzMTY3NH0.6DX_aLCLCy__18IGOG2DW1vJGkWSw4TJ4gm2eNdn35U

# Turnstile CAPTCHA
VITE_TURNSTILE_SITE_KEY=0x4AAAAAABneaJauDiUynU9m
```

## CAPTCHA Configuration
The Turnstile CAPTCHA has been implemented and requires:
1. The site key is already configured in environment variables
2. The secret key must be configured in Supabase dashboard for server-side verification
3. CSP headers have been updated to allow Cloudflare Turnstile domains

## Build Commands
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally
npm run preview
```

## Verification Steps
1. Ensure the domain resolves to the correct deployment
2. Check that environment variables are properly set
3. Verify CAPTCHA loads correctly on the auth page
4. Test authentication flow with CAPTCHA verification

## Next Steps
1. Choose deployment platform (Netlify recommended)
2. Configure domain and environment variables
3. Deploy and test the application
4. Verify CAPTCHA functionality in production
