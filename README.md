# Connectly Chat

Connectly Chat is a full-stack real-time messaging app built with React, Vite, Tailwind CSS, shadcn/ui-style components, Express, MongoDB, JWT authentication, email OTP signup, and Socket.io.

## Features

- Email and password authentication with signup OTP verification
- One-to-one conversations with request, accept, delete, block, and unblock flows
- Group conversations with participant management
- Real-time messages, typing indicators, read status updates, profile status updates, and screenshot alerts
- Optimistic message sending for a faster chat experience
- Light/dark theme support
- MongoDB-backed API with an Express server

## Tech Stack

- Frontend: React 18, Vite, React Router, Tailwind CSS, Radix UI primitives, Socket.io client
- Backend: Node.js, Express, MongoDB, Socket.io, JWT, bcryptjs, Nodemailer
- Testing and quality: Vitest, React Testing Library, ESLint

## Project Structure

```text
.
|-- public/                 Static frontend assets
|-- server/                 Express API, MongoDB access, auth, email, Socket.io server
|   |-- routes/             API route handlers
|   |-- auth.js             Password hashing and JWT helpers
|   |-- db.js               MongoDB connection
|   |-- email.js            OTP email delivery
|   |-- models.js           Collection names and document formatting
|   `-- server.js           API and Socket.io entrypoint
|-- src/                    React frontend
|   |-- components/         UI and chat components
|   |-- contexts/           Auth and chat state providers
|   |-- hooks/              Shared React hooks
|   |-- lib/                API and Socket.io clients
|   |-- pages/              App routes
|   `-- test/               Test setup and specs
|-- package.json            Frontend scripts and dependencies
`-- vite.config.js          Vite configuration
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB, either local or hosted
- SMTP credentials if you want real OTP emails

## Getting Started

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

Create a frontend `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

Create a backend `.env` file in `server/`:

```env
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:8080

# Optional SMTP settings for signup OTP emails
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
DEBUG_SMTP=false

# Optional HTTPS email API fallback for hosts that block SMTP ports
RESEND_API_KEY=
RESEND_FROM=
```

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:8080
```

The API health check is available at:

```text
http://localhost:3001/api/health
```

## Available Scripts

Frontend scripts:

```bash
npm run dev          # Start Vite dev server on port 8080
npm run build        # Build production frontend
npm run build:dev    # Build frontend in development mode
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run Vitest once
npm run test:watch   # Run Vitest in watch mode
```

Backend scripts, from `server/`:

```bash
npm run dev          # Start API with node --watch
npm start            # Start API normally
```

## Environment Variables

Frontend:

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL for the REST API | `http://localhost:3001/api` |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:3001` |

Backend:

| Variable | Description | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/chatapp` |
| `JWT_SECRET` | Secret used to sign JWTs | Development fallback in code |
| `CLIENT_URL` | Allowed frontend origin for CORS | Not set |
| `PORT` | Backend server port | `3001` |
| `SMTP_HOST` | SMTP host for OTP email | Not set |
| `SMTP_PORT` | SMTP port | Not set |
| `SMTP_SECURE` | Whether SMTP uses TLS | `false` |
| `SMTP_USER` | SMTP username | Not set |
| `SMTP_PASS` | SMTP password | Not set |
| `SMTP_FROM` | Sender email address | Falls back to `SMTP_USER` |
| `DEBUG_SMTP` | Log SMTP env presence for debugging | `false` |
| `RESEND_API_KEY` | Resend API key for HTTPS OTP email delivery | Not set |
| `RESEND_FROM` | Resend sender address, such as `Connectly <otp@yourdomain.com>` | Falls back to `SMTP_FROM` |

If SMTP is not configured, signup OTP codes are logged to the backend console for local development.

## MongoDB Notes

The app uses these collections:

- `users`
- `profiles`
- `signup_otps`
- `conversations`
- `messages`
- `typing_indicators`
- `blocks`

For production, add indexes for commonly queried fields such as user email, profile username, profile user ID, conversation participants, message conversation ID, message creation time, block pairs, and signup OTP email.

## Development Notes

- The frontend runs on port `8080` by default.
- The backend runs on port `3001` by default.
- Root `.env` files are ignored by Git. Keep real secrets out of version control.
- The project currently contains both `package-lock.json` and `bun.lockb`; use one package manager consistently to avoid dependency drift.

## Deployment

The included `vercel.json` rewrites frontend routes to `index.html`, which supports React Router in static deployments.

Deploy the frontend and backend separately unless your hosting provider supports long-running Node.js servers and WebSockets in the same deployment. The backend needs MongoDB access, a stable `JWT_SECRET`, CORS configured with the deployed frontend URL, and Socket.io/WebSocket support.

## Troubleshooting

If the frontend cannot connect to the API, confirm the backend is running and that `VITE_API_URL` points to the correct `/api` URL.

If Socket.io events do not arrive, confirm `VITE_SOCKET_URL` points to the backend origin without `/api`.

If signup email does not send, configure SMTP variables or check the backend console for the local development OTP log.

If PowerShell blocks npm scripts on Windows, use `npm.cmd` instead of `npm`, or adjust the local execution policy.
