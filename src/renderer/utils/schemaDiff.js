/**
 * Simple schema diff util for Postgres Manager
 * Compares two schema snapshots
 */

export const computeSchemaDiff = (oldSchema, newSchema) => {
  const diff = {
    addedTables: [],
    removedTables: [],
    modifiedTables: [],
    addedColumns: [],
    removedColumns: [],
    modifiedColumns: []
  };

  // Tables comparison
  const oldTables = new Set(oldSchema.tables.map(t => t.name));
  const newTables = new Set(newSchema.tables.map(t => t.name));

  diff.addedTables = Array.from(newTables).filter(t => !oldTables.has(t));
  diff.removedTables = Array.from(oldTables).filter(t => !newTables.has(t));

  // For simplicity, mark any table not added/removed as modified
  const commonTables = Array.from(newTables).filter(t => oldTables.has(t));
  diff.modifiedTables = commonTables;

  return diff;
};

export const generateSchemaSnapshot = (metadata) => {
  return {
    timestamp: new Date().toISOString(),
    tables: metadata.tables.map(t => ({
      name: t.table_name,
      columns: t.columns.map(c => ({ name: c.column_name, type: c.data_type })),
      indexes: t.indexes || []
    }))
  };
};
