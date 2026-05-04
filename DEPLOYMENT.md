# SmartHire No-Card Free Deployment

This repo has two deployable parts:

- `SmartHire`: Vite React frontend
- `smarthire-server`: Express API

This path avoids Render because Render may ask for a card before creating free services.

## 1. Create A Free MongoDB Atlas Database

1. Create a MongoDB Atlas M0 cluster.
2. Create a database user.
3. Add network access. For a class/demo project, `0.0.0.0/0` is the simplest option.
4. Copy the Atlas connection string and replace the password/database name.

## 2. Deploy The Backend On Vercel

1. Push this repo to GitHub.
2. In Vercel, create a new project from the repo.
3. Set the Root Directory to `smarthire-server`.
4. Add environment variables:
   - `MONGO_URI`: your MongoDB Atlas connection string
   - `CLIENT_ORIGINS`: your frontend URL, for example `https://your-site.netlify.app`
   - `GOOGLE_CLIENT_ID`: your Google client ID
   - `JWT_SECRET`: any long random string
   - `ACCESS_TOKEN_SECRET`: any long random string
   - `REFRESH_TOKEN_SECRET`: any long random string
   - `USE_AI`: `false`
   - `USE_PYTHON_EVALUATOR`: `true`
   - `PYTHON_BIN`: `python`
   - `PYTHON_EVALUATOR_TIMEOUT_MS`: `12000`
   - `OPENAI_API_KEY`: leave blank unless `USE_AI=true`
5. Deploy.
6. Copy the backend URL, for example `https://smarthire-server.vercel.app`.

## 3. Deploy The Frontend On Netlify

1. In Netlify, import the same GitHub repo.
2. Netlify will use `netlify.toml`:
   - base directory: `SmartHire`
   - build command: `npm run build`
   - publish directory: `dist`
3. Add environment variables:
   - `VITE_API_URL`: your Vercel backend URL
   - `VITE_GOOGLE_CLIENT_ID`: your Google client ID
4. Deploy the site.
5. Go back to the backend project on Vercel and update `CLIENT_ORIGINS` to the final Netlify URL.

## Vercel Alternative

You can deploy the frontend on Vercel instead of Netlify. This still uses two Vercel projects:

1. Import the repo in Vercel.
2. Set the project root directory to `SmartHire`.
3. Add:
   - `VITE_API_URL`
   - `VITE_GOOGLE_CLIENT_ID`
4. Deploy.

`SmartHire/vercel.json` handles React Router refreshes.
