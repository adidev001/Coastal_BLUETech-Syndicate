import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, Map, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './FloatingNavbar.css';

const FloatingNavbar = () => {
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Report', path: '/upload', icon: Camera, requiresAuth: true },
        { name: 'Map', path: '/map', icon: Map },
        { name: 'Profile', path: '/profile', icon: User, requiresAuth: true },
    ];

    // Add admin link if user is admin
    if (user?.role === 'admin') {
        navItems.push({ name: 'Admin', path: '/admin', icon: Shield });
    }

    const filteredItems = navItems.filter(item =>
        !item.requiresAuth || isAuthenticated
    );

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="floating-navbar">
            <div className="floating-navbar-container">
                {/* Logo - only on desktop */}
                {!isMobile && (
                    <Link to="/" className="floating-navbar-logo">
                        <span className="logo-icon">🌊</span>
                        <span className="logo-text">COASTAL</span>
                    </Link>
                )}

                {/* Nav Items */}
                <div className="floating-navbar-items">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`floating-nav-item ${active ? 'active' : ''}`}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="nav-indicator"
                                        initial={false}
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <Icon size={20} strokeWidth={2.5} className="nav-icon" />
                                {!isMobile && <span className="nav-label">{item.name}</span>}

                                {/* Tubelight glow effect */}
                                {active && (
                                    <div className="tubelight-glow">
                                        <div className="glow-bar" />
                                        <div className="glow-blur-1" />
                                        <div className="glow-blur-2" />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Auth Section */}
                <div className="floating-navbar-auth">
                    {isAuthenticated ? (
                        <>
                            {!isMobile && (
                                <span className="user-greeting">Hi, {user?.full_name?.split(' ')[0]}</span>
                            )}
                            <button onClick={logout} className="floating-logout-btn">
                                <LogOut size={18} />
                                {!isMobile && <span>Logout</span>}
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="floating-login-btn">
                            <User size={18} />
                            {!isMobile && <span>Login</span>}
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default FloatingNavbar;
