"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from "next/navigation"
import { jwtDecode } from 'jwt-decode';

// Interfaces
interface User {
    name: string;
    email: string;
}

interface AccessTokenPayload {
    email: string;
    first_name: string;
    last_name: string;
    exp: number;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    login: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    getAccessToken: () => Promise<string | null>;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    // Compute initial state values synchronously
    let accessToken: string | null = null
    let refreshToken: string | null = null
    
    if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('accessToken');
        refreshToken = localStorage.getItem('refreshToken');
    }

    let user: User | null = null;
    
    if (accessToken && refreshToken) {
        try {
            const decoded: AccessTokenPayload = jwtDecode(accessToken);
            user = {
                name: `${decoded.first_name} ${decoded.last_name}`,
                email: decoded.email,
            };
        } catch (error) {
            console.error('Failed to decode stored access token:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            accessToken = null;
            refreshToken = null;
        }
    }
    
    // Initialize state with computed values
    const [stateUser, setUser] = useState(user);
    const [stateAccessToken, setAccessToken] = useState(accessToken);
    const [stateRefreshToken, setRefreshToken] = useState(refreshToken);

    const router = useRouter();
    
    // Login function
    const login = (newAccessToken: string, newRefreshToken: string) => {
        try {
            const decoded: AccessTokenPayload = jwtDecode(newAccessToken);
            const newUser: User = {
                name: `${decoded.first_name} ${decoded.last_name}`,
                email: decoded.email,
            };
            setUser(newUser);
            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
        } catch (error) {
            console.error('Failed to decode access token:', error);
        }
    };
    
    // Logout function
    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    useEffect(() => {
        if (accessToken === null && window.location.pathname.includes("dashboard")) {
            router.push("/login")
        }
    }, [])
    
    // Refresh access token function
    const refreshAccessToken = async (): Promise<string | undefined> => {
        if (!stateRefreshToken) {
            logout();
            return;
        }
        
        try {
            const response = await fetch('https://todoapp.reesenorr.is/api/user/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    'refresh_token': stateRefreshToken,
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }
            
            const data = await response.json();
            const newAccessToken = data['access_token']
            setAccessToken(newAccessToken);
            localStorage.setItem('accessToken', newAccessToken);
            return newAccessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
        }
    };
    
    // Get access token function
    const getAccessToken = async (): Promise<string | null> => {
        if (!stateAccessToken) {
            return null;
        }
        
        try {
            const decoded: AccessTokenPayload = jwtDecode(stateAccessToken);
            const currentTime = Date.now() / 1000;
            
            await refreshAccessToken();

            // TODO: put this back
            if (decoded.exp < currentTime + 300) {
                // noop
            }
            return stateAccessToken;
        } catch (error) {
            console.error('Invalid token:', error);
            return null;
        }
    };
    
    // Context value
    const value: AuthContextType = {
        user: stateUser,
        accessToken: stateAccessToken,
        refreshToken: stateRefreshToken,
        login,
        logout,
        getAccessToken,
    };
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}