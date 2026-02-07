import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const NGOs = ({ apiUrl = 'http://localhost:8000' }) => {
    const { isAuthenticated, user } = useAuth();
    const [ngos, setNgos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNGO, setSelectedNGO] = useState(null);
    const [message, setMessage] = useState('');
    const [myReports, setMyReports] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNgos = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/ngos`);
                setNgos(response.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching NGOs:', error);
                setIsLoading(false);
            }
        };

        const fetchUserReports = async () => {
            if (isAuthenticated) {
                try {
                    const response = await axios.get(`${apiUrl}/api/reports/my`);
                    setMyReports(response.data);
                } catch (error) {
                    console.error('Error fetching user reports:', error);
                }
            }
        };

        fetchNgos();
        fetchUserReports();
    }, [apiUrl, isAuthenticated]);

    const filteredNGOs = ngos.filter(ngo =>
        ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ngo.location && ngo.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ngo.address && ngo.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleReport = (ngo) => {
        if (!isAuthenticated) {
            alert("Please login to share your reports with NGOs.");
            return;
        }
        setSelectedNGO(ngo);
        setSelectedReportId(null);
        setMessage(`Hello ${ngo.name}, I am sharing a pollution incident I reported. Please find the details attached.`);
    };

    const sendReport = async (e) => {
        e.preventDefault();
        setIsSending(true);
        // In a real app, this might call an API to notify the NGO
        // For now, we simulate the secure transfer
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSending(false);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setSelectedNGO(null);
        }, 2500);
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={styles.container}>
                    <h1 style={styles.title} className="animate-fade-in">Partner Organizations</h1>
                    <p style={styles.subtitle} className="animate-slide-up">Connect with the organizations making a real impact on our coastlines</p>

                    <div style={styles.searchWrapper} className="glass animate-slide-up">
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Find local cleanup teams by name or city..."
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div style={styles.container}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading NGOs...</div>
                ) : (
                    <div style={styles.grid}>
                        {filteredNGOs.map((ngo, idx) => (
                            <div key={ngo.id} className="premium-card" style={styles.card}>
                                <div style={styles.cardImgWrapper}>
                                    <img
                                        src={ngo.logo_url || `https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=400&q=80`}
                                        alt={ngo.name}
                                        style={styles.cardImg}
                                    />
                                    <div style={styles.cardIcon}>🏢</div>
                                </div>
                                <div style={styles.cardContent}>
                                    <h3 style={styles.ngoName}>{ngo.name}</h3>
                                    <div style={styles.ngoLoc}>📍 {ngo.location || ngo.address}</div>

                                    <div style={styles.focusLabel}>Primary Focus</div>
                                    <div style={styles.focusVal}>{ngo.specialization}</div>

                                    <div style={styles.divider}></div>

                                    {user?.role === 'admin' ? (
                                        <button onClick={() => window.location.href = '/admin'} className="btn-primary" style={styles.actionBtn}>
                                            📋 Manage & Forward
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => ngo.website && window.open(ngo.website, '_blank')}
                                            className="btn-primary"
                                            style={{ ...styles.actionBtn, background: '#f8fafc', color: '#1e293b', border: '2px solid #e2e8f0' }}
                                        >
                                            🌐 Visit Website
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal removed as only Admin Dashboard handles official forwarding now */}
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', paddingBottom: '6rem' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' },

    header: { padding: '8rem 0 4rem', background: 'linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%)', textAlign: 'center' },
    title: { fontSize: '3rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-1px' },
    subtitle: { fontSize: '1.25rem', color: '#64748b', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3.5rem' },

    searchWrapper: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', borderRadius: '1.25rem', maxWidth: '600px', margin: '0 auto' },
    searchIcon: { fontSize: '1.25rem', opacity: 0.5 },
    searchInput: { flex: 1, border: 'none', background: 'transparent', fontSize: '1.1rem', outline: 'none', color: '#1e293b', fontWeight: 500 },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' },
    card: { padding: 0, overflow: 'hidden' },
    cardImgWrapper: { position: 'relative' },
    cardImg: { width: '100%', height: '220px', objectFit: 'cover' },
    cardIcon: { position: 'absolute', bottom: '-20px', right: '20px', background: 'white', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },

    cardContent: { padding: '2.5rem 2rem 2rem' },
    ngoName: { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' },
    ngoLoc: { fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '1.5rem' },

    focusLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' },
    focusVal: { fontSize: '1.1rem', fontWeight: 700, color: '#0ea5e9', marginBottom: '1.5rem' },
    divider: { height: '1px', background: '#f1f5f9', marginBottom: '1.5rem' },
    actionBtn: { width: '100%', justifyContent: 'center' },

    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: 'white', padding: '3rem', borderRadius: '2rem', width: '100%', maxWidth: '550px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
    modalTitle: { fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' },

    formSection: { marginBottom: '2rem' },
    formLabel: { display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase' },

    reportSelector: { background: '#f8fafc', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' },
    reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' },
    reportItem: { width: '100%', aspectRatio: '1', borderRadius: '0.75rem', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' },
    reportThumb: { width: '100%', height: '100%', objectFit: 'cover' },
    noData: { textAlign: 'center', color: '#94a3b8', padding: '1rem', fontSize: '0.9rem' },

    textArea: { width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' },

    successState: { textAlign: 'center' },
    successIcon: { fontSize: '4rem', marginBottom: '1rem' },
    successTitle: { fontSize: '2rem', fontWeight: 900, color: '#059669', marginBottom: '1rem' },
    successText: { color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6 }
};

export default NGOs;
