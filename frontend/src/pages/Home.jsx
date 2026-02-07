import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OceanWaves from '../components/OceanWaves';

const Home = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/stats');
                const data = await response.json();
                // Backend returns stats object directly
                setStats(data);
            } catch (error) {
                console.log('Stats currently unavailable');
            }
        };
        fetchStats();
    }, []);

    return (
        <div style={styles.page}>
            {/* Hero Section */}
            <section style={styles.hero}>
                <div style={styles.heroBg}>
                    <div style={styles.circle1}></div>
                    <div style={styles.circle2}></div>
                </div>

                {/* Local Ocean Waves for Hero */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '300px', zIndex: 0 }}>
                    <OceanWaves showBubbles={true} showFoam={true} />
                </div>

                <div style={styles.container}>
                    <div style={styles.heroContent} className="animate-slide-up">
                        <div style={styles.badge} className="glass">
                            <span>✨</span>
                            <span>Next-Gen Coastal Protection</span>
                        </div>
                        <h1 style={styles.heroTitle}>
                            Clean Oceans Powered by <span style={styles.gradientText}>AI Intelligence</span>
                        </h1>
                        <p style={styles.heroSubtitle}>
                            Protecting our shores with real-time detection and community action. Join the global movement to preserve marine life through data-driven reporting.
                        </p>

                        <div style={styles.ctaGroup}>
                            <Link to="/upload" className="btn-primary" style={styles.mainBtn}>
                                📸 Start Reporting
                            </Link>
                            <Link to="/map" style={styles.outlineBtn}>
                                🗺️ Explore Hotspots
                            </Link>
                        </div>

                        {/* Stats Bar */}
                        <div style={styles.heroStats} className="glass">
                            <div style={styles.statItem}>
                                <div style={styles.statVal}>{stats?.total || '0'}+</div>
                                <div style={styles.statLabel}>Reports Logged</div>
                            </div>
                            <div style={styles.statDivider}></div>
                            <div style={styles.statItem}>
                                <div style={styles.statVal}>99.4%</div>
                                <div style={styles.statLabel}>AI Accuracy</div>
                            </div>
                            <div style={styles.statDivider}></div>
                            <div style={styles.statItem}>
                                <div style={styles.statVal}>24/7</div>
                                <div style={styles.statLabel}>Active Monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={styles.features}>
                <div style={styles.container}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>The Workflow</h2>
                        <p style={styles.sectionSubtitle}>Simple, fast, and impactful reporting system</p>
                    </div>

                    <div style={styles.featureGrid}>
                        {[
                            { icon: '📸', title: 'Capture', desc: 'Snap a photo of coastal pollution' },
                            { icon: '👁️', title: 'Analyze', desc: 'AI identifies the exact pollutant' },
                            { icon: '📍', title: 'Locate', desc: 'Precision mapping via GPS metadata' },
                            { icon: '🚀', title: 'Action', desc: 'Forward data to local NGOs instantly' }
                        ].map((f, i) => (
                            <div key={i} className="premium-card" style={styles.featureCard}>
                                <div style={styles.featureIcon}>{f.icon}</div>
                                <h3 style={styles.featureTitle}>{f.title}</h3>
                                <p style={styles.featureDesc}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section style={styles.impact}>
                <div style={styles.container}>
                    <div style={styles.impactGrid}>
                        <div style={styles.impactContent}>
                            <h2 style={styles.impactTitle}>Global Impact</h2>
                            <p style={styles.impactText}>
                                Marine debris affects over 800 species. Our platform provides the critical bridge between citizen data and organizational action, enabling cleanups to happen where they matter most.
                            </p>
                            <div style={styles.impactList}>
                                <div style={styles.impactItem}>✅ Real-time data visualization</div>
                                <div style={styles.impactItem}>✅ Direct NGO integration</div>
                                <div style={styles.impactItem}>✅ Zero-shot AI classification</div>
                            </div>
                        </div>
                        <div style={styles.impactVisual} className="animate-float">
                            <div style={styles.visualCard} className="glass">
                                <div style={styles.visualHeader}>
                                    <span>🥤 Plastic Detected</span>
                                    <span>High Confidence</span>
                                </div>
                                <div style={styles.visualProgress}></div>
                                <div style={styles.visualFooter}>MUMBAI COASTLINE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={styles.finalCta} className="glass-dark">
                <div style={styles.container}>
                    <h2 style={styles.finalTitle}>Ready to take charge?</h2>
                    <p style={styles.finalText}>Join thousands of ocean guardians around the world.</p>
                    <Link to="/upload" className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                        Join the Movement Now
                    </Link>
                </div>
            </section>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 },

    // Hero
    hero: { position: 'relative', padding: '8rem 0 12rem', overflow: 'hidden' }, // Increased bottom padding for waves
    heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
    circle1: { position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', filter: 'blur(80px)' }, // Updated color
    circle2: { position: 'absolute', bottom: '10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(60px)' }, // Updated color

    heroContent: { textAlign: 'center', maxWidth: '900px', margin: '0 auto' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: 700, color: '#06b6d4', marginBottom: '2rem', border: '1px solid rgba(6, 182, 212, 0.2)' }, // Updated color
    heroTitle: { fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-2px' },
    gradientText: { background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, // Updated gradient
    heroSubtitle: { fontSize: '1.25rem', color: '#64748b', marginBottom: '3rem', lineHeight: 1.8, maxWidth: '700px', margin: '0 auto 3rem' },

    ctaGroup: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '5rem' },
    mainBtn: { padding: '1rem 2.5rem', fontSize: '1.1rem' },
    outlineBtn: { padding: '1rem 2.5rem', fontSize: '1.1rem', background: 'white', color: '#1e293b', border: '2px solid #e2e8f0', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 700, transition: 'all 0.3s ease' },

    heroStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '2rem', borderRadius: '2rem', maxWidth: '800px', margin: '0 auto' },
    statItem: { padding: '0 1rem' },
    statVal: { fontSize: '2rem', fontWeight: 800, color: '#0f172a' },
    statLabel: { fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.25rem' },
    statDivider: { width: '1px', height: '40px', background: '#e2e8f0', margin: 'auto' },

    // Features
    features: { padding: '8rem 0' },
    sectionHeader: { textAlign: 'center', marginBottom: '4rem' },
    sectionTitle: { fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' },
    sectionSubtitle: { fontSize: '1.1rem', color: '#64748b' },
    featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' },
    featureCard: { textAlign: 'center' },
    featureIcon: { fontSize: '3rem', marginBottom: '1.5rem', display: 'block' },
    featureTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' },
    featureDesc: { color: '#64748b', lineHeight: 1.6 },

    // Impact
    impact: { padding: '8rem 0', background: 'white' },
    impactGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' },
    impactContent: { textAlign: 'left' },
    impactTitle: { fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' },
    impactText: { fontSize: '1.15rem', color: '#64748b', lineHeight: 1.8, marginBottom: '2rem' },
    impactList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    impactItem: { fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.75rem' },

    impactVisual: { position: 'relative', height: '400px', background: 'url(https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=800&q=80)', backgroundSize: 'cover', borderRadius: '2rem', overflow: 'hidden' },
    visualCard: { position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', padding: '1.5rem', borderRadius: '1.5rem', color: '#1e293b' },
    visualHeader: { display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: '1rem' },
    visualProgress: { height: '6px', background: '#06b6d4', borderRadius: '3px', width: '85%', marginBottom: '1rem' },
    visualFooter: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', opacity: 0.6 },

    // Final CTA
    finalCta: { padding: '8rem 2rem', textAlign: 'center', margin: '0 2rem 4rem', borderRadius: '3rem', color: 'white' },
    finalTitle: { fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' },
    finalText: { fontSize: '1.25rem', opacity: 0.8, marginBottom: '3rem' }
};

export default Home;
