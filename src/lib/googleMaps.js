// Loads the Google Maps JavaScript API once (same key as the mobile app). The key is public
// (already shipped in the app); override at build time with VITE_GOOGLE_MAPS_API_KEY if desired.
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAy_KPkeCwAm13oTpKjyWe7TSFlvlYaXmo';

let promise = null;

export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (promise) return promise;
  promise = new Promise((resolve, reject) => {
    // Google calls this on any key/referrer/billing/API failure.
    window.gm_authFailure = () => reject(new Error('Google Maps authorization failed. Enable the Maps JavaScript API for this key and allow this site in the key restrictions.'));
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&v=weekly&libraries=places,visualization`;
    s.async = true;
    s.onload = () => resolve(window.google.maps);
    s.onerror = () => reject(new Error('Failed to load Google Maps. Check your connection.'));
    document.head.appendChild(s);
  });
  return promise;
}
