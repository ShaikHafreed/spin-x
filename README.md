# Spin-X Dashboard

This project has:

- a React + Vite frontend in the workspace root
- an Express + MySQL API in `server/`

## Local Development

Frontend:

```bash
npm install
npm run dev -- --host
```

Backend:

```bash
cd server
npm install
npm run dev
```

The frontend uses `/api` by default and Vite proxies requests to the backend on port `4000`.

## Access From Other Laptops On The Same Network

1. Run MySQL on the laptop hosting the backend.
2. In `server/.env`, set `HOST=0.0.0.0`.
3. Keep `MYSQL_HOST=localhost` if MySQL is on the same host as the backend.
4. Set `FRONTEND_ORIGIN` to allow the frontend URL used by other laptops.
5. Start the backend and frontend on the host laptop.
6. Find the host laptop's LAN IP, for example `192.168.1.10`.
7. Open `http://<HOST_LAN_IP>:5173` from another laptop.

Example `server/.env` values:

```env
HOST=0.0.0.0
PORT=4000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=football
FRONTEND_ORIGIN=http://localhost:5173,http://192.168.1.10:5173
JWT_SECRET=replace_with_a_strong_random_secret
```

## Important Notes

- Other laptops can only use the app while the host laptop is running both the backend and MySQL.
- Windows Firewall may need inbound access enabled for ports `5173` and `4000`.
- If you want the app to work outside your local network, you need to deploy the frontend, backend, and database instead of relying on LAN access.

## Internet Deployment

If you want the app to keep working when your laptop is off, MySQL is not running locally, and users are on different networks, then the app must run on hosted infrastructure.

## Managed Hosting

The recommended setup for this repository is:

- frontend on Vercel
- backend on Railway
- MySQL on Railway or another managed MySQL provider

### Frontend On Vercel

Files prepared for Vercel:

- `vercel.json`
- `.env.example`

Deploy the workspace root as the frontend project.

Set this environment variable in Vercel:

```env
VITE_API_BASE_URL=https://your-backend-domain.example.com/api
```

Notes:

- Vercel will build the root Vite app
- `vercel.json` keeps SPA routes working by rewriting requests to `index.html`

### Backend On Railway

Files prepared for Railway:

- `server/nixpacks.toml`
- `server/.env.example`

Deploy the `server/` folder as the Railway service root.

Set these environment variables in Railway:

```env
HOST=0.0.0.0
PORT=4000
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=football
FRONTEND_ORIGIN=https://your-frontend-domain.example.com
JWT_SECRET=replace_with_a_long_random_secret
```

Notes:

- Railway can provide a managed MySQL database, or you can connect any external MySQL provider
- the backend already reads all connection details from environment variables
- `server/nixpacks.toml` makes Railway install and start the backend consistently

### Recommended Deployment Order

1. Create the backend service on Railway from the `server/` directory.
2. Create or attach a managed MySQL database.
3. Set the Railway backend environment variables.
4. Deploy the backend and copy its public URL.
5. Create the Vercel frontend project from the repository root.
6. Set `VITE_API_BASE_URL` in Vercel to the Railway backend URL plus `/api`.
7. Redeploy the frontend.
8. Update `FRONTEND_ORIGIN` in Railway to the final Vercel frontend URL.

### Example URLs

- frontend: `https://spin-x.vercel.app`
- backend: `https://spin-x-api.up.railway.app`
- frontend env: `VITE_API_BASE_URL=https://spin-x-api.up.railway.app/api`
- backend env: `FRONTEND_ORIGIN=https://spin-x.vercel.app`

You need three hosted pieces:

- a static frontend host for the React app
- a public backend host for the Express API
- a hosted MySQL database

Recommended deployment shape:

1. Deploy the frontend build output from `dist/` to a static host.
2. Deploy the Express app in `server/` to a Node.js host.
3. Create a hosted MySQL database.
4. Set the backend environment variables to the hosted MySQL connection values.
5. Set `FRONTEND_ORIGIN` on the backend to your real frontend URL.
6. Set `VITE_API_BASE_URL` in the frontend to your public API URL, for example `https://api.example.com/api`.

Frontend production environment:

```env
VITE_API_BASE_URL=https://your-api-domain.example.com/api
```

Backend production environment:

```env
HOST=0.0.0.0
PORT=4000
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=football
FRONTEND_ORIGIN=https://your-frontend-domain.example.com
JWT_SECRET=replace_with_a_long_random_secret
```

Build and deploy commands:

Frontend:

```bash
npm install
npm run build
```

Backend:

```bash
cd server
npm install
npm start
```

What changes compared to your current local setup:

- `MYSQL_HOST` must stop pointing to `localhost`
- the frontend must stop calling your laptop IP and instead call the hosted API URL
- the backend and database must run on remote infrastructure, not your laptop

Without that infrastructure, the requirement cannot be met. The code can be made deployment-ready, but availability after your laptop is off always depends on a remote host running the app.

## Docker Deployment

This repository now includes a container setup for a VPS or cloud VM:

- `web`: serves the React frontend through Nginx
- `api`: runs the Express backend
- `mysql`: runs MySQL with a persistent Docker volume

Files added for this setup:

- `Dockerfile`
- `server/Dockerfile`
- `docker/nginx/default.conf`
- `docker-compose.yml`
- `docker/compose.env.example`

### Start The Stack

1. Install Docker and Docker Compose on the server.
2. Copy `docker/compose.env.example` to a secure file such as `docker/compose.env`.
3. Replace the example values with real secrets and your public server URL.
4. Run:

```bash
docker compose --env-file docker/compose.env up -d --build
```

### Example Compose Env

```env
MYSQL_ROOT_PASSWORD=change_this_mysql_password
MYSQL_DATABASE=football
JWT_SECRET=replace_with_a_long_random_secret
APP_ORIGIN=http://your-server-ip-or-domain
APP_PORT=8080
APP_DOMAIN=your-domain.example.com
ACME_EMAIL=admin@your-domain.example.com
```

### How It Works

- browsers connect only to the `web` container
- Nginx proxies `/api` requests internally to the `api` container
- the backend connects internally to the `mysql` container
- MySQL data is stored in the `mysql_data` Docker volume

### Operational Notes

- set `APP_ORIGIN` to the exact public URL users will open
- open the server firewall for the published HTTP port, usually `8080` for the base stack
- if you already have a managed MySQL service, change `MYSQL_HOST`, `MYSQL_USER`, and `MYSQL_PASSWORD` in `docker-compose.yml` to use that external database instead of the bundled `mysql` service

### HTTPS With A Real Domain

This repository now includes an HTTPS-ready override using Caddy for automatic TLS.

Requirements:

1. Point your domain's DNS `A` record to your VPS public IP.
2. Set `APP_DOMAIN` to that domain in `docker/compose.env`.
3. Set `ACME_EMAIL` to a valid email address for certificate registration.
4. Open ports `80` and `443` on the server firewall.

Run the secure stack with:

```bash
docker compose \
	--env-file docker/compose.env \
	-f docker-compose.yml \
	-f docker-compose.https.yml \
	up -d --build
```

Files used for HTTPS:

- `docker-compose.https.yml`
- `docker/Caddyfile`

With this override:

- Caddy is the public entrypoint on ports `80` and `443`
- Caddy automatically provisions and renews TLS certificates
- traffic is forwarded internally to the `web` container
- users access the app with `https://your-domain.example.com`
