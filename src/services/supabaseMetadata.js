import { supabase, isSupabaseConfigured } from '../supabaseClient';

const PUBLIC_SCHEMA = 'public';
const tableMetadataCache = new Map();

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
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', PUBLIC_SCHEMA)
      .eq('table_name', normalizedTable);
  } catch (error) {
    return {
      table: normalizedTable,
      columns: [],
      exists: null,
      error,
    };
  }

  const { data, error } = response ?? {};

  if (error) {
    return {
      table: normalizedTable,
      columns: [],
      exists: null,
      error,
    };
  }

  const columns = Array.isArray(data)
    ? data
        .map((row) => (typeof row?.column_name === 'string' ? row.column_name : null))
        .filter(Boolean)
    : [];

  const metadata = {
    table: normalizedTable,
    columns,
    exists: columns.length > 0,
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
