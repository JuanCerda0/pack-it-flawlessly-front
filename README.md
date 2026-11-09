# Pack-it-flawlessly Frontend

Angular application for managing packages and consulting their history and PDF documents. Sign-in uses the configured Cognito Hosted UI. The frontend reads `cognito:groups` from the access token: `ADMIN` sees package management actions; `SUPERVISOR` has read-only access. Spring services validate the same token and enforce authorization.

## Run locally

```bash
npm ci
npm start
npm test -- --watch=false
npm run build
```

Open `http://localhost:4200/?api=local` to call local Paquetes (`8080`), Historial (`8082`) and Documentos (`8083`). Run the services and their PostgreSQL/RabbitMQ dependencies first. The choice is saved in the tab's session storage, so Cognito's redirect back to `/` keeps it. Open `http://localhost:4200/?api=gateway` to switch back to the configured API Gateway stage. Both modes use the Cognito access token through `auth.interceptor.ts`.

The Gateway stage still needs routes and integrations for Historial and Documentos before those views work in `gateway` mode. Use `local` mode while developing them. The frontend runs locally in both modes.

## Main files

- `src/app/app.ts` and `app.html`: session, role-aware package panel, and navigation.
- `src/app/api-endpoints.ts`: local/Gateway API roots.
- `src/app/packages-api.ts`, `history-api.ts`, `documents-api.ts`: REST contracts.
- `src/app/history-page.*`, `documents-page.*`: read-only views and PDF download.
- `src/main.ts`: Cognito and OAuth configuration.

Do not commit tokens, `.env.local`, or AWS private keys.
