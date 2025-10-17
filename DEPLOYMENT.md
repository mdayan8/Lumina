# Vercel Deployment Guide

## Prerequisites

1. **Database Setup**: You need a PostgreSQL database. You can use:
   - Neon (recommended for serverless)
   - Supabase
   - PlanetScale
   - Any other PostgreSQL provider

2. **Environment Variables**: Set up the following environment variables in your Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `DEEPSEEK_API_KEY`: Your DeepSeek API key (if using AI features)

## Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect the `vercel.json` configuration
   - Set the environment variables in the Vercel dashboard

3. **Database Migration** (if needed):
   ```bash
   npm run db:push
   ```

## Configuration Files

- `vercel.json`: Vercel deployment configuration
- `.vercelignore`: Files to exclude from deployment
- `.env.example`: Example environment variables

## Troubleshooting

If you see `__defProp` errors, this is normal - it's part of ESBuild's output format and not an actual error.

The application uses:
- Express.js for the backend
- Vite + React for the frontend
- Drizzle ORM for database operations
- Neon Database for PostgreSQL hosting