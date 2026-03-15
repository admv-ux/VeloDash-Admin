import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from './api/base44Client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userPhone, setUserPhone] = useState(localStorage.getItem('admin_phone'));
    const [loading, setLoading] = useState(true);
    const [currentLocation, setCurrentLocation] = useState({
        country: localStorage.getItem('v_country_scope') || 'All',
        city: localStorage.getItem('v_city_scope') || 'All'
    });

    const setLocationScope = (location) => {
        const newLocation = { ...currentLocation, ...location };
        localStorage.setItem('v_country_scope', newLocation.country);
        localStorage.setItem('v_city_scope', newLocation.city);
        setCurrentLocation(newLocation);
    };

    useEffect(() => {
        async function checkAuth() {
            if (userPhone) {
                try {
                    const profile = await base44.auth.me();
                    setUser(profile);
                    
                    // Set default location scope if user has restricted roles
                    if (profile.roles && profile.roles.length > 0) {
                        const firstRole = profile.roles[0];
                        if (firstRole.allowedCountries && firstRole.allowedCountries.length > 0) {
                            setCurrentLocation({
                                country: firstRole.allowedCountries[0],
                                city: firstRole.allowedCities?.[0] || 'All'
                            });
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    localStorage.removeItem('admin_phone');
                    setUserPhone(null);
                }
            }
            setLoading(false);
        }
        checkAuth();
    }, [userPhone]);

    const login = (phone) => {
        localStorage.setItem('admin_phone', phone);
        setUserPhone(phone);
    };

    const logout = () => {
        localStorage.removeItem('admin_phone');
        setUserPhone(null);
        setUser(null);
    };


    const value = {
        user,
        userPhone,
        isAuthenticated: !!userPhone,
        login,
        logout,
        loading,
        currentLocation,
        setLocationScope
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
