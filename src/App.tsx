/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { TempleFeature, TempleFeatureCollection, BaseMapType } from './types';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import Legend from './components/Legend';
import { Map, MapPin, Navigation, Map as MapIcon, Layers } from 'lucide-react';

export default function App() {
  const [temples, setTemples] = useState<TempleFeature[]>([]);
  const [filteredTemples, setFilteredTemples] = useState<TempleFeature[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  
  // Map State
  const [baseMap, setBaseMap] = useState<BaseMapType>('google');
  const [selectedTemple, setSelectedTemple] = useState<TempleFeature | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch('/data/temples.geojson')
      .then(res => res.json())
      .then((data: TempleFeatureCollection) => {
        setTemples(data.features);
        setFilteredTemples(data.features);
      })
      .catch(err => console.error('Error loading geojson:', err));
  }, []);

  useEffect(() => {
    let result = temples;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.properties.Temple_Name.toLowerCase().includes(q) ||
        t.properties.Locality.toLowerCase().includes(q) ||
        t.properties.District.toLowerCase().includes(q) ||
        t.properties.Deity.toLowerCase().includes(q)
      );
    }
    
    if (selectedDistrict) {
      result = result.filter(t => t.properties.District === selectedDistrict);
    }
    
    if (selectedLocality) {
      result = result.filter(t => t.properties.Locality === selectedLocality);
    }
    
    setFilteredTemples(result);
  }, [searchQuery, selectedDistrict, selectedLocality, temples]);

  const handleSelectTemple = useCallback((temple: TempleFeature | null) => {
    setSelectedTemple(temple);
    if (temple) {
      setMapCenter(temple.geometry.coordinates);
    }
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Sidebar Overlay on mobile, persistent on desktop */}
      <Sidebar
        temples={temples}
        filteredTemples={filteredTemples}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        selectedLocality={selectedLocality}
        setSelectedLocality={setSelectedLocality}
        onSelectResult={handleSelectTemple}
        filteredCount={filteredTemples.length}
      />
      
      {/* Main Map Area */}
      <div className="flex-1 relative">
        <MapComponent 
          temples={filteredTemples} 
          baseMap={baseMap}
          setBaseMap={setBaseMap}
          selectedTemple={selectedTemple}
          setSelectedTemple={setSelectedTemple}
          mapCenter={mapCenter}
        />
        
        {/* Floating Components */}
        <Legend />
      </div>
    </div>
  );
}

