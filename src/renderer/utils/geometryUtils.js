import wkx from 'wkx';
import { Buffer } from 'buffer';

/**
 * Checks if a string is a valid PostGIS WKB/EWKB hex string.
 * EWKB starts with '01' (little endian) or '00' (big endian) and contains hex characters.
 */
export const isGeometryValue = (value) => {
  if (typeof value !== 'string') return false;
  // Basic fast check: min length for a point is 42 hex chars. Must be only hex.
  if (value.length < 42 || !/^[0-9a-fA-F]+$/.test(value)) return false;
  
  // Endianness byte check (00 or 01)
  const endian = value.substring(0, 2);
  if (endian !== '00' && endian !== '01') return false;

  return true;
};

/**
 * Scans result fields and rows to identify geometry columns.
 */
export const detectGeometryColumns = (fields, rows) => {
  if (!fields || !rows || rows.length === 0) return [];
  
  const geometryColumns = [];
  
  // For each field, check the first few non-null values to see if they look like WKB hex
  fields.forEach(field => {
    let isGeom = false;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const val = rows[i][field.name];
      if (val !== null && val !== undefined) {
        if (isGeometryValue(val)) {
          isGeom = true;
          break;
        }
      }
    }
    if (isGeom) {
      geometryColumns.push(field.name);
    }
  });
  
  return geometryColumns;
};

/**
 * Parses a WKB/EWKB hex string into a GeoJSON geometry object.
 */
export const parseWKBHex = (hexString) => {
  try {
    const buffer = Buffer.from(hexString, 'hex');
    const geometry = wkx.Geometry.parse(buffer);
    return geometry.toGeoJSON();
  } catch (err) {
    console.error('Failed to parse WKB geometry:', err);
    return null;
  }
};

/**
 * Builds a GeoJSON FeatureCollection from rows, extracting the geometry and setting properties.
 */
export const buildFeatureCollection = (rows, geomColumn) => {
  const features = [];
  
  rows.forEach((row, index) => {
    const geomHex = row[geomColumn];
    if (geomHex && isGeometryValue(geomHex)) {
      const geoJsonGeom = parseWKBHex(geomHex);
      if (geoJsonGeom) {
        // Build properties from all other columns
        const properties = { ...row };
        // Don't include the huge hex string in the popup properties
        delete properties[geomColumn];
        
        features.push({
          type: 'Feature',
          id: index,
          geometry: geoJsonGeom,
          properties: properties
        });
      }
    }
  });
  
  return {
    type: 'FeatureCollection',
    features: features
  };
};
