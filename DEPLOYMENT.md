# Nexus - Deployment Guide

This guide covers the process of deploying Nexus to production environments.

## Pre-Deployment Checklist

### Code Quality
- [ ] Run `pnpm lint` to check TypeScript errors
- [ ] Test all features locally with `pnpm dev`
- [ ] Verify responsive design on mobile, tablet, and desktop
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Check console for errors and warnings

### Environment Setup
- [ ] Update `.env.local` with production credentials
- [ ] Configure Gemini API key
- [ ] Review security settings
- [ ] Set appropriate CORS headers if API is separate

### Build Verification
- [ ] Run `pnpm clean` to remove old builds
- [ ] Run `pnpm build` and verify no errors
- [ ] Check build size optimization (should be under 800KB uncompressed)
- [ ] Run `pnpm preview` to test production build locally

---

## Deployment Options

### Option 1: Vercel

Easiest deployment platform for React apps.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in dashboard or:
vercel env add GEMINI_API_KEY
```

**Advantages:**
- Zero-config deployment
- Automatic HTTPS
- CDN included
- Preview deployments

### Option 2: Netlify

Simple alternative to Vercel.

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Configuration (netlify.toml):**
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Docker + Cloud Run / Heroku / AWS

For more control and custom infrastructure.

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

ENV NODE_ENV=production
ENV DISABLE_HMR=true

CMD ["node", "dist/server.js"]
```

### Option 4: Traditional Server (Nginx + Node)

```bash
# Build the app
pnpm build
pnpm install --production

# Upload dist/ and server.ts to your server
# Install Node.js on your server
# Run with PM2 for process management

npm install -g pm2
pm2 start server.js --name "nexus"
pm2 startup
pm2 save
```

**Nginx Configuration:**
```nginx
upstream nexus_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_minlength 1000;

    location / {
        proxy_pass http://nexus_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Performance Optimization

### Enable Caching Headers
Set these headers in your server configuration:

```
Cache-Control: public, max-age=31536000, immutable  # For versioned assets
Cache-Control: public, max-age=3600                 # For HTML
Cache-Control: no-cache, no-store, must-revalidate  # For API responses
```

### Enable Compression
- Ensure gzip compression is enabled on your server
- Consider Brotli for better compression

### CDN Configuration
- Use a CDN (Cloudflare, AWS CloudFront, etc.)
- Set origin compression
- Cache static assets aggressively

### Database Optimization
- If using better-sqlite3, consider switching to PostgreSQL for production
- Add proper indexes to frequently queried tables
- Set up regular backups

---

## Monitoring & Analytics

### Error Tracking
```bash
# Install Sentry for error monitoring
npm install @sentry/react

# Or LogRocket for session replay
npm install logrocket
```

### Performance Monitoring
- Enable Google Analytics
- Monitor Core Web Vitals
- Set up performance budgets
- Track user interactions

### Health Checks
Set up health check endpoint:

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

---

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use `.env.example` as template
- Rotate API keys periodically

### Headers
Add security headers:

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### HTTPS
- Always use HTTPS in production
- Enable HSTS
- Use strong TLS versions (1.2+)

### API Security
- Validate all inputs
- Implement rate limiting
- Use proper authentication (JWT, OAuth)
- Sanitize database queries

---

## Scaling Considerations

### Database
- Switch from SQLite to PostgreSQL
- Implement connection pooling
- Add read replicas for scaling

### Caching
- Implement Redis for session caching
- Cache frequently accessed data
- Add edge caching with CDN

### Load Balancing
- Use load balancer for multiple instances
- Implement sticky sessions if needed
- Monitor server health

---

## Rollback & Recovery

### Version Control
- Tag releases in git
- Keep multiple versions available
- Document breaking changes

### Database Backups
```bash
# SQLite backup
cp app.db app.db.backup

# PostgreSQL backup
pg_dump database_name > backup.sql
```

### Recovery Plan
- Document rollback procedure
- Keep previous version available
- Test recovery process regularly

---

## Post-Deployment

- [ ] Verify app is running correctly
- [ ] Test all critical features
- [ ] Monitor error tracking
- [ ] Check Core Web Vitals
- [ ] Monitor server resources
- [ ] Set up alerts for errors/downtime
- [ ] Document any custom configurations

---

## Support & Troubleshooting

### Common Issues

**Cold start is slow:**
- Use a warmer (periodic pings)
- Optimize bundle size further
- Consider edge functions

**Database connection errors:**
- Check database credentials
- Verify network connectivity
- Monitor connection pool

**High memory usage:**
- Check for memory leaks
- Optimize data structures
- Consider pagination

---

## Resources

- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Web Performance Optimization](https://web.dev/performance/)

---

**Need help? Check the main README.md or open an issue.**
