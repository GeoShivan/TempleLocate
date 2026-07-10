import { useMemo } from 'react';
import { TempleFeature } from '../types';
import { Search, X, Filter } from 'lucide-react';

interface SidebarProps {
  temples: TempleFeature[];
  filteredTemples: TempleFeature[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  selectedLocality: string;
  setSelectedLocality: (l: string) => void;
  onSelectResult: (temple: TempleFeature | null) => void;
  filteredCount: number;
}

export default function Sidebar({
  temples,
  filteredTemples,
  searchQuery,
  setSearchQuery,
  selectedDistrict,
  setSelectedDistrict,
  selectedLocality,
  setSelectedLocality,
  onSelectResult,
  filteredCount
}: SidebarProps) {
  
  const districts = useMemo(() => Array.from(new Set(temples.map(t => t.properties.District))).sort(), [temples]);
  
  const localities = useMemo(() => {
    let filtered = temples;
    if (selectedDistrict) filtered = filtered.filter(t => t.properties.District === selectedDistrict);
    return Array.from(new Set(filtered.map(t => t.properties.Locality))).sort();
  }, [temples, selectedDistrict]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSelectedLocality('');
    onSelectResult(null);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden absolute bottom-4 left-4 z-50 bg-orange-600 text-white p-3 rounded-full shadow-lg shadow-orange-200"
        onClick={() => {
          const sidebar = document.getElementById('sidebar');
          if (sidebar) sidebar.classList.toggle('-translate-x-full');
        }}
      >
        <Filter className="w-5 h-5" />
      </button>

      <div 
        id="sidebar"
        className="absolute md:relative z-40 w-80 h-full bg-white border-r border-slate-200 shadow-lg flex flex-col transition-transform duration-300 -translate-x-full md:translate-x-0"
      >
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
              <span className="text-white text-xl">🛕</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Temple Locator</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Explore divine destinations</p>
            </div>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-slate-600"
            onClick={() => {
              const sidebar = document.getElementById('sidebar');
              if (sidebar) sidebar.classList.add('-translate-x-full');
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search temples, deities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-orange-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-4 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <span>Location Filters</span>
            {(selectedDistrict || selectedLocality) && (
              <button onClick={clearFilters} className="text-orange-600 hover:text-orange-700 text-[10px] font-bold tracking-normal capitalize flex items-center">
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">District</label>
              <select 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Locality</label>
              <select 
                value={selectedLocality} 
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                disabled={!selectedDistrict && localities.length > 100}
              >
                <option value="">All Localities</option>
                {localities.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        {(searchQuery || selectedDistrict || selectedLocality) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {searchQuery ? 'Search Results' : 'Temples'} ({filteredCount})
            </h3>
            {filteredTemples.slice(0, 50).map((t, i) => (
              <div 
                key={i} 
                className="p-3 bg-white border border-slate-100 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-colors shadow-sm"
                onClick={() => onSelectResult(t)}
              >
                <div className="font-semibold text-slate-800 text-sm">{t.properties.Temple_Name}</div>
                <div className="text-xs text-slate-500 mt-1">{t.properties.Locality}, {t.properties.District}</div>
              </div>
            ))}
            {filteredTemples.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">No temples found</div>
            )}
          </div>
        )}
      </div>
      
    </div>
    </>
  );
}

function MapIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  )
}
