# Submit a site for the local plan prototype

This is a prototype for testing the Submit a site tool. 

The Submit a Site tool is to allow local planning authorities to publish a standardised form so that land owners, developers and members of the public can submit sites for consideration in the local plan.

The form guides users through providing site details, boundaries, constraints, landowner information and proposed uses.

The prototype is created and maintained by the Plan Making team at MHCLG.

## Run locally

You’ll need Node.js and npm installed.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file from the example:

   ```bash
   cp .env.example .env
   ```

   Replace the placeholder values for `ORDNANCE_SURVEY_API_SECRET` and `ORDNANCE_SURVEY_API_KEY` in `.env` with your Ordnance Survey credentials. These are used for the site-boundary map.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
