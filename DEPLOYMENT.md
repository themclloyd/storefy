# 🚀 Storefy Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] All demo/test pages removed
- [x] Console logging cleaned up
- [x] ESLint warnings resolved
- [x] TypeScript strict mode enabled
- [x] Security vulnerabilities addressed

### ✅ Environment Configuration
- [ ] Production environment variables set
- [ ] Supabase production database configured
- [ ] RLS policies reviewed and tested
- [ ] API rate limiting configured
- [ ] Error monitoring setup (Sentry/LogRocket)

### ✅ Performance
- [x] Bundle size optimized
- [x] Code splitting implemented
- [x] Lazy loading configured
- [ ] CDN setup for static assets
- [ ] Compression enabled (gzip/brotli)

### ✅ Security
- [x] Environment variables secured
- [x] Input validation implemented
- [x] XSS protection enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Content Security Policy (CSP) set

## Environment Variables

### Required Production Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Application Configuration
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME=Storefy

# Security Configuration
VITE_ENABLE_CONSOLE_LOGS=false
VITE_SESSION_TIMEOUT=3600

# Production Mode
NODE_ENV=production
```

### Optional Monitoring Variables
```bash
# Error Monitoring
VITE_SENTRY_DSN=your-sentry-dsn

# Analytics
VITE_ANALYTICS_ID=your-analytics-id
```

## Build Commands

### Production Build
```bash
# Type check
npm run type-check

# Lint and fix issues
npm run lint:fix

# Build for production
npm run build

# Analyze bundle (optional)
npm run build:analyze

# Preview production build locally
npm run preview
```

## Deployment Platforms

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build command: npm run build
# Publish directory: dist
```

### Traditional Hosting
```bash
# Build the project
npm run build

# Upload the 'dist' folder to your web server
# Ensure your server serves index.html for all routes (SPA routing)
```

## Server Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Serve static files
    location / {
        root /var/www/storefy/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Apache Configuration (.htaccess)
```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA routing
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Cache static assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

## Post-Deployment Verification

### Functionality Tests
- [ ] User authentication works
- [ ] Store selection functions
- [ ] POS system operates correctly
- [ ] Inventory management works
- [ ] Reports generate properly
- [ ] All CRUD operations function

### Performance Tests
- [ ] Page load times < 3 seconds
- [ ] Bundle sizes optimized
- [ ] Images compressed and optimized
- [ ] API responses < 1 second

### Security Tests
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data in client code
- [ ] RLS policies working
- [ ] Authentication flows secure

## Monitoring and Maintenance

### Error Monitoring
- Set up Sentry or similar service
- Monitor JavaScript errors
- Track API failures
- Set up alerts for critical issues

### Performance Monitoring
- Use Lighthouse for performance audits
- Monitor Core Web Vitals
- Track bundle size changes
- Monitor API response times

### Security Monitoring
- Regular security audits
- Monitor for vulnerabilities
- Keep dependencies updated
- Review access logs

## Rollback Plan

### Quick Rollback
1. Keep previous build artifacts
2. Have database backup ready
3. Document rollback procedures
4. Test rollback process in staging

### Emergency Contacts
- Development team lead
- DevOps/Infrastructure team
- Database administrator
- Security team (if applicable)
