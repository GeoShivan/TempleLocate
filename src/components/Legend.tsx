import { cn } from '../lib/utils';

export const deityColors: Record<string, string> = {
  'Shiva': '#f97316',     // orange-500
  'Vishnu': '#3b82f6',    // blue-500
  'Murugan': '#22c55e',   // green-500
  'Amman': '#a855f7',     // purple-500
  'Vinayagar': '#eab308', // yellow-500
  'Hanuman': '#ec4899',   // pink-500
  'Other': '#64748b'      // slate-500
};

export function getDeityColor(deity: string): string {
  return deityColors[deity] || deityColors['Other'];
}

export default function Legend() {
  return (
    <div className="absolute bottom-6 right-6 z-10 pointer-events-auto hidden md:block">
      <div className="bg-white/90 backdrop-blur rounded-lg border border-slate-200 p-3 shadow-lg flex items-center gap-4 text-[10px] font-medium flex-wrap max-w-xl">
        {Object.entries(deityColors).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill={color} stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
              <path d="M12 2L8 6H16L12 2Z" />
              <path d="M6 6H18V10H6V6Z" />
              <path d="M4 10H20V14H4V10Z" />
              <path d="M2 14H22V22H2V14Z" />
              <path d="M10 16H14V22H10V16Z" fill="white"/>
            </svg>
            <span className="text-slate-700">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
