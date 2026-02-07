/**
 * 🌊 Coastal Pollution Monitor - Main App Component
 * 
 * This is the root component that sets up routing and layout.
 * Uses React Router for navigation between pages.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Auth Provider
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Component imports
import FloatingNavbar from './components/FloatingNavbar';
import OceanWaves from './components/OceanWaves';

// Page imports
import Home from './pages/Home';
import Upload from './pages/Upload';
import MapView from './pages/Map';
import NGOs from './pages/NGOs';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// API Base URL - defaults to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
    return (
        <AuthProvider>
            <Router>
                {/* Main app container */}
                <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                    {/* Floating Bottom Navigation */}
                    <FloatingNavbar />

                    {/* Main content area */}
                    <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Home />} />
                            <Route path="/map" element={<MapView apiUrl={API_URL} />} />
                            <Route path="/ngos" element={<NGOs apiUrl={API_URL} />} />

                            {/* Auth Routes */}
                            <Route path="/login" element={<Login apiUrl={API_URL} />} />
                            <Route path="/signup" element={<Signup apiUrl={API_URL} />} />

                            {/* Protected Routes */}
                            <Route
                                path="/upload"
                                element={
                                    <ProtectedRoute>
                                        <Upload apiUrl={API_URL} />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile apiUrl={API_URL} />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AdminDashboard apiUrl={API_URL} />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </main>

                    {/* Animated Ocean Waves Background */}
                    <OceanWaves showBubbles={true} showFoam={true} />

                    {/* Footer */}
                    <footer style={{
                        background: 'linear-gradient(135deg, #0891b2 0%, #155e75 100%)',
                        color: 'white',
                        padding: '3rem 2rem 2rem',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 2
                    }}>
                        {/* Wave decoration at top of footer */}
                        <div style={{
                            position: 'absolute',
                            top: '-30px',
                            left: 0,
                            right: 0,
                            height: '30px',
                            background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 60\'%3E%3Cpath fill=\'%230891b2\' d=\'M0,30 C360,60 720,0 1080,30 C1260,45 1380,40 1440,30 L1440,60 L0,60 Z\'/%3E%3C/svg%3E")',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat'
                        }}></div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.75rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }} className="animate-wave">🌊</span>
                            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                                Coastal Pollution Monitor
                            </p>
                        </div>
                        <p style={{
                            fontSize: '0.9rem',
                            opacity: 0.8,
                            marginBottom: '1rem'
                        }}>
                            Protecting our oceans, one report at a time
                        </p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '2rem',
                            fontSize: '0.85rem',
                            opacity: 0.7
                        }}>
                            <span>🐚 Clean Beaches</span>
                            <span>🐠 Marine Life</span>
                            <span>🌍 Sustainability</span>
                        </div>
                    </footer>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;

