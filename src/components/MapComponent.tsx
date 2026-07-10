import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { Style, Circle as CircleStyle, Fill, Stroke, Text, RegularShape } from 'ol/style';
import Overlay from 'ol/Overlay';
import { FullScreen, ScaleLine, Zoom, Control } from 'ol/control';
import { easeOut } from 'ol/easing';
import { getDistance } from 'ol/sphere';
import { boundingExtent } from 'ol/extent';
import 'ol/ol.css';

import { TempleFeature, BaseMapType } from '../types';
import { getDeityColor } from './Legend';
import { MapPin, Navigation, X, Layers, Crosshair, Clock } from 'lucide-react';

interface MapComponentProps {
  temples: TempleFeature[];
  baseMap: BaseMapType;
  setBaseMap: (bm: BaseMapType) => void;
  selectedTemple: TempleFeature | null;
  setSelectedTemple: (t: TempleFeature | null) => void;
  mapCenter: [number, number] | null;
}

const basemaps: Record<BaseMapType, TileLayer<any>> = {
  google: new TileLayer({
    source: new XYZ({
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      maxZoom: 20,
      attributions: '&copy; Google'
    })
  })
};

export default function MapComponent({ temples, baseMap, setBaseMap, selectedTemple, setSelectedTemple, mapCenter }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);
  const vectorLayer = useRef<VectorLayer<any> | null>(null);
  const pathSource = useRef<VectorSource | null>(null);
  const pathLayer = useRef<VectorLayer<any> | null>(null);
  const popupOverlay = useRef<Overlay | null>(null);

  const [popupData, setPopupData] = useState<TempleFeature | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || !popupRef.current) return;

    // Sources
    vectorSource.current = new VectorSource();
    pathSource.current = new VectorSource();

    // Style function for single features
    const getStyle = (feature: Feature) => {
      const templeFeature = feature.get('templeData') as TempleFeature;
      const color = getDeityColor(templeFeature.properties.Deity);
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      });
    };

    vectorLayer.current = new VectorLayer({
      source: vectorSource.current,
      style: getStyle
    });

    pathLayer.current = new VectorLayer({
      source: pathSource.current,
      style: [
        new Style({
          stroke: new Stroke({
            color: 'rgba(234, 88, 12, 0.3)', // orange-600 outer glow
            width: 16
          })
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.8)', // white inner
            width: 8
          })
        }),
        new Style({
          stroke: new Stroke({
            color: '#ea580c', // orange-600 solid
            width: 4,
            lineDash: [10, 10]
          })
        })
      ]
    });

    popupOverlay.current = new Overlay({
      element: popupRef.current,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -20]
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [basemaps[baseMap], pathLayer.current, vectorLayer.current],
      view: new View({
        center: fromLonLat([78.6569, 11.1271]), // Center of Tamil Nadu roughly
        zoom: 7,
        maxZoom: 19
      }),
      overlays: [popupOverlay.current],
      controls: [
        new Zoom(),
        new ScaleLine(),
        new FullScreen()
      ]
    });

    // Click handler
    mapInstance.current.on('click', (evt) => {
      const feature = mapInstance.current?.forEachFeatureAtPixel(
        evt.pixel, 
        (feat) => feat,
        { hitTolerance: 10 }
      );
      
      if (feature) {
        const temple = feature.get('templeData');
        if (temple) {
          const coords = (feature.getGeometry() as Point).getCoordinates();
          setPopupData(temple);
          setSelectedTemple(temple);
          popupOverlay.current?.setPosition(coords);
        }
      } else {
        setPopupData(null);
        setSelectedTemple(null);
        popupOverlay.current?.setPosition(undefined);
      }
    });
    
    // Hover handler
    mapInstance.current.on('pointermove', (evt) => {
      if (evt.dragging) return;
      const pixel = mapInstance.current?.getEventPixel(evt.originalEvent);
      const hit = pixel ? mapInstance.current?.hasFeatureAtPixel(pixel, { hitTolerance: 10 }) : false;
      if (mapRef.current) {
        mapRef.current.style.cursor = hit ? 'pointer' : '';
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
      }
    };
  }, []); // Run once

  // Update Features
  useEffect(() => {
    if (!vectorSource.current) return;
    vectorSource.current.clear();
    
    const features = temples.map(t => {
      const feat = new Feature({
        geometry: new Point(fromLonLat(t.geometry.coordinates)),
        templeData: t
      });
      return feat;
    });
    
    vectorSource.current.addFeatures(features);
  }, [temples]);

  // Handle Basemap change
  useEffect(() => {
    if (mapInstance.current) {
      const layers = mapInstance.current.getLayers().getArray();
      // Keep vector layer, remove old basemap, add new basemap at index 0
      if (layers.length > 0) {
        mapInstance.current.removeLayer(layers[0]);
      }
      mapInstance.current.getLayers().insertAt(0, basemaps[baseMap]);
    }
  }, [baseMap]);

  // Handle selectedTemple and mapCenter from sidebar
  useEffect(() => {
    if (mapCenter && mapInstance.current && selectedTemple) {
      const coord = fromLonLat(mapCenter);
      const currentCenter = mapInstance.current.getView().getCenter();
      
      let duration = 5000; // Slower bird-eye train movement

      if (currentCenter && pathSource.current) {
        pathSource.current.clear();
        
        // Only draw path if we are already zoomed in somewhere else or if we have a previous location
        const distance = Math.sqrt(
          Math.pow(currentCenter[0] - coord[0], 2) + Math.pow(currentCenter[1] - coord[1], 2)
        );
        
        if (distance > 1000) { // arbitrary small threshold to avoid drawing line when just clicking nearby
          const line = new LineString([currentCenter, currentCenter]);
          const feature = new Feature({ geometry: line });
          pathSource.current.addFeature(feature);
          
          const dx = coord[0] - currentCenter[0];
          const dy = coord[1] - currentCenter[1];
          const rotation = Math.atan2(dx, dy);

          const markerFeature = new Feature({ geometry: new Point(currentCenter) });
          markerFeature.setStyle([
            new Style({
              image: new RegularShape({
                points: 3,
                radius: 12,
                rotation: rotation,
                fill: new Fill({ color: '#ea580c' }), // orange-600
                stroke: new Stroke({ color: '#ffffff', width: 2 })
              })
            })
          ]);
          pathSource.current.addFeature(markerFeature);
          
          const realDistanceMeters = getDistance(toLonLat(currentCenter), toLonLat(coord));
          
          // Make duration dynamic based on distance, but keep it within 3-8 seconds
          duration = Math.max(3000, Math.min(8000, (realDistanceMeters / 1000) * 100));
            
          const startZoom = mapInstance.current.getView().getZoom() || 15;
          const targetZoom = 15;
          
          // Calculate peak zoom out to fit both start and end points
          let peakZoomOut = 8;
          if (mapInstance.current) {
            const extent = boundingExtent([currentCenter, coord]);
            const size = mapInstance.current.getSize();
            if (size) {
              const resolution = mapInstance.current.getView().getResolutionForExtent(extent, size);
              let calculatedZoom = mapInstance.current.getView().getZoomForResolution(resolution) || 8;
              calculatedZoom -= 1; // padding
              
              // Ensure we actually zoom out, not in
              peakZoomOut = Math.min(calculatedZoom, Math.min(startZoom, targetZoom) - 0.5);
              peakZoomOut = Math.max(3, peakZoomOut); // Don't zoom out further than level 3
            }
          }
          
          const start = Date.now();
          const animatePath = () => {
            const elapsed = Date.now() - start;
            let fraction = elapsed / duration;
            if (fraction > 1) fraction = 1;
            
            const easedFraction = easeOut(fraction);
            
            const currentX = currentCenter[0] + (coord[0] - currentCenter[0]) * easedFraction;
            const currentY = currentCenter[1] + (coord[1] - currentCenter[1]) * easedFraction;
            
            line.setCoordinates([currentCenter, [currentX, currentY]]);
            markerFeature.setGeometry(new Point([currentX, currentY]));
            
            if (mapInstance.current) {
              mapInstance.current.getView().setCenter([currentX, currentY]);
              
              // Parabolic zoom effect: zoom out in the middle of the journey
              const zoomPhase = Math.sin(fraction * Math.PI); // 0 at start, 1 at middle, 0 at end
              const baseZoom = startZoom + (targetZoom - startZoom) * easedFraction;
              const currentZoom = baseZoom - zoomPhase * (Math.max(startZoom, targetZoom) - peakZoomOut);
              
              mapInstance.current.getView().setZoom(currentZoom);
            }
            
            if (fraction < 1) {
              requestAnimationFrame(animatePath);
            }
          };
          animatePath();
        }
      }

      setPopupData(selectedTemple);
      popupOverlay.current?.setPosition(coord);
    } else if (!selectedTemple) {
      setPopupData(null);
      popupOverlay.current?.setPosition(undefined);
      if (pathSource.current) pathSource.current.clear();
    }
  }, [mapCenter, selectedTemple]);
  
  // Custom My Location Control Action
  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
        mapInstance.current?.getView().animate({ center: coords, zoom: 14, duration: 800 });
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const closePopup = () => {
    setPopupData(null);
    popupOverlay.current?.setPosition(undefined);
    setSelectedTemple(null);
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full bg-slate-100" />
      
      {/* Custom Controls Container */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-auto">
        <button 
          onClick={handleMyLocation}
          className="bg-white p-3 rounded-lg shadow-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          title="My Location"
        >
          <Crosshair className="w-5 h-5 text-slate-700" />
        </button>


      </div>

      {/* Popup Overlay Container */}
      <div ref={popupRef} className="absolute -translate-x-1/2 bottom-0">
        {popupData && (
          <div className="!block bg-white/95 backdrop-blur rounded-lg shadow-xl border border-slate-200 p-4 w-72 mb-2 relative before:content-[''] before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:border-l-8 before:border-l-transparent before:border-r-8 before:border-r-transparent before:border-t-8 before:border-t-white before:drop-shadow-sm">
            <button 
              onClick={closePopup}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="pr-6">
              <h2 className="text-sm font-bold text-slate-800 leading-tight mb-1">{popupData.properties.Temple_Name}</h2>
              <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {popupData.properties.Locality}, {popupData.properties.District}
              </p>
              
              <div className="inline-block px-2 py-0.5 rounded bg-orange-100 text-[10px] font-bold text-orange-600 shadow-sm">
                Deity: {popupData.properties.Deity}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
