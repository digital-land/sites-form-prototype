# Submit a site for the local plan prototype

This is a prototype for testing the Submit a site tool. 

The Submit a Site tool is to allow local planning authorities to publish a standardised form so that land owners, developers and members of the public can submit sites for consideration in the local plan.

The form guides users through providing site details, boundaries, constraints, landowner information and proposed uses.

The prototype is created and maintained by the Plan Making team at MHCLG.

## Run locally

You’ll need Node.js 26 and npm installed. If you use nvm, run `nvm use` to pick up the version in `.nvmrc`.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file from the example:

   ```bash
   cp .env.example .env
   ```

   Replace the placeholder values for `ORDNANCE_SURVEY_API_SECRET` and `ORDNANCE_SURVEY_API_KEY` in `.env` with your Ordnance Survey credentials. The site-boundary map uses the OS Maps NGD API through a server-side proxy; the API key is not sent to the browser.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Heroku

The `Procfile` starts the prototype with `npm start`, and `package.json` pins
Node.js 26. Heroku sets `NODE_ENV=production` and `PORT` for you, so the
Prototype Kit turns on password protection and redirects to HTTPS.

Set these config vars in the Heroku app:

| Name | Required | Purpose |
| --- | --- | --- |
| `PASSWORD` | Yes | Password participants enter to view the prototype. Without it the site shows an error page. |
| `ORDNANCE_SURVEY_API_KEY` | Yes, for the map | Ordnance Survey API key used for the site-boundary map. |

Heroku deploys automatically when changes are pushed to `main`.
