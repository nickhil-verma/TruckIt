import { useEffect, useRef, useState } from "react";

export default function LeafletMapComponent({ 
  pointA, 
  pointB, 
  viaStopsCoords, 
  routeGeometry, 
  onMapClick, 
  heightClass = "w-full h-full min-h-[450px]" 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);
  const onMapClickRef = useRef(onMapClick);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    let active = true;
    
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;
      
      // Load Leaflet css and js if not already present
      if (!window.L) {
        await new Promise((resolve) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
          
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      if (!active) return;

      if (!mapInstanceRef.current && mapRef.current) {
        // Prevent double initialization
        if (mapRef.current._leaflet_id) {
          return;
        }

        const L = window.L;
        const map = L.map(mapRef.current, {
          center: [20.5937, 78.9629],
          zoom: 5,
          zoomControl: false,
        });
        
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: "©OSM ©Carto",
          maxZoom: 19,
        }).addTo(map);
        
        L.control.zoom({ position: "bottomright" }).addTo(map);
        
        map.on("click", (e) => {
          if (onMapClickRef.current) {
            onMapClickRef.current(e.latlng.lat, e.latlng.lng);
          }
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      }
    };

    loadLeaflet();

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn("Error during map cleanup:", err);
        }
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapReady) return;
    
    // Clean up previous layers
    layersRef.current.forEach((l) => {
      try {
        map.removeLayer(l);
      } catch (err) {
        console.warn("Error removing layer:", err);
      }
    });
    layersRef.current = [];

    const isValidCoord = (coord) => {
      return coord && 
             typeof coord.lat === 'number' && 
             typeof coord.lon === 'number' && 
             !isNaN(coord.lat) && 
             !isNaN(coord.lon) &&
             (coord.lat !== 0 || coord.lon !== 0);
    };

    const hasValidA = isValidCoord(pointA);
    const hasValidB = isValidCoord(pointB);

    // Draw marker A
    if (hasValidA) {
      const iconA = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;background:#f97316;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(249,115,22,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:900">A</div>`,
        iconAnchor: [10, 10],
      });
      const mA = L.marker([pointA.lat, pointA.lon], { icon: iconA }).addTo(map);
      layersRef.current.push(mA);
    }

    // Draw marker B
    if (hasValidB) {
      const iconB = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;background:#16a34a;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(22,163,74,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:900">B</div>`,
        iconAnchor: [10, 10],
      });
      const mB = L.marker([pointB.lat, pointB.lon], { icon: iconB }).addTo(map);
      layersRef.current.push(mB);
    }

    // Draw transit via-stops
    if (viaStopsCoords && viaStopsCoords.length > 0) {
      viaStopsCoords.forEach((coord, index) => {
        if (isValidCoord(coord)) {
          const iconVia = L.divIcon({
            className: "",
            html: `<div style="width:18px;height:18px;background:#8b5cf6;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(139,92,246,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:bold">${index + 1}</div>`,
            iconAnchor: [9, 9],
          });
          const marker = L.marker([coord.lat, coord.lon], { icon: iconVia }).addTo(map);
          layersRef.current.push(marker);
        }
      });
    }

    // Draw route geometry
    if (routeGeometry && routeGeometry.length > 0) {
      const validPoints = routeGeometry.filter(
        pt => pt && pt.length === 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number' && !isNaN(pt[0]) && !isNaN(pt[1])
      );
      if (validPoints.length > 0) {
        const polyline = L.polyline(validPoints, {
          color: "#f97316",
          weight: 5,
          opacity: 0.85,
        }).addTo(map);
        layersRef.current.push(polyline);
        const bounds = polyline.getBounds();
        if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
          map.invalidateSize();
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    } else if (hasValidA && hasValidB) {
      const bounds = L.latLngBounds(L.latLng(pointA.lat, pointA.lon), L.latLng(pointB.lat, pointB.lon));
      if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (hasValidA) {
      map.setView([pointA.lat, pointA.lon], 12);
    } else if (hasValidB) {
      map.setView([pointB.lat, pointB.lon], 12);
    }
  }, [mapReady, pointA, pointB, viaStopsCoords, routeGeometry]);

  return (
    <div
      ref={mapRef}
      className={`${heightClass} rounded-3xl overflow-hidden shadow-inner border border-slate-100`}
      style={{ position: "relative", zIndex: 1 }}
    />
  );
}
