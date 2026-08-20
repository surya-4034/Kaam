import React, { useState, useEffect, useRef } from 'react';
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
  Plus
} from 'lucide-react';

export const AddressAndSlotWorkflow = ({
  isOpen,
  onClose,
  onComplete,
  defaultAddress = '',
  tradeTitle = 'Service'
}) => {
  // Navigation state between the 4 steps:
  // 'SEARCH' | 'MAP_PINPOINT' | 'SLOT_PICKER'
  const [currentStep, setCurrentStep] = useState('SEARCH');

  // Step 1 & 2: Live Search & Landmark Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Live Recents fetched from backend / initial API
  const [recentSearches, setRecentSearches] = useState([
    {
      title: 'Bhopal',
      subtitle: 'Madhya Pradesh, India',
      fullAddress: 'Bhopal, Madhya Pradesh, 462001, India',
      lat: 23.2599,
      lng: 77.4126
    },
    {
      title: 'Mumbai Central',
      subtitle: 'Mumbai, Maharashtra, India',
      fullAddress: 'Mumbai Central, Mumbai, Maharashtra, 400008, India',
      lat: 18.9696,
      lng: 72.8193
    }
  ]);

  // Query Google Places Autocomplete API live as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAutocompleteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingResults(true);
      try {
        const res = await fetch(`http://localhost:5050/api/maps/autocomplete?input=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.predictions) {
            const mapped = data.predictions.map(p => ({
              id: p.place_id,
              title: p.structured_formatting?.main_text || p.description.split(',')[0],
              distance: p.distance || '1.2 km',
              subtitle: p.structured_formatting?.secondary_text || p.description,
              areaName: p.structured_formatting?.main_text || 'Local Area',
              fullAddress: p.description,
              lat: p.geometry?.location?.lat || 23.2655,
              lng: p.geometry?.location?.lng || 77.4112
            }));
            setAutocompleteResults(mapped);
          }
        }
      } catch (err) {
        console.warn('Maps API fetch error:', err.message);
      } finally {
        setIsLoadingResults(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Step 3: Selected Location & Doorstep Details State
  const [selectedLocation, setSelectedLocation] = useState({
    id: 'bhopal-station',
    title: 'Bhopal Railway Station',
    distance: '865 m',
    subtitle: 'Bajariya, Navbahar Colony, Bhopal, Madhya Pradesh, India',
    areaName: 'Hamidia Rd',
    fullAddress: 'Hamidia Rd, Bhopal Talkies, Bajariya, Navbahar Colony, Bhopal, Madhya Pradesh 462001, India',
    lat: 23.2655,
    lng: 77.4112
  });
  const [pinCoords, setPinCoords] = useState({ lat: 23.2655, lng: 77.4112 });
  const [houseNumber, setHouseNumber] = useState('abhilasha park');
  const [landmarkDetail, setLandmarkDetail] = useState('sgt school');
  const [saveAsType, setSaveAsType] = useState('Home'); // 'Home' | 'Other'

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

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const customLoc = {
            id: 'gps-loc',
            title: 'Current GPS Location',
            distance: '0 m',
            subtitle: 'Detected via device GPS',
            areaName: 'Current Location',
            fullAddress: 'Current Location, Detected Area, India',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          handleSelectLandmark(customLoc);
        },
        () => {
          handleSelectLandmark(LANDMARKS_DATA[0]);
        }
      );
    } else {
      handleSelectLandmark(LANDMARKS_DATA[0]);
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
      {/* STEP 1 & 2: SEARCH & LANDMARK AUTOCOMPLETE MODAL        */}
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

          {/* Search Box (Exact Frame 05 / 15 Match) */}
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 grid place-items-center absolute right-3.5 top-3.5 text-[10px] font-bold"
              >
                ✕
              </button>
            )}
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

          {/* AUTOCOMPLETE RESULTS (When user is typing) */}
          {searchQuery.trim() ? (
            <div className="space-y-1 max-h-72 overflow-y-auto divide-y divide-slate-100 pt-1">
              {autocompleteResults.length > 0 ? (
                autocompleteResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectLandmark(item)}
                    className="flex items-start gap-3.5 py-3.5 px-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition select-none group"
                  >
                    <div className="flex flex-col items-center pt-0.5 min-w-[45px]">
                      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#5932ea] transition" />
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">{item.distance}</span>
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-950">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  onClick={() => {
                    const custom = {
                      id: `custom-${Date.now()}`,
                      title: searchQuery,
                      distance: '100 m',
                      subtitle: `${searchQuery}, City Center, India`,
                      areaName: searchQuery,
                      fullAddress: `${searchQuery}, Main Road, India`,
                      lat: 23.2599,
                      lng: 77.4126
                    };
                    handleSelectLandmark(custom);
                  }}
                  className="p-4 text-center cursor-pointer hover:bg-purple-50 rounded-2xl border border-dashed border-purple-300"
                >
                  <p className="text-xs font-bold text-purple-900">Pinpoint "{searchQuery}" on Map ➔</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Click to open map and set exact doorstep coordinates</p>
                </div>
              )}
            </div>
          ) : (
            /* RECENTS LIST (Exact Frame 05 Match) */
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Recents</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {recentSearches.map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const found = LANDMARKS_DATA.find(l => l.title === rec.title) || {
                        id: `rec-${idx}`,
                        title: rec.title,
                        distance: '500 m',
                        subtitle: rec.subtitle,
                        areaName: rec.title,
                        fullAddress: rec.fullAddress,
                        lat: rec.lat,
                        lng: rec.lng
                      };
                      handleSelectLandmark(found);
                    }}
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

          {/* Powered by Google Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span>powered by</span>
            <span className="font-bold text-slate-600 font-sans tracking-tight">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
            </span>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: TWO-PANE PINPOINT MAP & DOORSTEP DETAILS (FRAME 20/32) */}
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

          {/* LEFT PANE: INTERACTIVE MAP CANVAS (EXACT SCREENSHOT) */}
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const xPercent = (e.clientX - rect.left) / rect.width;
              const yPercent = (e.clientY - rect.top) / rect.height;
              // Subtle dynamic coordinate shift based on user tap
              const newLat = selectedLocation.lat + (yPercent - 0.5) * 0.005;
              const newLng = selectedLocation.lng + (xPercent - 0.5) * 0.005;
              setPinCoords({ lat: newLat, lng: newLng });
            }}
            className="md:col-span-6 bg-slate-100 relative min-h-[320px] md:min-h-[540px] flex items-center justify-center overflow-hidden select-none border-b md:border-b-0 md:border-r border-slate-200 cursor-crosshair group"
          >
            
            {/* Styled Realistic Google Map Background Image / Layer */}
            <div className="absolute inset-0 bg-[#e5e3df] opacity-95">
              <div 
                className="w-full h-full bg-cover bg-center transition-all duration-300 transform scale-105"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80')`,
                  filter: 'contrast(1.05) saturate(0.9)'
                }}
              />
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
            </div>

            {/* Custom Urban Company Pinpoint Marker & Floating Tooltip */}
            <div className="relative z-10 flex flex-col items-center pointer-events-none transform -translate-y-6">
              
              {/* Dark floating pill tooltip (Exact frame 20/32 match) */}
              <div className="bg-[#1e293b] text-white px-3.5 py-1.5 rounded-xl text-[11px] font-bold shadow-2xl mb-1 text-center whitespace-nowrap animate-bounce">
                Place the pin accurately on map
              </div>

              {/* Pinpoint Target Circle & Blue Dot */}
              <div className="w-8 h-8 rounded-full bg-[#5932ea] text-white border-2 border-white shadow-2xl grid place-items-center font-black">
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
              </div>

              {/* Pin stem */}
              <div className="w-0.5 h-4 bg-[#5932ea] shadow-md"></div>
              {/* Pin shadow base */}
              <div className="w-4 h-1.5 bg-black/30 rounded-full blur-[1px]"></div>
            </div>

            {/* Target GPS recenter button at bottom-right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUseCurrentLocation();
              }}
              title="Locate Me"
              className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 grid place-items-center hover:bg-slate-50 active:scale-95 transition"
            >
              <LocateFixed className="w-5 h-5 text-slate-700" />
            </button>

            {/* Bottom Google Branding */}
            <div className="absolute bottom-3 left-4 z-20 text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded shadow-sm">
              Google Maps
            </div>
          </div>

          {/* RIGHT PANE: DOORSTEP DETAILS FORM (EXACT FRAME 20/32) */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6 bg-white">
            
            <div className="space-y-5">
              {/* Area Header with Change Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-['Outfit']">
                    {selectedLocation.areaName}
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

                {/* Submit Action (Exact Frame 32 Match) */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-[#5932ea] hover:bg-[#4927cb] text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
                  >
                    Save and proceed to slots
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: DATE & TIME SLOT PICKER MODAL (FRAME 36 MATCH)   */}
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

          {/* Date Selector Cards (Exact Frame 36 Match) */}
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

          {/* 3-Column Time Slot Grid (Exact Frame 36 Match) */}
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

          {/* Bottom Proceed to Checkout CTA (Exact Frame 36 Match) */}
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
