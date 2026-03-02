# SmartHire

Full-stack interview practice platform:
- Frontend: React + Vite (`SmartHire`)
- Backend: Node + Express + MongoDB (`smarthire-server`)
- Optional Python evaluator for AI scoring

## Run with Docker Compose

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

Notes:
- Frontend container runs on unprivileged nginx (`8080` inside container, mapped to `5173` on host).
- Backend container runs as non-root user.

Health endpoints:
- Live check: `http://localhost:5000/health/live`
- Readiness check: `http://localhost:5000/health/ready`

Stop services:

```bash
docker compose down
```

## Local Development

Backend:

```bash
cd smarthire-server
npm install
npm start
```

Frontend:

```bash
cd SmartHire
npm install
npm run dev
```

Rebuild question dataset after markdown/source updates:

```bash
cd smarthire-server
npm run build:practice
```

## Environment Setup

- Copy `smarthire-server/.env.example` to `smarthire-server/.env` and fill secrets.
- Copy `SmartHire/.env.example` to `SmartHire/.env` if needed.
