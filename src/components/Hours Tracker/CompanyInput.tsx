import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Building2, MapPin, Search as SearchIcon, Loader2, ExternalLink, Check, AlertCircle, ChevronDown, ChevronUp, LocateFixed } from 'lucide-react';
import debounce from 'lodash.debounce';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CompanyInputProps {
    companyName: string;
    companyLocation: string;
    totalRequiredHours: number;
    onCompanyNameChange: (name: string) => void;
    onCompanyLocationChange: (location: string) => void;
    onTotalHoursChange: (hours: number) => void;
}

interface PlaceResult {
    display_name: string;
    coordinates?: [number, number];
}

const CompanyInput: React.FC<CompanyInputProps> = ({
    companyName,
    companyLocation,
    totalRequiredHours,
    onCompanyNameChange,
    onCompanyLocationChange,
    onTotalHoursChange,
}) => {
    const ILIGAN_CENTER: [number, number] = [8.2280, 124.2452];
    const ILIGAN_BBOX = "124.15,8.12,124.45,8.45"; // minLon,minLat,maxLon,maxLat
    const [mapCenter, setMapCenter] = useState<[number, number]>(ILIGAN_CENTER);
    const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

    const [isMinimized, setIsMinimized] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState(companyLocation);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Sync input value with prop only when prop changes from outside
    useEffect(() => {
        if (!isSearching && companyLocation !== inputValue) {
            setInputValue(companyLocation);
        }
    }, [companyLocation, isSearching, inputValue]);

    const fetchPlaces = async (query: string) => {
        const trimmed = query.trim();
        if (trimmed.length < 3) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsSearching(true);
        setShowDropdown(true);
        setError(null);

        try {
            // Using PHOTON API (by Komoot) - Restricted to Iligan City
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6&lat=${ILIGAN_CENTER[0]}&lon=${ILIGAN_CENTER[1]}&bbox=${ILIGAN_BBOX}`;

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();

            if (data && data.features) {
                const results = data.features.map((feature: any) => {
                    const props = feature.properties;
                    // Construct a readable display name from Photon properties
                    const name = props.name || '';
                    const street = props.street ? `, ${props.street}` : '';
                    const city = props.city ? `, ${props.city}` : '';
                    const country = props.country ? `, ${props.country}` : '';
                    const coords = feature.geometry?.coordinates;
                    return {
                        display_name: `${name}${street}${city}${country}`,
                        coordinates: coords ? [coords[1], coords[0]] : undefined // Photon is [lon, lat]
                    };
                });
                setSuggestions(results);
            } else {
                setSuggestions([]);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Search cancelled');
            } else {
                console.error('Search error:', err);
                setError('Search failed. Try again.');
                setSuggestions([]);
            }
        } finally {
            setIsSearching(false);
        }
    };

    const debouncedFetch = useCallback(
        debounce((query: string) => fetchPlaces(query), 500),
        []
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        // Persist typed value even if the user never selects a suggestion
        onCompanyLocationChange(val);

        const trimmed = val.trim();
        if (trimmed.length >= 3) {
            setShowDropdown(true);
            debouncedFetch(trimmed);
        } else {
            // For very short input, do not search and hide dropdown
            setShowDropdown(false);
            setSuggestions([]);
            setError(null);
        }
    };

    const selectPlace = (place: PlaceResult, coords?: [number, number]) => {
        onCompanyLocationChange(place.display_name);
        setInputValue(place.display_name);
        if (coords) {
            setMapCenter(coords);
            setMarkerPos(coords);
        }
        setSuggestions([]);
        setShowDropdown(false);
        setError(null);
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        setIsSearching(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Check if within Iligan bounds (roughly)
                const inIligan = latitude >= 8.12 && latitude <= 8.45 && longitude >= 124.15 && longitude <= 124.45;

                if (!inIligan) {
                    setError('You must be in Iligan City');
                    setIsSearching(false);
                    return;
                }

                try {
                    const response = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        const props = data.features[0].properties;
                        const name = props.name || '';
                        const city = props.city || 'Iligan City';
                        const display = `${name}${name && city ? ', ' : ''}${city}`;
                        selectPlace({ display_name: display }, [latitude, longitude]);
                    } else {
                        selectPlace({ display_name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` }, [latitude, longitude]);
                    }
                } catch (_err) {
                    selectPlace({ display_name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` }, [latitude, longitude]);
                }
            },
            () => {
                setError('Location access denied');
                setIsSearching(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // Helper component to update map view
    const ChangeView = ({ center }: { center: [number, number] }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, 15);
        }, [center, map]);
        return null;
    };

    // Drag handlers for minimize/maximize gesture
    const handleDragStart = (clientY: number) => {
        setDragStartY(clientY);
        setIsDragging(true);
    };

    const handleDragMove = (clientY: number) => {
        if (!isDragging) return;
        const offset = clientY - dragStartY;
        // Only allow dragging down when expanded, or up when minimized
        if ((!isMinimized && offset > 0) || (isMinimized && offset < 0)) {
            setDragOffset(offset);
        }
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Threshold for toggle (50px drag)
        if (Math.abs(dragOffset) > 50) {
            setIsMinimized(!isMinimized);
        }
        setDragOffset(0);
    };

    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleDragMove(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    // Mouse event handlers (for testing on desktop)
    const handleMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
        handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStartY]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    return (
        <div
            ref={cardRef}
            className={`card overflow-hidden transition-all duration-500 ease-out ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            style={{
                animationDelay: '0.1s',
                transform: isDragging ? `translateY(${dragOffset}px)` : 'translateY(0)',
                maxHeight: isMinimized ? '80px' : '1000px',
                transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {/* Drag Handle Header */}
            <div
                className="flex items-center justify-between mb-4 touch-none select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">Organization</h2>
                        {isMinimized && (
                            <p className="text-xs text-[#1a2517]/60 font-medium truncate max-w-[200px]">
                                {companyName || 'Not set'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Drag indicator & Toggle button */}
                <div className="flex items-center gap-2">

                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 rounded-full hover:bg-[#1a2517]/10 transition-colors mr-8"
                        aria-label={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? (
                            <ChevronDown className="w-5 h-5 text-[#1a2517]" />
                        ) : (
                            <ChevronUp className="w-5 h-5 text-[#1a2517]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Collapsible Content */}
            <div className={`space-y-4 transition-opacity duration-300 ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Company Name */}
                <div>
                    <label className="block text-[10px] font-black text-primary/40 mb-2 uppercase tracking-[0.2em]">Company Name</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => onCompanyNameChange(e.target.value)}
                        className="input-field truncate !pr-10"
                        placeholder="Ex. Google PH"
                    />
                </div>

                {/* Location Search Container */}
                <div className="relative" ref={dropdownRef}>
                    <label className="block text-[10px] font-black text-primary/40 mb-2 uppercase tracking-[0.2em] flex items-center justify-between">
                        Work Location
                        {companyLocation && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyLocation)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-wider hover:bg-primary/20 transition-all"
                            >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Open Maps
                            </a>
                        )}
                    </label>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a2517]/30 group-focus-within:text-[#1a2517] transition-colors" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            className={`input-field !pl-11 !pr-24 focus:ring-0 truncate ${error ? 'border-red-200' : ''}`}
                            placeholder="Type to search locations in Iligan..."
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <button
                                onClick={handleCurrentLocation}
                                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary/60 hover:text-primary transition-all"
                                title="Use Current Location"
                            >
                                <LocateFixed className="w-4 h-4" />
                            </button>
                            {isSearching ? <Loader2 className="w-4 h-4 text-[#1a2517] animate-spin" /> : <SearchIcon className="w-4 h-4 text-[#1a2517]/30" />}
                        </div>
                    </div>

                    {/* Results Dropdown */}
                    {showDropdown && (inputValue.length >= 3) && (
                        <div className="absolute z-[100] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            {isSearching && (
                                <div className="p-10 flex flex-col items-center justify-center gap-4">
                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-[#1a2517]/5 border-t-[#1a2517] animate-spin"></div>
                                        <MapPin className="w-5 h-5 text-[#1a2517]/40" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-[#1a2517] uppercase tracking-[0.2em] mb-1">Searching API</p>
                                        <p className="text-[9px] text-[#1a2517]/40 font-bold uppercase tracking-wider animate-pulse">Scanning database...</p>
                                    </div>
                                </div>
                            )}

                            {error && !isSearching && (
                                <div className="p-10 text-center space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest leading-relaxed">Service temporary unavailable<br />Please try again later</p>
                                </div>
                            )}

                            {!isSearching && !error && (
                                <>
                                    {suggestions.length > 0 ? (
                                        suggestions.map((p, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    selectPlace(p, p.coordinates);
                                                }}
                                                className="w-full text-left px-5 py-4 hover:bg-[#1a2517]/5 transition-all flex items-start gap-4 border-b border-gray-50 last:border-0 group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-[#1a2517]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1a2517]/10">
                                                    <MapPin className="w-4 h-4 text-[#1a2517]/40 group-hover:text-[#1a2517]" />
                                                </div>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className="text-xs font-black text-[#1a2517] truncate mb-1 group-hover:translate-x-1 transition-transform">{p.display_name.split(',')[0]}</p>
                                                    <p className="text-[9px] text-gray-400 line-clamp-2 uppercase font-medium tracking-tight">{p.display_name}</p>
                                                </div>
                                                {companyLocation === p.display_name && <Check className="w-4 h-4 text-[#1a2517] mt-1 shrink-0" />}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-300">
                                                <SearchIcon className="w-5 h-5" />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">No locations found<br />Try searching for something else</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Leaflet Map Preview */}
                    <div className="mt-4 rounded-2xl overflow-hidden border border-primary/5 shadow-inner h-48 relative z-0">
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            scrollWheelZoom={false}
                            style={{ height: '100%', width: '100%' }}
                            dragging={!isDragging}
                            zoomControl={false}
                            maxBounds={[[8.10, 124.10], [8.50, 124.50]]}
                            minZoom={11}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <ChangeView center={mapCenter} />
                            {markerPos && <Marker position={markerPos} icon={L.icon({
                                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41]
                            })} />}
                        </MapContainer>
                        <div className="absolute bottom-2 right-2 z-[400] bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-bold text-primary uppercase tracking-tighter shadow-sm border border-black/5 pointer-events-none">
                            Iligan City Restricted
                        </div>
                    </div>
                </div>

                {/* Target Hours */}
                <div>
                    <label className="block text-xs font-bold text-[#1a2517]/70 mb-2 uppercase tracking-widest">Required Target Hours</label>
                    <input
                        type="number"
                        value={totalRequiredHours}
                        onChange={(e) => onTotalHoursChange(Number(e.target.value))}
                        className="input-field"
                    />
                </div>
            </div>
        </div>
    );
};

export default CompanyInput;
