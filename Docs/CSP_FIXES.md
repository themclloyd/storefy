# Content Security Policy (CSP) Fixes

## Issue Summary

The deployed Storefy application was experiencing CSP violations that prevented proper functionality:

1. **Script violations**: Blob URLs and Vercel Analytics scripts were blocked
2. **Style violations**: Inline styles were blocked due to missing `'unsafe-inline'`

## Root Cause

The CSP configuration was too restrictive for a modern React application that uses:
- **Vercel Analytics** (`@vercel/analytics`) - Creates dynamic scripts and blob URLs
- **CSS-in-JS** and **inline styles** - Used by UI components and charts
- **Dynamic imports** - Vite creates blob URLs for code splitting
- **Third-party analytics** - Plausible Analytics script

## Changes Made

### 1. Updated `vercel.json`
Enhanced the CSP header to allow necessary resources:

```json
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' blob: https://plausible.io https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-analytics.com https://va.vercel-scripts.com https://plausible.io; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
```

### 2. Updated `public/_headers`
Synchronized the CSP configuration for consistency across deployment methods.

### 3. Updated `src/utils/security.ts`
Enhanced the CSP configuration object to match production settings.

## Key CSP Directives Added

### `script-src`
- `'unsafe-inline'` - Required for React components and inline scripts
- `blob:` - Required for dynamic imports and Vercel Analytics
- `https://va.vercel-scripts.com` - Vercel Analytics scripts

### `style-src`
- `'unsafe-inline'` - Required for CSS-in-JS and inline styles

### `img-src`
- `blob:` - Required for dynamic image handling

### `connect-src`
- `https://va.vercel-scripts.com` - Vercel Analytics API calls

## Security Considerations

While adding `'unsafe-inline'` reduces security, it's necessary for:
1. **React applications** with CSS-in-JS libraries
2. **Vercel Analytics** functionality
3. **Chart components** that generate inline styles

### Mitigation Strategies
1. **Input sanitization** - All user inputs are sanitized using DOMPurify
2. **XSS protection** - Additional XSS protection middleware is in place
3. **CSRF protection** - CSRF tokens are used for all API requests
4. **Strict other directives** - `object-src 'none'`, `frame-ancestors 'none'`

## Testing

After deployment, verify that:
1. ✅ No CSP violations in browser console
2. ✅ Vercel Analytics loads correctly
3. ✅ Plausible Analytics script loads
4. ✅ UI components render with proper styling
5. ✅ Dynamic imports work correctly

## Deployment

To apply these changes:
1. Commit the updated files
2. Deploy to Vercel
3. Monitor browser console for any remaining CSP violations
4. Test all application functionality

## Future Improvements

Consider implementing:
1. **Nonce-based CSP** - Use nonces for inline scripts/styles
2. **Hash-based CSP** - Use hashes for specific inline content
3. **Stricter CSP in development** - Different CSP for dev vs production

## References

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Vercel Analytics CSP Requirements](https://vercel.com/docs/analytics)
- [React CSP Best Practices](https://create-react-app.dev/docs/advanced-configuration/)
