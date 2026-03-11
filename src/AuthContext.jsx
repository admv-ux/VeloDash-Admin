import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from './api/base44Client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userPhone, setUserPhone] = useState(localStorage.getItem('admin_phone'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            if (userPhone) {
                try {
                    // If we have a phone number, we assume the user is "logged in" for this admin flow
                    // In a more complex app, we'd verify a JWT here
                    const profile = await base44.auth.me();
                    setUser(profile);
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
        loading
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
