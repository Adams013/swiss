import supabase from '../supabaseClient';

/**
 * Detects a missing column name from a Supabase error message
 * @param {string} message - Error message from Supabase
 * @param {string} tableName - Name of the table (optional)
 * @returns {string|null} - The name of the missing column, or null if not found
 */
export const detectMissingColumn = (message, tableName = '') => {
  if (typeof message !== 'string') {
    return null;
  }

  const normalizedTable = tableName ? tableName.replace(/["'`]/g, '') : '';

  const tableSpecificPatterns = normalizedTable
    ? [
        new RegExp(`column "([^"\\s]+)" of relation "${normalizedTable}" does not exist`, 'i'),
        new RegExp(`could not find the '([^']+)' column of '${normalizedTable}'`, 'i'),
      ]
    : [];

  const genericPatterns = [
    /column "([^"\\s]+)" of relation "[^"]+" does not exist/i,
    /could not find the '([^']+)' column of/i,
    /column "([^"\\s]+)" does not exist/i,
    /"([^"\\s]+)" column does not exist/i,
  ];

  for (const pattern of [...tableSpecificPatterns, ...genericPatterns]) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Derives column presence from an array of records
 * @param {Array} records - Array of database records
 * @returns {Object} - Object mapping column names to true
 */
export const deriveColumnPresence = (records) => {
  if (!Array.isArray(records)) {
    return {};
  }

  return records.reduce((accumulator, record) => {
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      Object.keys(record).forEach((key) => {
        accumulator[key] = true;
      });
    }
    return accumulator;
  }, {});
};

/**
 * Filters out columns that are not supported (marked as false in columnPresence)
 * @param {Object} payload - Data payload to filter
 * @param {Object} columnPresence - Column presence map
 * @returns {Object} - Filtered payload
 */
export const filterUnsupportedColumns = (payload, columnPresence) => {
  return Object.entries(payload).reduce((accumulator, [key, value]) => {
    if (columnPresence[key] === false) {
      return accumulator;
    }
    if (value === undefined) {
      return accumulator;
    }
    accumulator[key] = value;
    return accumulator;
  }, {});
};

/**
 * Performs a resilient select query with automatic column detection and fallback
 * @param {string} table - Table name
 * @param {Object} options - Query options
 * @param {Array<string>} options.columns - Initial columns to select
 * @param {Object} options.columnPresence - Column presence map
 * @param {Function} options.onColumnMissing - Callback when a column is missing
 * @param {Function} options.queryBuilder - Optional query builder function
 * @returns {Promise<{data: Array, error: Error|null, usedColumns: Array<string>}>}
 */
export const resilientSelect = async ({ 
  table, 
  columns, 
  columnPresence = {}, 
  onColumnMissing = () => {}, 
  queryBuilder = null 
}) => {
  let columnsToRequest = [...columns];
  let result = { data: null, error: null, usedColumns: [] };

  while (columnsToRequest.length > 0) {
    const selectColumns = columnsToRequest.join(', ');
    let query = supabase.from(table).select(selectColumns);

    // Apply custom query builder if provided
    if (queryBuilder) {
      query = queryBuilder(query);
    }

    const { data, error } = await query;

    if (!error) {
      result.data = data;
      result.usedColumns = columnsToRequest;
      break;
    }

    const missingColumn = detectMissingColumn(error.message, table);
    if (!missingColumn || !columnsToRequest.includes(missingColumn)) {
      result.error = error;
      break;
    }

    // Remove the missing column and update presence
    columnsToRequest = columnsToRequest.filter((col) => col !== missingColumn);
    onColumnMissing(missingColumn);
  }

  return result;
};

/**
 * Performs a resilient upsert operation with automatic column detection and retry
 * @param {string} table - Table name
 * @param {Object} payload - Data to upsert
 * @param {Object} options - Upsert options
 * @param {Object} options.columnPresence - Column presence map
 * @param {Function} options.onColumnMissing - Callback when a column is missing
 * @param {Function} options.onColumnPresenceUpdate - Callback to update column presence
 * @param {string|Array<string>} options.onConflict - Conflict resolution column(s)
 * @param {number} options.maxRetries - Maximum number of retries (default: 10)
 * @returns {Promise<{data: Object|null, error: Error|null, finalPayload: Object}>}
 */
export const resilientUpsert = async ({ 
  table, 
  payload, 
  columnPresence = {}, 
  onColumnMissing = () => {}, 
  onColumnPresenceUpdate = () => {},
  onConflict,
  maxRetries = 10 
}) => {
  let attemptPayload = filterUnsupportedColumns(payload, columnPresence);
  let retries = 0;
  const removedColumns = new Set();

  while (retries < maxRetries && Object.keys(attemptPayload).length > 0) {
    const { data, error } = await supabase
      .from(table)
      .upsert(attemptPayload, onConflict ? { onConflict } : undefined)
      .select('*')
      .single();

    if (!error) {
      // Update column presence for successful columns
      onColumnPresenceUpdate(Object.keys(attemptPayload));
      return { data, error: null, finalPayload: attemptPayload };
    }

    const missingColumn = detectMissingColumn(error.message, table);
    if (!missingColumn) {
      return { data: null, error, finalPayload: attemptPayload };
    }

    if (removedColumns.has(missingColumn) && !Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
      return { data: null, error, finalPayload: attemptPayload };
    }

    // Remove the missing column
    const { [missingColumn]: _omitted, ...rest } = attemptPayload;
    attemptPayload = rest;
    removedColumns.add(missingColumn);
    onColumnMissing(missingColumn);
    retries++;
  }

  return { 
    data: null, 
    error: new Error('Max retries reached or no columns remaining'), 
    finalPayload: attemptPayload 
  };
};

/**
 * Performs a resilient insert operation with automatic column detection and retry
 * @param {string} table - Table name
 * @param {Object} payload - Data to insert
 * @param {Object} options - Insert options
 * @param {Object} options.columnPresence - Column presence map
 * @param {Function} options.onColumnMissing - Callback when a column is missing
 * @param {Function} options.onColumnPresenceUpdate - Callback to update column presence
 * @param {number} options.maxRetries - Maximum number of retries (default: 10)
 * @returns {Promise<{data: Object|null, error: Error|null, finalPayload: Object}>}
 */
export const resilientInsert = async ({ 
  table, 
  payload, 
  columnPresence = {}, 
  onColumnMissing = () => {}, 
  onColumnPresenceUpdate = () => {},
  maxRetries = 10 
}) => {
  let attemptPayload = filterUnsupportedColumns(payload, columnPresence);
  let retries = 0;
  const removedColumns = new Set();

  while (retries < maxRetries && Object.keys(attemptPayload).length > 0) {
    const { data, error } = await supabase
      .from(table)
      .insert(attemptPayload)
      .select('*');

    if (!error) {
      // Update column presence for successful columns
      onColumnPresenceUpdate(Object.keys(attemptPayload));
      return { data, error: null, finalPayload: attemptPayload };
    }

    const missingColumn = detectMissingColumn(error.message, table);
    if (!missingColumn) {
      return { data: null, error, finalPayload: attemptPayload };
    }

    if (removedColumns.has(missingColumn) && !Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
      return { data: null, error, finalPayload: attemptPayload };
    }

    // Remove the missing column
    const { [missingColumn]: _omitted, ...rest } = attemptPayload;
    attemptPayload = rest;
    removedColumns.add(missingColumn);
    onColumnMissing(missingColumn);
    retries++;
  }

  return { 
    data: null, 
    error: new Error('Max retries reached or no columns remaining'), 
    finalPayload: attemptPayload 
  };
};

/**
 * Generic query executor with error handling
 * @param {Function} queryFn - Function that returns a Supabase query
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export const executeQuery = async (queryFn) => {
  try {
    const { data, error } = await queryFn();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Query execution error:', error);
    return { data: null, error };
  }
};

