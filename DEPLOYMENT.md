# Deploying SmartHire (MongoDB Atlas + Vercel + Netlify)

## 1. MongoDB Atlas

1. Create a free cluster and a database user (Database Access).
2. **Network Access → Add IP Address → `0.0.0.0/0`** (Allow access from anywhere).
   Vercel serverless functions do not have fixed IPs, so without this rule every
   API call fails with `Service temporarily unavailable`.
3. Copy the connection string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smarthire?retryWrites=true&w=majority`.
   URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, ...).
4. Free (M0) clusters pause after a long time without use. If it is paused, click **Resume** in Atlas.

## 2. Backend on Vercel (`smarthire-server`)

Set these under **Project → Settings → Environment Variables**, then **redeploy**
(Vercel only reads new variables on a new deployment):

| Variable | Example | Notes |
| --- | --- | --- |
| `MONGO_URI` | `mongodb+srv://...` | Required. Atlas connection string. |
| `JWT_SECRET` | long random string | Required for login. |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | long random strings | Optional; fall back to `JWT_SECRET`. |
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Must be the **same** client ID as the frontend. |
| `CLIENT_ORIGINS` | `https://smarrthire.netlify.app` | Comma-separated frontend URLs, no trailing slash. |
| `NODE_ENV` | `production` | Enables cross-site (`SameSite=None; Secure`) cookies. |
| `OPENAI_API_KEY` | `sk-...` | Optional, for AI evaluation. |

## 3. Frontend on Netlify (`SmartHire`)

| Variable | Example |
| --- | --- |
| `VITE_API_URL` | `https://<your-backend>.vercel.app` (no trailing slash) |
| `VITE_GOOGLE_CLIENT_ID` | same value as the backend `GOOGLE_CLIENT_ID` |

Vite bakes these values in at build time, so trigger a new deploy after changing them.

## 4. Google Cloud Console (OAuth client)

Under **APIs & Services → Credentials → your OAuth 2.0 Client ID → Authorized JavaScript origins**, add:

- `https://smarrthire.netlify.app`
- `http://localhost:5173` (for local development)

## Troubleshooting

Open `https://<your-backend>.vercel.app/health/ready` in the browser. It reports whether
MongoDB is connected and which settings are missing, without exposing any secrets:

| `error.reason` | Fix |
| --- | --- |
| `DATABASE_NOT_CONFIGURED` | `MONGO_URI` is not set on Vercel. Add it and redeploy. |
| `DATABASE_UNREACHABLE` | Add `0.0.0.0/0` in Atlas Network Access, and check that the cluster is not paused. |
| `DATABASE_AUTH_FAILED` | Wrong database username or password in `MONGO_URI`. |
| `DATABASE_URI_INVALID` | `MONGO_URI` is malformed (must start with `mongodb://` or `mongodb+srv://`). |

Other login errors:

- **"Login is not configured on the server (JWT_SECRET is missing)"**: set `JWT_SECRET` on Vercel.
- **"Google sign-in is not configured on the server"**: set `GOOGLE_CLIENT_ID` on Vercel.
- **"Google sign-in could not be verified"**: the frontend and backend Google client IDs are different.
- **"This website is not allowed to talk to the server (CORS)"**: add the frontend URL to `CLIENT_ORIGINS`.
