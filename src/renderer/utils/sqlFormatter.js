export const formatSQL = (sql) => {
  if (!sql) return '';
  
  // Simple SQL formatting
  let formatted = sql
    .replace(/SELECT/gi, '\nSELECT')
    .replace(/FROM/gi, '\nFROM')
    .replace(/WHERE/gi, '\nWHERE')
    .replace(/JOIN/gi, '\n  JOIN')
    .replace(/LEFT JOIN/gi, '\n  LEFT JOIN')
    .replace(/RIGHT JOIN/gi, '\n  RIGHT JOIN')
    .replace(/INNER JOIN/gi, '\n  INNER JOIN')
    .replace(/ORDER BY/gi, '\nORDER BY')
    .replace(/GROUP BY/gi, '\nGROUP BY')
    .replace(/HAVING/gi, '\nHAVING')
    .replace(/AND/gi, '\n  AND')
    .replace(/OR/gi, '\n  OR')
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\s*\n\s*/g, '\n') // Trim spaces around newlines
    .replace(/UNION/gi, '\nUNION\n'     ) // Add newlines around UNION
    .replace(/INSERT INTO/gi, '\nINSERT INTO')
    .replace(/VALUES/gi, '\nVALUES')
    .replace(/UPDATE/gi, '\nUPDATE')
    .replace(/DELETE FROM/gi, '\nDELETE FROM')
    .replace(/CREATE TABLE/gi, '\nCREATE TABLE')
    .replace(/ALTER TABLE/gi, '\nALTER TABLE')
    .replace(/DROP TABLE/gi, '\nDROP TABLE')
    .replace(/TRUNCATE TABLE/gi, '\nTRUNCATE TABLE')
    .replace(/CASE/gi, '\nCASE')
    .replace(/END/gi, '\nEND')
    .replace(/WHEN/gi, '\n  WHEN')
    .replace(/THEN/gi, '\n  THEN')
    .replace(/ELSE/gi, '\n  ELSE')

    .trim();
  
  return formatted;
};

export const compressSQL = (sql) => {
  return sql.replace(/\s+/g, ' ').trim();
};