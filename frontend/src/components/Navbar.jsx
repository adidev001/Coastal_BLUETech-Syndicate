/**
 * 🌊 Navbar Component - Premium Design
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, logout, isAdmin, user } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/map', label: 'Map', icon: '🗺️' },
    ];

    // Add Report link only if authenticated
    if (isAuthenticated && !isAdmin) {
        navLinks.splice(1, 0, { path: '/upload', label: 'Report', icon: '📸' });
        navLinks.push({ path: '/profile', label: 'Profile', icon: '👤' });
    }

    // Add Admin links if admin
    if (isAdmin) {
        navLinks.splice(1, 0, { path: '/admin', label: 'Dashboard', icon: '📊' });
        navLinks.push({ path: '/ngos', label: 'NGOs', icon: '🤝' });
    }

    return (
        <nav style={{
            ...styles.nav,
            ...(scrolled ? styles.navScrolled : {})
        }}>
            <div style={styles.container}>
                {/* Logo */}
                <Link to="/" style={styles.logo}>
                    <div style={styles.logoIcon}>🌊</div>
                    <div style={styles.logoTextContainer}>
                        <span style={styles.logoText}>COASTAL</span>
                        <span style={styles.logoSubtext}>MONITOR</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div style={styles.desktopNav} className="desktop-nav">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="nav-link"
                            style={{
                                ...styles.navLink,
                                ...(isActive(link.path) ? styles.navLinkActive : {}),
                            }}
                        >
                            <span style={styles.linkIcon}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}

                    {isAuthenticated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                            <span style={styles.welcomeText}>Hi, {user?.full_name?.split(' ')[0]}</span>
                            <button onClick={handleLogout} style={styles.logoutButton}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to="/login" style={styles.loginLink}>
                                Login
                            </Link>
                            <Link to="/signup" style={styles.ctaButton}>
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Button */}
                <button
                    className="menu-button"
                    style={styles.menuButton}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} style={styles.hamburger}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div style={styles.mobileNav} className="glass">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    ...styles.mobileNavLink,
                                    ...(isActive(link.path) ? styles.mobileNavLinkActive : {}),
                                }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span style={styles.linkIcon}>{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}

                        <div style={styles.mobileDivider}></div>

                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                style={{ ...styles.mobileNavLink, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem' }}
                            >
                                <span style={styles.linkIcon}>🚪</span>
                                Logout
                            </button>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    style={styles.mobileNavLink}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span style={styles.linkIcon}>🔑</span>
                                    Log In
                                </Link>
                                <Link
                                    to="/signup"
                                    style={{ ...styles.mobileNavLink, background: '#0f172a', color: 'white' }}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span style={styles.linkIcon}>✨</span>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

const styles = {
    // ... (keeping existing styles from lines 103-241)
    nav: {
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'transparent',
        padding: '1.25rem 0',
    },
    navScrolled: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        padding: '0.75rem 0',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
        color: '#0f172a',
    },
    logoIcon: {
        fontSize: '1.75rem',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        width: '45px',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        color: 'white',
        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
    },
    logoTextContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    logoText: {
        fontSize: '1.25rem',
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: '1px',
    },
    logoSubtext: {
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#64748b',
        letterSpacing: '3px',
    },
    desktopNav: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    navLink: {
        padding: '0.5rem 1rem',
        color: '#475569',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    navLinkActive: {
        color: '#0ea5e9',
        background: 'rgba(14, 165, 233, 0.08)',
    },
    linkIcon: {
        fontSize: '1.1rem',
    },
    ctaButton: {
        marginLeft: '1rem',
        padding: '0.625rem 1.25rem',
        background: '#0f172a',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: 700,
        fontSize: '0.9rem',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
    },
    loginLink: {
        padding: '0.625rem 1.25rem',
        color: '#475569',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.9rem',
        transition: 'all 0.3s ease',
    },
    logoutButton: {
        padding: '0.5rem 1rem',
        background: 'transparent',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#64748b',
        transition: 'all 0.2s',
    },
    welcomeText: {
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#0f172a',
    },
    menuButton: {
        display: 'none',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
    },
    hamburger: {
        width: '24px',
        height: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    mobileNav: {
        position: 'absolute',
        top: '100%',
        left: '1rem',
        right: '1rem',
        padding: '1.5rem',
        borderRadius: '1.5rem',
        marginTop: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        zIndex: 1001,
    },
    mobileNavLink: {
        padding: '0.75rem 1.25rem',
        textDecoration: 'none',
        color: '#475569',
        fontWeight: 600,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    mobileNavLinkActive: {
        background: '#0ea5e9',
        color: 'white',
    },
    mobileDivider: {
        height: '1px',
        background: '#e2e8f0',
        margin: '0.5rem 0',
    }
};

export default Navbar;
