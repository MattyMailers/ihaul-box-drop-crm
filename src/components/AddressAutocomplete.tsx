'use client';

import { useEffect, useRef, useState } from 'react';

// Define minimal types for Google Maps Places Autocomplete
interface PlaceResult {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface AutocompleteOptions {
  componentRestrictions?: { country: string | string[] };
  fields?: string[];
  types?: string[];
}

interface GoogleAutocomplete {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => PlaceResult;
}

interface GoogleMapsPlaces {
  Autocomplete: new (input: HTMLInputElement, options?: AutocompleteOptions) => GoogleAutocomplete;
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: GoogleMapsPlaces;
      };
    };
    initGoogleMapsCallback?: () => void;
  }
}

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

// Track if script is loading/loaded globally
let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (isScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (isScriptLoading) {
      return;
    }

    isScriptLoading = true;

    window.initGoogleMapsCallback = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Enter address',
  className = '',
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Fetch API key from server
  useEffect(() => {
    fetch('/api/config/maps-key')
      .then(r => r.json())
      .then(data => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {
        // API key not available, autocomplete won't work but input still works
      });
  }, []);

  // Load Google Maps script when API key is available
  useEffect(() => {
    if (!apiKey) return;

    loadGoogleMapsScript(apiKey).then(() => {
      setIsReady(true);
    });
  }, [apiKey]);

  // Initialize autocomplete when ready
  useEffect(() => {
    if (!isReady || !inputRef.current || !window.google?.maps?.places) return;

    // Avoid re-initializing
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['formatted_address', 'address_components'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [isReady, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      required={required}
      autoComplete="off"
    />
  );
}
