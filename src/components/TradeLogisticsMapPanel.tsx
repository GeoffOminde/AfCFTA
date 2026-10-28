import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  ExternalLink, 
  Navigation, 
  Building2, 
  Truck, 
  Ship, 
  Plane, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { MapsGroundingResult, MapsGroundingPlace } from '../types';

interface TradeLogisticsMapPanelProps {
  defaultCountry?: string;
  defaultCorridor?: string;
  onApplyContextToAudit?: () => void;
}

const CORRIDOR_PRESETS = [
  {
    id: "nairobi_hubs",
    name: "Nairobi Customs & Testing Hubs",
    icon: Building2,
    query: "KRA Times Tower Forodha House, KEPHIS Karen plant inspection headquarters, and JKIA Cargo Village in Nairobi Kenya",
    latLng: { latitude: -1.2921, longitude: 36.8219 }
  },
  {
    id: "northern_corridor",
    name: "Northern Corridor (Uganda / Rwanda)",
    icon: Truck,
    query: "Malaba One-Stop Border Post, Busia One-Stop Border Post, and Inland Container Depot Naivasha on the Northern Corridor",
    latLng: { latitude: 0.6344, longitude: 34.2750 } // Malaba border coords
  },
  {
    id: "mombasa_maritime",
    name: "Mombasa Port & Maritime Customs",
    icon: Ship,
    query: "Port of Mombasa Kilindini Harbor container terminal, KRA Customs Maritime center, and KEPHIS Mombasa port testing lab",
    latLng: { latitude: -4.0547, longitude: 39.6636 } // Mombasa port coords
  },
  {
    id: "southern_corridor",
    name: "Southern Corridor (Tanzania)",
    icon: Truck,
    query: "Namanga One-Stop Border Post, Taveta Holili One-Stop Border Post, and KRA customs border clearance stations",
    latLng: { latitude: -2.5511, longitude: 36.7889 } // Namanga coords
  },
  {
    id: "airfreight_gateways",
    name: "Air Cargo & Perishable Cold Chain",
    icon: Plane,
    query: "Jomo Kenyatta International Airport JKIA Cargo Village, Swissport air cargo terminal, Siginon freight center Nairobi",
    latLng: { latitude: -1.3192, longitude: 36.9275 } // JKIA coords
  }
];

export const TradeLogisticsMapPanel: React.FC<TradeLogisticsMapPanelProps> = ({
  defaultCountry = "NG",
  defaultCorridor,
  onApplyContextToAudit
}) => {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>("nairobi_hubs");
  const [query, setQuery] = useState<string>(
    "KRA Times Tower Forodha House, KEPHIS Karen plant inspection headquarters, and JKIA Cargo Village in Nairobi Kenya"
  );
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MapsGroundingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchStations = async (customQuery?: string, latLngOverride?: { latitude: number; longitude: number }) => {
    const q = customQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);

    const activePreset = CORRIDOR_PRESETS.find(p => p.id === selectedCorridorId);
    const coords = latLngOverride || userLocation || activePreset?.latLng || { latitude: -1.2921, longitude: 36.8219 };

    try {
      const response = await fetch("/api/locate-trade-stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          corridor: activePreset?.name || "Kenya Export Infrastructure",
          location: "Kenya",
          latLng: coords
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data: MapsGroundingResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Maps Grounding failed:", err);
      setError(err.message || "Failed to retrieve map grounded trade locations.");
    } finally {
      setIsLoading(false);
    }
  };

  // Request browser geolocation to ground relative to exporter's actual GPS position
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your current browser.");
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        setUserLocation(coords);
        setIsLocatingUser(false);
        const geoQuery = `Nearest KRA customs house, export clearance station, and KEPHIS plant health testing center to my coordinates (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
        setQuery(geoQuery);
        handleFetchStations(geoQuery, coords);
      },
      (err) => {
        console.warn("Geolocation permission or error:", err);
        setIsLocatingUser(false);
        alert("Could not access device location. Using default Kenya trade coordinates.");
        handleFetchStations();
      },
      { timeout: 10000 }
    );
  };

  const handleSelectCorridor = (preset: typeof CORRIDOR_PRESETS[0]) => {
    setSelectedCorridorId(preset.id);
    setQuery(preset.query);
    handleFetchStations(preset.query, preset.latLng);
  };

  useEffect(() => {
    handleFetchStations();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xxs font-mono uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                Google Maps Grounding Engine
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full border border-slate-200">
                Model: gemini-3.8-flash (googleMaps)
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-display mt-1">
              Customs Stations, OSBPs & Physical Inspection Locator
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Locate physical trade infrastructure across East African transit corridors—including KRA Customs Houses, KEPHIS phytosanitary inspection labs, dry ports, and One-Stop Border Posts—with verified Google Maps place links.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUseMyLocation}
              disabled={isLocatingUser || isLoading}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
              <span>{isLocatingUser ? "Locating..." : userLocation ? "GPS Active" : "Use My GPS"}</span>
            </button>
          </div>
        </div>

        {/* Corridor Presets Bar */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {CORRIDOR_PRESETS.map((corridor) => {
            const Icon = corridor.icon;
            const isSelected = selectedCorridorId === corridor.id;
            return (
              <button
                key={corridor.id}
                onClick={() => handleSelectCorridor(corridor)}
                className={`text-xs px-3.5 py-2 rounded-lg border font-medium flex items-center gap-2 whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border-slate-200"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{corridor.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchStations()}
              placeholder="e.g. Find KRA customs offices and container terminals near Nairobi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
            />
          </div>

          <button
            onClick={() => handleFetchStations()}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 text-xs active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Locating Facilities...</span>
              </>
            ) : (
              <>
                <Compass className="h-4 w-4" />
                <span>Explore Stations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-900 text-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Location query error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Grounded Places Cards (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" /> Verified Trade Locations & Google Maps Links ({result.places.length})
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-semibold">
                Google Maps Grounded
              </span>
            </div>

            {result.places.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                No physical places were matched for this query. Try choosing one of the corridor presets above.
              </div>
            ) : (
              <div className="space-y-3">
                {result.places.map((place, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs transition-all hover:shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xxs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 font-display">
                            {place.title}
                          </h4>
                        </div>
                        {place.address && (
                          <p className="text-xxs text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{place.address}</span>
                          </p>
                        )}
                      </div>

                      {/* Prominent Google Maps clickable link as required by the Skill */}
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 active:scale-95 cursor-pointer"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Facility Snippets / Review Notes */}
                    {place.snippets && place.snippets.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                          Facility Operational Notes:
                        </span>
                        {place.snippets.map((snip, sIdx) => (
                          <div key={sIdx} className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-150 leading-relaxed italic">
                            "{snip}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Route Analysis & Inspection Advice (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="border-b border-slate-150 pb-3 mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Compass className="h-4 w-4 text-emerald-600" /> Freight Logistics Guidance
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Corridor Protocol</span>
              </div>

              <div className="text-slate-700 text-xs leading-relaxed space-y-2 whitespace-pre-line bg-emerald-50/20 border border-emerald-500/10 rounded-lg p-4 font-sans">
                {result.text}
              </div>

              {/* Standard clearance workflow strip */}
              <div className="mt-4 pt-3 border-t border-slate-150 text-xxs text-slate-500 space-y-1.5">
                <span className="font-bold uppercase tracking-wider text-slate-400 block">Export Sequence:</span>
                <p>1. <strong>KEPHIS Certification:</strong> Sample inspection at laboratory.</p>
                <p>2. <strong>KRA Customs House:</strong> Electronic entry lodgement & origin endorsement.</p>
                <p>3. <strong>Container Depot / OSBP:</strong> Physical seal verification at border transit.</p>
              </div>
            </div>

            {/* Quick action card: Return to Audit */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-display">
                  Ready to Lodge Documents?
                </h4>
              </div>
              <p className="text-xxs leading-relaxed text-slate-300">
                Ensure your Bill of Materials ledger has been certified to meet the minimum Domestic Value Added threshold (≥30-40%) before arriving at KRA or border customs.
              </p>
              {onApplyContextToAudit && (
                <button
                  onClick={onApplyContextToAudit}
                  className="mt-3.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <span>Review Rules of Origin Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
