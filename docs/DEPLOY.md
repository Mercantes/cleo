# Cleo - Deploy Guide

## Production URLs

- **App**: https://cleo-app-iota.vercel.app
- **Supabase**: https://supabase.com/dashboard/project/ejxlbbbjyexsoltsxiqq
- **Stripe**: https://dashboard.stripe.com/acct_1SktAT035ZxHFUOb
- **GitHub**: https://github.com/Mercantes/cleo

## Already Configured

- [x] Vercel project linked with auto-deploy on push to `main`
- [x] Supabase: 12 tables, 15 RLS policies, 4 migrations applied
- [x] Supabase Auth: site_url and redirect URLs for production
- [x] Environment variables: Supabase, Anthropic, Pluggy, App URL
- [x] Stripe product "Cleo Pro" (R$ 19,90/month) - `price_1T9UfM035ZxHFUObTGQHGtZo`
- [x] SEO: meta tags, OG, Twitter Card, sitemap, robots.txt
- [x] Security headers: X-Frame-Options, X-Content-Type-Options, etc.

## Pending Setup

### 1. Stripe API Keys

1. Go to https://dashboard.stripe.com/acct_1SktAT035ZxHFUOb/apikeys
2. Copy the **Publishable key** and **Secret key**
3. Add to Vercel:
   ```bash
   echo "pk_live_..." | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   echo "sk_live_..." | vercel env add STRIPE_SECRET_KEY production
   ```

### 2. Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://cleo-app-iota.vercel.app/api/stripe/webhook`
4. Events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Vercel:
   ```bash
   echo "whsec_..." | vercel env add STRIPE_WEBHOOK_SECRET production
   ```

### 3. Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `https://ejxlbbbjyexsoltsxiqq.supabase.co/auth/v1/callback`
4. Go to https://supabase.com/dashboard/project/ejxlbbbjyexsoltsxiqq/auth/providers
5. Enable Google provider
6. Paste Client ID and Client Secret

### 4. Redeploy After Config

```bash
vercel --prod
```

## Environment Variables Reference

| Variable | Where | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Done |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Done |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Done |
| `ANTHROPIC_API_KEY` | Vercel | Done |
| `PLUGGY_CLIENT_ID` | Vercel | Done |
| `PLUGGY_CLIENT_SECRET` | Vercel | Done |
| `NEXT_PUBLIC_APP_URL` | Vercel | Done |
| `STRIPE_PRO_PRICE_ID` | Vercel | Done |
| `STRIPE_SECRET_KEY` | Vercel | **Pending** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel | **Pending** |
| `STRIPE_WEBHOOK_SECRET` | Vercel | **Pending** |
