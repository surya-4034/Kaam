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
  Loader2,
  AlertCircle
} from 'lucide-react';
import { isMumbaiLocation } from '../../services/locationService';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3VyeWEwMDEiLCJhIjoiY210MXV5NHpiMGc3czJ5cjI0NTVwZXYwbiJ9.pJajjwb6MfjO_SsDaMRYDA';

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

  // Recents History (Defaulted to verified Mumbai Locations)
  const [recentSearches, setRecentSearches] = useState([
    {
      title: 'Andheri West',
      subtitle: 'Mumbai, Maharashtra, India',
      fullAddress: 'Andheri West, Mumbai, Maharashtra 400058, India',
      lat: 19.1363,
      lng: 72.8277
    },
    {
      title: 'Bandra West',
      subtitle: 'Mumbai, Maharashtra, India',
      fullAddress: 'Bandra West, Mumbai, Maharashtra 400050, India',
      lat: 19.0596,
      lng: 72.8295
    },
    {
      title: 'Powai',
      subtitle: 'Mumbai, Maharashtra, India',
      fullAddress: 'Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076, India',
      lat: 19.1176,
      lng: 72.9060
    }
  ]);

  // Step 3: Selected Location & Map Coordinates State (Defaulted to Mumbai)
  const [selectedLocation, setSelectedLocation] = useState({
    title: 'Andheri West',
    subtitle: 'Mumbai, Maharashtra, India',
    areaName: 'Andheri West',
    fullAddress: 'Andheri West, Mumbai, Maharashtra 400058, India',
    lat: 19.1363,
    lng: 72.8277
  });

  const [pinCoords, setPinCoords] = useState({ lat: 19.1363, lng: 72.8277 });
  const [houseNumber, setHouseNumber] = useState('');
  const [landmarkDetail, setLandmarkDetail] = useState('');
  const [saveAsType, setSaveAsType] = useState('Home'); // 'Home' | 'Other'

  // Boundary verification for current map pinpoint
  const pinLocationCheck = isMumbaiLocation(selectedLocation.fullAddress || selectedLocation.title, pinCoords);
  const isPinInMumbai = pinLocationCheck.isAvailable;

  // Mapbox Container Ref & Instance Ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Step 4: Real Dynamic Dates & Timing Slot Picker State
  const dynamicDates = React.useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const key = `${dayShort} ${dateNum}`;
      list.push({
        day: dayShort,
        date: String(dateNum),
        month: monthShort,
        key: key,
        isToday: i === 0,
        fullLabel: `${dayShort}, ${dateNum} ${monthShort}`
      });
    }
    return list;
  }, []);

  const ALL_TIME_SLOTS = [
    { time: '07:00 AM', hour24: 7, minute: 0, surge: 100 },
    { time: '07:30 AM', hour24: 7, minute: 30, surge: 100 },
    { time: '08:00 AM', hour24: 8, minute: 0, surge: 100 },
    { time: '08:30 AM', hour24: 8, minute: 30, surge: 0 },
    { time: '09:00 AM', hour24: 9, minute: 0, surge: 0 },
    { time: '09:30 AM', hour24: 9, minute: 30, surge: 0 },
    { time: '10:00 AM', hour24: 10, minute: 0, surge: 0 },
    { time: '10:30 AM', hour24: 10, minute: 30, surge: 0 },
    { time: '11:00 AM', hour24: 11, minute: 0, surge: 0 },
    { time: '11:30 AM', hour24: 11, minute: 30, surge: 0 },
    { time: '12:00 PM', hour24: 12, minute: 0, surge: 0 },
    { time: '12:30 PM', hour24: 12, minute: 30, surge: 0 },
    { time: '01:00 PM', hour24: 13, minute: 0, surge: 0 },
    { time: '01:30 PM', hour24: 13, minute: 30, surge: 0 },
    { time: '02:00 PM', hour24: 14, minute: 0, surge: 0 },
    { time: '02:30 PM', hour24: 14, minute: 30, surge: 0 },
    { time: '03:00 PM', hour24: 15, minute: 0, surge: 0 },
    { time: '03:30 PM', hour24: 15, minute: 30, surge: 0 },
    { time: '04:00 PM', hour24: 16, minute: 0, surge: 0 },
    { time: '04:30 PM', hour24: 16, minute: 30, surge: 0 },
    { time: '05:00 PM', hour24: 17, minute: 0, surge: 0 },
    { time: '05:30 PM', hour24: 17, minute: 30, surge: 0 },
    { time: '06:00 PM', hour24: 18, minute: 0, surge: 0 },
    { time: '06:30 PM', hour24: 18, minute: 30, surge: 0 },
    { time: '07:00 PM', hour24: 19, minute: 0, surge: 0 },
    { time: '07:30 PM', hour24: 19, minute: 30, surge: 0 },
    { time: '08:00 PM', hour24: 20, minute: 0, surge: 0 },
    { time: '08:30 PM', hour24: 20, minute: 30, surge: 0 }
  ];

  // Helper: check if a time slot is under 30 minutes from current time
  const isSlotUnder30Min = (slotObj, isToday) => {
    if (!isToday) return false;
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + 30 * 60 * 1000);
    const slotDate = new Date(now);
    slotDate.setHours(slotObj.hour24, slotObj.minute, 0, 0);
    return slotDate.getTime() < minAllowedTime.getTime();
  };

  const [selectedDate, setSelectedDate] = useState(() => dynamicDates[0]?.key || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [slotSurgeFee, setSlotSurgeFee] = useState(0);
  const [slotErrorMsg, setSlotErrorMsg] = useState('');

  // Auto-select initial valid slot on mount or date change
  useEffect(() => {
    const isToday = dynamicDates.find(d => d.key === selectedDate)?.isToday;
    const firstValid = ALL_TIME_SLOTS.find(s => !isSlotUnder30Min(s, isToday));
    if (firstValid) {
      setSelectedTimeSlot(firstValid.time);
      setSlotSurgeFee(firstValid.surge);
    } else if (isToday && dynamicDates.length > 1) {
      // If all slots today have already passed, auto-switch to tomorrow
      setSelectedDate(dynamicDates[1].key);
      setSelectedTimeSlot(ALL_TIME_SLOTS[0].time);
      setSlotSurgeFee(ALL_TIME_SLOTS[0].surge);
    }
  }, [selectedDate, dynamicDates]);

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
    if (!isPinInMumbai) {
      alert('Service was unavailable at this place, sorry for inconvenience!');
      return;
    }
    setCurrentStep('SLOT_PICKER');
  };

  const handleFinalConfirm = () => {
    const isToday = dynamicDates.find(d => d.key === selectedDate)?.isToday;
    const slotObj = ALL_TIME_SLOTS.find(s => s.time === selectedTimeSlot);
    if (!selectedTimeSlot || (slotObj && isSlotUnder30Min(slotObj, isToday))) {
      setSlotErrorMsg("Please choose 30 min after of current time");
      return;
    }

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
              placeholder="Search for Mumbai locality / society / landmark"
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
            <span>Use current location (Mumbai)</span>
          </button>

          {/* AUTOCOMPLETE RESULTS (Real-World Live Mapbox Data) */}
          {searchQuery.trim() ? (
            <div className="space-y-1 max-h-80 overflow-y-auto divide-y divide-slate-100 pt-1">
              {autocompleteResults.length > 0 ? (
                autocompleteResults.map((item, idx) => {
                  const itemInMumbai = isMumbaiLocation(item.fullAddress, { lat: item.lat, lng: item.lng }).isAvailable;
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => handleSelectLandmark(item)}
                      className={`flex items-start gap-3.5 py-3.5 px-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition select-none group ${
                        !itemInMumbai ? 'bg-red-50/40 border border-red-100' : ''
                      }`}
                    >
                      <div className={`pt-0.5 ${itemInMumbai ? 'text-slate-400 group-hover:text-[#5932ea]' : 'text-red-500'} transition shrink-0`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-black ${itemInMumbai ? 'text-slate-900 group-hover:text-[#5932ea]' : 'text-red-950'} transition`}>
                            {item.title}
                          </h4>
                          {!itemInMumbai && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black shrink-0">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {item.subtitle}
                        </p>
                        {!itemInMumbai && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            Service was unavailable at this place, sorry for inconvenience!
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : !isLoadingResults ? (
                <div className="p-4 text-center text-xs text-slate-500 font-medium">
                  No matching locations found for "{searchQuery}". Try searching Mumbai localities (Andheri, Bandra, Powai, Dadar, etc.).
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
        <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 grid grid-cols-1 md:grid-cols-2 font-['Plus_Jakarta_Sans',sans-serif] max-h-[92vh] h-[600px]">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200 grid place-items-center font-bold text-sm transition active:scale-95 z-30"
          >
            ✕
          </button>

          {/* LEFT PANE (50%): SATELLITE MAP CANVAS */}
          <div className="relative w-full h-[280px] md:h-full bg-slate-100 overflow-hidden select-none border-b md:border-b-0 md:border-r border-slate-200">
            
            {/* Mapbox GL Canvas Container */}
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {/* Centered Pinpoint Marker & Floating Tooltip */}
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

          {/* RIGHT PANE (50%): DOORSTEP DETAILS FORM + STICKY BOTTOM BUTTON */}
          <div className="p-6 sm:p-7 flex flex-col justify-between overflow-y-auto bg-white h-full">
            
            <form onSubmit={handleSaveAddressAndProceedToSlots} className="space-y-4 flex flex-col justify-between h-full">
              
              <div className="space-y-4">
                {/* Area Header with Change Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 font-['Outfit']">
                      {selectedLocation.areaName || selectedLocation.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                      {selectedLocation.fullAddress}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('SEARCH')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-600 text-[#5932ea] font-extrabold text-xs transition active:scale-95 shrink-0"
                  >
                    Change
                  </button>
                </div>

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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5932ea] bg-white transition"
                  />
                  {houseNumber && (
                    <button
                      type="button"
                      onClick={() => setHouseNumber('')}
                      className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 grid place-items-center absolute right-3 top-8 text-[9px] font-bold"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5932ea] bg-white transition"
                  />
                  {landmarkDetail && (
                    <button
                      type="button"
                      onClick={() => setLandmarkDetail('')}
                      className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 grid place-items-center absolute right-3 top-8 text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Save As Pill Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500">
                    Save as
                  </label>
                  <div className="flex gap-2">
                    {['Home', 'Other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSaveAsType(type)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${
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

                {/* Outside Mumbai Service Unavailable Warning */}
                {!isPinInMumbai && (
                  <div className="p-3.5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
                    <span className="text-red-600 text-lg shrink-0">⚠️</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-red-950">
                        Service was unavailable at this place, sorry for inconvenience!
                      </p>
                      <p className="text-[11px] text-red-700 leading-tight">
                        Kaam home services currently operate exclusively within Mumbai and the Mumbai Metropolitan Region (MMR). Please select an address located in Mumbai.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Action (Always visible at bottom) */}
              <div className="pt-3 border-t border-slate-100 mt-auto">
                <button
                  type="submit"
                  disabled={!isPinInMumbai}
                  className={`w-full py-3.5 rounded-2xl text-white font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    isPinInMumbai 
                      ? 'bg-[#5932ea] hover:bg-[#4927cb] shadow-purple-600/30 cursor-pointer' 
                      : 'bg-red-600 hover:bg-red-700 opacity-90 cursor-not-allowed'
                  }`}
                >
                  {isPinInMumbai ? (
                    <>
                      <span>Save and proceed to slots</span>
                      <span>➔</span>
                    </>
                  ) : (
                    <span>Service was unavailable at this place, sorry for inconvenience!</span>
                  )}
                </button>
              </div>

            </form>

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
            {dynamicDates.map(item => {
              const isSelected = selectedDate === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedDate(item.key);
                    setSlotErrorMsg('');
                  }}
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
            {ALL_TIME_SLOTS.map((slot, sIdx) => {
              const isSelected = selectedTimeSlot === slot.time;
              const isToday = dynamicDates.find(d => d.key === selectedDate)?.isToday;
              const isUnder30 = isSlotUnder30Min(slot, isToday);

              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    if (isUnder30) {
                      setSlotErrorMsg('Please choose 30 min after of current time');
                      return;
                    }
                    setSlotErrorMsg('');
                    setSelectedTimeSlot(slot.time);
                    setSlotSurgeFee(slot.surge);
                  }}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition flex flex-col items-center justify-center relative ${
                    isUnder30
                      ? 'border-slate-100 bg-slate-50/70 text-slate-400 opacity-50 cursor-pointer hover:bg-rose-50/50 hover:border-rose-200'
                      : isSelected
                        ? 'border-[#5932ea] bg-[#5932ea] text-white font-black shadow-md shadow-purple-600/20'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold'
                  }`}
                >
                  {slot.surge > 0 && (
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full mb-0.5 ${
                      isSelected && !isUnder30 ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      + ₹{slot.surge}
                    </span>
                  )}
                  <span>{slot.time}</span>
                </button>
              );
            })}
          </div>

          {/* Error Message when user attempts slot under 30 minutes */}
          {slotErrorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{slotErrorMsg}</span>
            </div>
          )}

          {/* Bottom Proceed to Checkout CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleFinalConfirm}
              className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-[#5932ea] hover:text-white text-slate-900 font-black text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              Proceed to checkout
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
