# Deployment Guide

## Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect GitHub repo: `Adit-Jain-srm/Vibe-Syndicate`
3. Set root directory: `syndicate-ui`
4. Framework: Vite
5. Environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key

## Backend (Railway)

1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub: `Adit-Jain-srm/Vibe-Syndicate`
3. Set root directory: `syndicate-api`
4. Environment variables (copy from .env):
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (service_role)
   - `CLERK_SECRET_KEY`
   - `GOOGLE_API_KEY`
   - `AZURE_OPENAI_ENDPOINT`
   - `AZURE_OPENAI_API_KEY`
   - `AZURE_OPENAI_DEPLOYMENT`
   - `AZURE_OPENAI_API_VERSION`
   - `WEB_APP_ORIGIN` = your Vercel URL
5. Start command: `uvicorn syndicate_api.main:app --host 0.0.0.0 --port $PORT`

## Database (Supabase)

Already deployed at: `https://wilwqoflckenzgnggbgb.supabase.co`
Schema applied via SQL Editor.

## After Deploy

1. Update `syndicate-ui/vercel.json` rewrites to point to your Railway URL
2. Update `WEB_APP_ORIGIN` in Railway to your Vercel URL
3. Test: visit your Vercel URL → sign in → submit a task → verify it appears in Supabase
