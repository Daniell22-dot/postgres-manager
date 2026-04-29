import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Maximize2 } from 'lucide-react';
import { buildFeatureCollection } from '../../utils/geometryUtils';

// Fix Leaflet's default icon path issues with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GeometryViewer = ({ results, geomColumn }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const geoJsonLayer = useRef(null);
  const [featureCount, setFeatureCount] = useState(0);

  useEffect(() => {
    // Initialize map
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [0, 0],
        zoom: 2,
        layers: [],
        attributionControl: true
      });

      // Base maps
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });

      const googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '© Google',
        maxZoom: 20,
      });

      const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      });

      // Default base layer
      dark.addTo(mapInstance.current);

      // Add layer control
      L.control.layers({
        "Dark Mode (Default)": dark,
        "OpenStreetMap": osm,
        "Google Satellite": googleSat,
      }, null, { position: 'bottomright' }).addTo(mapInstance.current);

      // Fix for the "white map" issue — force a resize check after a short delay
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 100);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !results || !results.rows || !geomColumn) return;

    // Clear previous layer
    if (geoJsonLayer.current) {
      mapInstance.current.removeLayer(geoJsonLayer.current);
    }

    // Performance limit
    let rowsToRender = results.rows;
    if (rowsToRender.length > 100000) {
      console.warn('Capping rendered geometries to 100,000 for performance.');
      rowsToRender = rowsToRender.slice(0, 100000);
    }

    const featureCollection = buildFeatureCollection(rowsToRender, geomColumn);
    setFeatureCount(featureCollection.features.length);

    if (featureCollection.features.length === 0) return;

    // Define style based on geometry type
    const styleFunction = (feature) => {
      switch (feature.geometry.type) {
        case 'Point':
        case 'MultiPoint':
          return { color: '#89b4fa', weight: 2, fillOpacity: 0.5 };
        case 'LineString':
        case 'MultiLineString':
          return { color: '#a6e3a1', weight: 3 };
        case 'Polygon':
        case 'MultiPolygon':
          return { color: '#cba6f7', weight: 2, fillOpacity: 0.4 };
        default:
          return { color: '#f38ba8', weight: 2 };
      }
    };

    // Define point to layer logic (use circle markers for points)
    const pointToLayer = (feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: '#89b4fa',
        color: '#1e1e2e',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
    };

    // On each feature (add popup)
    const onEachFeature = (feature, layer) => {
      if (feature.properties) {
        let popupContent = '<div class="geometry-popup"><table>';
        for (const [key, value] of Object.entries(feature.properties)) {
          // Truncate long values
          let displayVal = value;
          if (typeof value === 'object' && value !== null) displayVal = JSON.stringify(value);
          if (String(displayVal).length > 100) displayVal = String(displayVal).substring(0, 100) + '...';
          
          popupContent += `<tr><th>${key}</th><td>${displayVal !== null ? displayVal : '<i>null</i>'}</td></tr>`;
        }
        popupContent += '</table></div>';
        layer.bindPopup(popupContent, { maxHeight: 300, className: 'dark-popup' });
      }
    };

    geoJsonLayer.current = L.geoJSON(featureCollection, {
      style: styleFunction,
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    }).addTo(mapInstance.current);

    // Fit map to data bounds
    if (geoJsonLayer.current.getBounds().isValid()) {
      mapInstance.current.fitBounds(geoJsonLayer.current.getBounds(), { padding: [40, 40] });
    }

    // Ensure map displays correctly (fixes "white map" issue)
    setTimeout(() => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    }, 100);

  }, [results, geomColumn]);

  const handleRecenter = () => {
    if (mapInstance.current && geoJsonLayer.current && geoJsonLayer.current.getBounds().isValid()) {
      mapInstance.current.fitBounds(geoJsonLayer.current.getBounds(), { padding: [40, 40] });
    }
  };

  return (
    <div className="geometry-viewer-container">
      <div className="geometry-viewer-header">
        <div className="geometry-stats">
          <Layers size={14} />
          <span>{featureCount.toLocaleString()} geometries mapped</span>
        </div>
        <button 
          className="btn-premium flex items-center gap-2 py-1 px-3 text-[11px] font-bold"
          onClick={handleRecenter}
        >
          <Maximize2 size={12} className="text-blue-400" />
          <span>RECENTER VIEW</span>
        </button>
      </div>
      <div className="geometry-map" ref={mapRef}></div>
    </div>
  );
};

export default GeometryViewer;
