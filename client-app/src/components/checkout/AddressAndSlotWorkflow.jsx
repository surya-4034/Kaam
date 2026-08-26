import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Search,
  MapPin,
  LocateFixed,
  History,
  X,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3VyeWEwMDEiLCJhIjoiY210MXV5NHpiMGc3czJ5cjI0NTVwZXYwbiJ9.pJajjwb6MfjO_SsDaMRYDA';

export const AddressAndSlotWorkflow = ({
  isOpen,
  onClose,
  onComplete,
  defaultAddress = '',
  tradeTitle = 'Service'
}) => {
  // Navigation state between the steps:
  // 'SEARCH' | 'MAP_PINPOINT' | 'SLOT_PICKER'
  const [currentStep, setCurrentStep] = useState('SEARCH');

  // Step 1 & 2: Search & Live Real-World Mapbox Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Recents History
  const [recentSearches, setRecentSearches] = useState([
    {
      title: 'Prayagraj',
      subtitle: 'Uttar Pradesh, India',
      fullAddress: 'Prayagraj, Uttar Pradesh, India',
      lat: 25.4358,
      lng: 81.8463
    },
    {
      title: 'Bhopal',
      subtitle: 'Madhya Pradesh, India',
      fullAddress: 'Bhopal, Madhya Pradesh, India',
      lat: 23.2599,
      lng: 77.4126
    }
  ]);

  // Step 3: Selected Location & Map Coordinates State
  const [selectedLocation, setSelectedLocation] = useState({
    title: 'Prayagraj',
    subtitle: 'Uttar Pradesh, India',
    areaName: 'Prayagraj',
    fullAddress: 'Prayagraj, Uttar Pradesh, India',
    lat: 25.4358,
    lng: 81.8463
  });

  const [pinCoords, setPinCoords] = useState({ lat: 25.4358, lng: 81.8463 });
  const [houseNumber, setHouseNumber] = useState('');
  const [landmarkDetail, setLandmarkDetail] = useState('');
  const [saveAsType, setSaveAsType] = useState('Home'); // 'Home' | 'Other'

  // Mapbox Container Ref & Instance Ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Step 4: Slot Picker State
  const [selectedDate, setSelectedDate] = useState('Fri 21');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('08:30 AM');
  const [slotSurgeFee, setSlotSurgeFee] = useState(0);

  const DATES = [
    { day: 'Fri', date: '21', key: 'Fri 21' },
    { day: 'Sat', date: '22', key: 'Sat 22' },
    { day: 'Sun', date: '23', key: 'Sun 23' }
  ];

  const TIME_SLOTS = [
    { time: '07:00 AM', surge: 100 },
    { time: '07:30 AM', surge: 100 },
    { time: '08:00 AM', surge: 100 },
    { time: '08:30 AM', surge: 0 },
    { time: '09:00 AM', surge: 0 },
    { time: '09:30 AM', surge: 0 },
    { time: '10:00 AM', surge: 0 },
    { time: '10:30 AM', surge: 0 },
    { time: '11:00 AM', surge: 0 },
    { time: '11:30 AM', surge: 0 },
    { time: '12:00 PM', surge: 0 },
    { time: '12:30 PM', surge: 0 },
    { time: '01:00 PM', surge: 0 },
    { time: '01:30 PM', surge: 0 },
    { time: '02:00 PM', surge: 0 }
  ];

  // 1. Live Real-World Search via Mapbox Geocoding API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAutocompleteResults([]);
      setIsLoadingResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingResults(true);
      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery.trim()
        )}.json?country=in&language=en&types=country,region,postcode,district,place,locality,neighborhood,address,poi&access_token=${MAPBOX_TOKEN}`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (data && data.features) {
            const mapped = data.features.map((item) => {
              const [lng, lat] = item.center;
              const placeName = item.text || item.place_name.split(',')[0];
              const subtitle = item.place_name.replace(placeName + ',', '').trim() || item.place_name;

              return {
                id: item.id,
                title: placeName,
                subtitle: subtitle,
                areaName: placeName,
                fullAddress: item.place_name,
                lat: lat,
                lng: lng
              };
            });
            setAutocompleteResults(mapped);
          }
        }
      } catch (err) {
        console.warn('[Mapbox Autocomplete Error]', err);
      } finally {
        setIsLoadingResults(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Reverse Geocode helper (when user drags/clicks map pin)
  const reverseGeocode = async (lat, lng) => {
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?country=in&language=en&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          const topFeature = data.features[0];
          const mainTitle = topFeature.text || topFeature.place_name.split(',')[0];
          setSelectedLocation(prev => ({
            ...prev,
            title: mainTitle,
            areaName: mainTitle,
            fullAddress: topFeature.place_name,
            lat,
            lng
          }));
        }
      }
    } catch (err) {
      console.warn('[Mapbox Reverse Geocoding Error]', err);
    }
  };

  // Map Style state: 'satellite' | 'streets'
  const [mapStyle, setMapStyle] = useState('satellite');

  // 3. Initialize / Update Mapbox GL Map when entering MAP_PINPOINT step
  useEffect(() => {
    if (currentStep === 'MAP_PINPOINT' && mapContainerRef.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const styleUrl = mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12';

      // Create Map
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: [pinCoords.lng, pinCoords.lat],
        zoom: 16,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Add Zoom / Recenter controls
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

      // Update coordinates on map move/drag
      map.on('move', () => {
        const center = map.getCenter();
        setPinCoords({ lat: center.lat, lng: center.lng });
      });

      // On map drag end -> reverse geocode to update address name
      map.on('moveend', () => {
        const center = map.getCenter();
        reverseGeocode(center.lat, center.lng);
      });

      // On click anywhere on map -> pan to that point
      map.on('click', (e) => {
        map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], essential: true });
      });

      // Cleanup
      return () => {
        map.remove();
      };
    }
  }, [currentStep, mapStyle]);

  // Handle user selecting an address from autocomplete list
  const handleSelectLandmark = (item) => {
    setSelectedLocation(item);
    setPinCoords({ lat: item.lat, lng: item.lng });
    setCurrentStep('MAP_PINPOINT');

    // Add to recents
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.title !== item.title);
      return [
        {
          title: item.title,
          subtitle: item.subtitle,
          fullAddress: item.fullAddress,
          lat: item.lat,
          lng: item.lng
        },
        ...filtered
      ].slice(0, 4);
    });
  };

  // Handle GPS Current Location Button
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPinCoords({ lat, lng });

          // Reverse geocode to find address name
          reverseGeocode(lat, lng).then(() => {
            setCurrentStep('MAP_PINPOINT');
          });
        },
        (err) => {
          console.warn('Geolocation failed:', err);
          // Fallback to default
          setCurrentStep('MAP_PINPOINT');
        }
      );
    }
  };

  const handleSaveAddressAndProceedToSlots = (e) => {
    e.preventDefault();
    if (!houseNumber.trim()) return;
    setCurrentStep('SLOT_PICKER');
  };

  const handleFinalConfirm = () => {
    const formattedAddress = `${saveAsType} - ${houseNumber}${landmarkDetail ? `, near ${landmarkDetail}` : ''}, ${selectedLocation.fullAddress}`;
    
    onComplete({
      addressString: formattedAddress,
      areaName: selectedLocation.areaName,
      houseNumber,
      landmark: landmarkDetail,
      saveAs: saveAsType,
      coordinates: pinCoords,
      slot: `${selectedDate}, ${selectedTimeSlot}`,
      slotSurgeFee: slotSurgeFee
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      
      {/* ======================================================== */}
      {/* STEP 1 & 2: SEARCH & REAL-WORLD AUTOCOMPLETE MODAL       */}
      {/* ======================================================== */}
      {currentStep === 'SEARCH' && (
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 relative animate-in zoom-in-95 font-['Plus_Jakarta_Sans',sans-serif]">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200 grid place-items-center font-bold text-sm transition active:scale-95 z-10"
          >
            ✕
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your location/society/apartment"
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5932ea] focus:bg-white transition"
            />
            {isLoadingResults ? (
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin absolute right-3.5 top-3.5" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 grid place-items-center absolute right-3.5 top-3.5 text-[10px] font-bold"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Use Current Location CTA */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-2.5 py-1 text-xs font-black text-[#5932ea] hover:text-[#4927cb] transition active:scale-95"
          >
            <LocateFixed className="w-4 h-4 text-[#5932ea]" />
            <span>Use current location</span>
          </button>

          {/* AUTOCOMPLETE RESULTS (Real-World Live Mapbox Data) */}
          {searchQuery.trim() ? (
            <div className="space-y-1 max-h-80 overflow-y-auto divide-y divide-slate-100 pt-1">
              {autocompleteResults.length > 0 ? (
                autocompleteResults.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => handleSelectLandmark(item)}
                    className="flex items-start gap-3.5 py-3.5 px-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition select-none group"
                  >
                    <div className="pt-0.5 text-slate-400 group-hover:text-[#5932ea] transition shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-[#5932ea] transition">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))
              ) : !isLoadingResults ? (
                <div className="p-4 text-center text-xs text-slate-500 font-medium">
                  No matching locations found for "{searchQuery}". Try searching city, colony, or landmark.
                </div>
              ) : null}
            </div>
          ) : (
            /* RECENTS LIST */
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Recents</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {recentSearches.map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLandmark(rec)}
                    className="flex items-start gap-3.5 py-3 px-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition select-none group"
                  >
                    <div className="pt-0.5 text-slate-400 group-hover:text-purple-600">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-950">
                        {rec.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {rec.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Powered by Mapbox Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <span>powered by</span>
            <span className="font-bold text-slate-700 font-sans tracking-tight">Mapbox</span>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: REAL INTERACTIVE PINPOINT MAP & DOORSTEP FORM    */}
      {/* ======================================================== */}
      {currentStep === 'MAP_PINPOINT' && (
        <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 grid grid-cols-1 md:grid-cols-12 font-['Plus_Jakarta_Sans',sans-serif] max-h-[92vh]">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200 grid place-items-center font-bold text-sm transition active:scale-95 z-30"
          >
            ✕
          </button>

          {/* LEFT PANE: LIVE REAL MAPBOX MAP CANVAS (FIXED CENTER PIN) */}
          <div className="md:col-span-6 bg-slate-100 relative min-h-[340px] md:min-h-[540px] overflow-hidden select-none border-b md:border-b-0 md:border-r border-slate-200">
            
            {/* Real Mapbox GL Canvas Container */}
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {/* Exactly Centered Pinpoint Marker & Floating Tooltip (Absolute Center) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="flex flex-col items-center transform -translate-y-7">
                
                {/* Dark floating tooltip */}
                <div className="bg-[#1e293b] text-white px-3.5 py-1.5 rounded-xl text-[11px] font-bold shadow-2xl mb-1 text-center whitespace-nowrap animate-bounce">
                  Place the pin accurately on map
                </div>

                {/* Pinpoint Blue Dot */}
                <div className="w-8 h-8 rounded-full bg-[#5932ea] text-white border-2 border-white shadow-2xl grid place-items-center font-black">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                </div>

                {/* Pin stem & shadow */}
                <div className="w-0.5 h-4 bg-[#5932ea] shadow-md"></div>
                <div className="w-4 h-1.5 bg-black/30 rounded-full blur-[1px]"></div>
              </div>
            </div>

            {/* Map Mode Toggle: Satellite vs Streets (Top-Left) */}
            <div className="absolute top-4 left-4 z-30 flex items-center bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200 text-[11px] font-black">
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  mapStyle === 'satellite'
                    ? 'bg-[#5932ea] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('streets')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  mapStyle === 'streets'
                    ? 'bg-[#5932ea] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                🗺️ Streets
              </button>
            </div>

            {/* Target GPS Recenter Button */}
            <button
              onClick={() => {
                if (navigator.geolocation && mapInstanceRef.current) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 16 });
                    reverseGeocode(lat, lng);
                  });
                }
              }}
              title="Locate Me"
              className="absolute bottom-4 left-4 z-30 w-10 h-10 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 grid place-items-center hover:bg-slate-50 active:scale-95 transition"
            >
              <LocateFixed className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* RIGHT PANE: DOORSTEP DETAILS FORM */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6 bg-white">
            
            <div className="space-y-5">
              {/* Area Header with Change Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-['Outfit']">
                    {selectedLocation.areaName || selectedLocation.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                    {selectedLocation.fullAddress}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep('SEARCH')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-purple-600 text-[#5932ea] font-extrabold text-xs transition active:scale-95 shrink-0"
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleSaveAddressAndProceedToSlots} className="space-y-4 pt-2">
                
                {/* Input 1: House/Flat Number* */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    House/Flat Number*
                  </label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g. Flat 402, Abhilasha Park"
                    className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5932ea] bg-white transition"
                  />
                  {houseNumber && (
                    <button
                      type="button"
                      onClick={() => setHouseNumber('')}
                      className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 grid place-items-center absolute right-3.5 top-8 text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Input 2: Landmark (Optional) */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmarkDetail}
                    onChange={(e) => setLandmarkDetail(e.target.value)}
                    placeholder="e.g. Near SGT School, Opp. Metro Pillar"
                    className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5932ea] bg-white transition"
                  />
                  {landmarkDetail && (
                    <button
                      type="button"
                      onClick={() => setLandmarkDetail('')}
                      className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 grid place-items-center absolute right-3.5 top-8 text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Save As Pill Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-slate-500">
                    Save as
                  </label>
                  <div className="flex gap-2">
                    {['Home', 'Other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSaveAsType(type)}
                        className={`px-5 py-2 rounded-xl text-xs font-black border transition-all ${
                          saveAsType === type
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action (Save Address & Proceed to Slots) */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-[#5932ea] hover:bg-[#4927cb] text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Save Address & Proceed to Slots</span>
                    <span>➔</span>
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: DATE & TIME SLOT PICKER MODAL                    */}
      {/* ======================================================== */}
      {currentStep === 'SLOT_PICKER' && (
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative animate-in zoom-in-95 font-['Plus_Jakarta_Sans',sans-serif]">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200 grid place-items-center font-bold text-sm transition active:scale-95 z-10"
          >
            ✕
          </button>

          {/* Header */}
          <div>
            <h2 className="text-xl font-black text-slate-900 font-['Outfit'] tracking-tight">
              When should the professional arrive?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Service will take approx. 1 hr & 15 mins
            </p>
          </div>

          {/* Date Selector Cards */}
          <div className="flex gap-2.5">
            {DATES.map(item => {
              const isSelected = selectedDate === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedDate(item.key)}
                  className={`flex-1 py-3 px-2 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-[#5932ea] bg-purple-50/70 text-purple-950 font-black ring-2 ring-purple-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-500">{item.day}</span>
                  <span className="text-base font-black font-['Outfit']">{item.date}</span>
                </button>
              );
            })}
          </div>

          {/* Time Slot Header */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Select start time of service
            </h3>
          </div>

          {/* 3-Column Time Slot Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs max-h-64 overflow-y-auto pr-1">
            {TIME_SLOTS.map((slot, sIdx) => {
              const isSelected = selectedTimeSlot === slot.time;
              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    setSelectedTimeSlot(slot.time);
                    setSlotSurgeFee(slot.surge);
                  }}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition flex flex-col items-center justify-center relative ${
                    isSelected
                      ? 'border-[#5932ea] bg-[#5932ea] text-white font-black shadow-md shadow-purple-600/20'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold'
                  }`}
                >
                  {slot.surge > 0 && (
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full mb-0.5 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      + ₹{slot.surge}
                    </span>
                  )}
                  <span>{slot.time}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Proceed to Checkout CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleFinalConfirm}
              className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-[#5932ea] hover:text-white text-slate-900 font-black text-xs transition-all active:scale-95 shadow-sm"
            >
              Proceed to checkout
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
