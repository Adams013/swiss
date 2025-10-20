import { supabase, isSupabaseConfigured } from '../supabaseClient';

const tableMetadataCache = new Map();

const interpretTableError = (error, table) => {
  if (!error) {
    return { exists: true, error: null };
  }

  const code = error.code ? String(error.code).toUpperCase() : '';
  const message = error.message ? String(error.message).toLowerCase() : '';
  const normalizedTable = table ? String(table).toLowerCase() : '';

  const schemaCacheFragments = [
    'schema cache',
    'does not exist',
    'not exist',
    'unknown table',
  ];

  const explicitMissingCodes = new Set(['42P01', 'PGRST201', 'PGRST203', 'PGRST210']);

  if (explicitMissingCodes.has(code)) {
    return { exists: false, error };
  }

  if (message) {
    const tableSpecificPatterns = [
      new RegExp(`could not find the table ['\"]?${normalizedTable}['\"]?`),
      new RegExp(`relation ['\"]?${normalizedTable}['\"]? does not exist`),
      new RegExp(`table ['\"]?${normalizedTable}['\"]? does not exist`),
    ];

    if (tableSpecificPatterns.some((pattern) => pattern.test(message))) {
      return { exists: false, error };
    }

    if (schemaCacheFragments.some((fragment) => message.includes(fragment))) {
      return { exists: false, error };
    }
  }

  return { exists: null, error };
};

const normalizeTableName = (tableName) => {
  if (typeof tableName !== 'string') {
    return '';
  }
  return tableName.trim().toLowerCase();
};

const cloneMetadata = (metadata) => ({
  table: metadata.table,
  columns: Array.isArray(metadata.columns) ? [...metadata.columns] : [],
  exists: metadata.exists,
  error: metadata.error ?? null,
});

export const clearTableMetadataCache = () => {
  tableMetadataCache.clear();
};

export const getTableMetadata = async (tableName) => {
  const normalizedTable = normalizeTableName(tableName);

  if (!normalizedTable) {
    return {
      table: normalizedTable,
      columns: [],
      exists: false,
      error: new Error('Table name is required to load Supabase metadata.'),
    };
  }

  if (!isSupabaseConfigured) {
    return {
      table: normalizedTable,
      columns: [],
      exists: false,
      error: null,
    };
  }

  if (tableMetadataCache.has(normalizedTable)) {
    return cloneMetadata(tableMetadataCache.get(normalizedTable));
  }

  let response;
  try {
    response = await supabase
      .from(normalizedTable)
      .select('*', { head: true, count: 'estimated' })
      .limit(0);
  } catch (error) {
    const interpreted = interpretTableError(error, normalizedTable);
    return {
      table: normalizedTable,
      columns: [],
      exists: interpreted.exists,
      error: interpreted.error,
    };
  }

  const { error } = response ?? {};

  if (error) {
    const interpreted = interpretTableError(error, normalizedTable);
    return {
      table: normalizedTable,
      columns: [],
      exists: interpreted.exists,
      error: interpreted.error,
    };
  }

  const metadata = {
    table: normalizedTable,
    columns: [],
    exists: true,
    error: null,
  };

  tableMetadataCache.set(normalizedTable, metadata);

  return cloneMetadata(metadata);
};

export const getTableColumns = async (tableName) => {
  const metadata = await getTableMetadata(tableName);
  return {
    columns: metadata.columns,
    exists: metadata.exists,
    error: metadata.error,
  };
};

export const tableExists = async (tableName) => {
  const metadata = await getTableMetadata(tableName);
  return {
    exists: metadata.exists,
    error: metadata.error,
  };
};
