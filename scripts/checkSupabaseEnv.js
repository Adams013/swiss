#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const REQUIRED_ENV_VARS = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY'];

const loadEnvFiles = () => {
  const env = process.env.NODE_ENV || 'development';
  const candidateFiles = [
    `.env.${env}.local`,
    env !== 'test' ? '.env.local' : null,
    `.env.${env}`,
    '.env',
  ].filter(Boolean);

  candidateFiles.forEach((relativePath) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  });
};

const collectMissingEnvVars = () => {
  const missing = [];

  REQUIRED_ENV_VARS.forEach((key) => {
    const value = process.env[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      missing.push(key);
    }
  });

  return missing;
};

loadEnvFiles();

const missing = collectMissingEnvVars();

if (missing.length > 0) {
  console.error(
    `\n[checkSupabaseEnv] Missing required Supabase environment variables: ${missing.join(', ')}.`,
  );
  console.error(
    'Create a .env.local file (you can start from .env.example) and populate the variables before running this command.\n',
  );
  process.exit(1);
}
