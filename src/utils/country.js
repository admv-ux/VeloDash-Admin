export const countryNames = {
    "GH": "Ghana",
    "NG": "Nigeria",
    "KE": "Kenya",
    "UG": "Uganda",
    "RW": "Rwanda",
    "TZ": "Tanzania",
    "ZA": "South Africa",
    "EG": "Egypt",
    "ET": "Ethiopia",
    "MA": "Morocco",
    "CI": "Ivory Coast",
    "SN": "Senegal",
    "CM": "Cameroon",
    "GHANA": "Ghana",
    "NIGERIA": "Nigeria",
    "US": "United States",
    "GB": "United Kingdom",
    "UK": "United Kingdom",
    "CA": "Canada",
    "DE": "Germany",
    "FR": "France",
    "CN": "China",
    "IN": "India",
    "AE": "United Arab Emirates",
};

export const getCountryName = (code) => {
    if (!code) return "Global";
    const upper = code.trim().toUpperCase();
    return countryNames[upper] || upper;
};
