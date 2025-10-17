# Swiss Startup Connect

## Environment configuration

This project now requires explicit Supabase credentials at build time. Copy the sample file and fill in the values provided by your Supabase project:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and provide values for:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

These variables are loaded automatically for development (`yarn start`) and production builds (`yarn build`). When they are missing the application falls back to a disabled Supabase client that logs helpful warnings but does not perform any remote operations.

## Available scripts

All scripts are managed through `yarn`.

### `yarn start`

Runs the development server after confirming the Supabase environment variables are available. The check will fail with a descriptive message if the configuration is incomplete.

### `yarn build`

Creates an optimized production build. The same Supabase environment validation runs before the build starts to avoid incomplete deployments.

### `yarn test`

Launches the test runner. Provide the Supabase variables in your environment (for example `REACT_APP_SUPABASE_URL=... REACT_APP_SUPABASE_ANON_KEY=... yarn test --watchAll=false`) if you want to run tests outside of Create React App's default `.env` handling.

### `yarn check-env`

Runs the Supabase environment validation directly. This is useful for verifying CI/CD configuration.

## Deployment

Deployments must provide the Supabase environment variables as part of their configuration. Refer to your hosting platform's documentation for setting environment variables securely.

## Resolving merge conflicts on GitHub

When GitHub reports that "This branch has conflicts that must be resolved", pull the latest changes from the base branch and resolve the conflicts locally. After fixing the conflicts (`<<<<<<<`, `=======`, `>>>>>>>`) stage the files, create a commit, and push the branch again so the pull request can be merged.
