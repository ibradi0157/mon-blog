## Deploying to Railway

Each service (frontend and backend) is in its own folder with its own `railway.json` and `.env.example`.

**To deploy:**
1. Create a new Railway project.
2. Link the corresponding folder (`blog-frontend` or `blog-backend`) as a service.
3. Railway will auto-detect and deploy using Node.js defaults.
4. Set your environment variables in Railway (copy from `.env.example`).

**Frontend**: Next.js app  
**Backend**: NestJS app

For custom domains, environment variables, and advanced configuration, see the [Railway Docs](https://docs.railway.app/).