import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Share2, Download, Twitter, Facebook, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

const Profile = ({ apiUrl = 'http://localhost:8000' }) => {
    const { user: authUser, logout } = useAuth();
    const [user, setUser] = useState(authUser);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reports');
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
    const shareCardRef = useRef(null);

    // Client-side tier calculation (fallback if API doesn't return tier)
    const getTier = (points) => {
        points = points || 0;
        if (points >= 200) return { name: "Super Hero", icon: "🦸", color: "#7c3aed" };
        if (points >= 100) return { name: "Platinum", icon: "💎", color: "#e2e8f0" };
        if (points >= 50) return { name: "Gold", icon: "🥇", color: "#fbbf24" };
        if (points >= 20) return { name: "Silver", icon: "🥈", color: "#94a3b8" };
        if (points >= 10) return { name: "Bronze", icon: "🥉", color: "#d97706" };
        return { name: "Rookie", icon: "🌱", color: "#10b981" };
    };

    // Calculate tier from points (use API tier if available, otherwise calculate)
    const userTier = user?.tier || getTier(user?.points);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch fresh user data (with points and tier)
                const userRes = await axios.get(`${apiUrl}/api/auth/me`);
                console.log('API /me response:', userRes.data);
                setUser(userRes.data);

                // Fetch reports
                const reportsRes = await axios.get(`${apiUrl}/api/reports/my`);
                setReports(reportsRes.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl]);

    // Share message generator
    const getShareMessage = () => {
        return `🌊 I'm a ${userTier.name} ${userTier.icon} on Coastal Monitor!

🏆 Points: ${user?.points || 0}
📊 Reports submitted: ${reports.length}

Join me in protecting our oceans! Every report counts. 🌍💙

#CoastalMonitor #SaveOurOceans #BeachCleanup #OceanConservation`;
    };

    // Copy to clipboard
    const handleCopyShare = async () => {
        try {
            await navigator.clipboard.writeText(getShareMessage());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Show share modal
    const handleNativeShare = () => {
        setShowShareModal(true);
    };

    // Social media share URLs
    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareMessage())}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(getShareMessage())}`,
    };

    // Generate and download image
    const handleDownloadImage = async () => {
        if (!shareCardRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(shareCardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = `coastal-monitor-${userTier.name.toLowerCase()}-badge.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to generate image:', err);
        } finally {
            setGenerating(false);
        }
    };

    if (!user) return null;

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Profile Header */}
                <div className="premium-card" style={styles.profileHeader}>
                    <div style={styles.avatar}>
                        {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div style={styles.userInfo}>
                        <h1 style={styles.userName}>{user.full_name}</h1>
                        <p style={styles.userEmail}>{user.email}</p>
                        <div style={styles.badge}>
                            {user.role === 'admin' ? '🛡️ System Admin' : '🌊 Coastal Guardian'}
                        </div>
                    </div>
                </div>

                {/* Gamification Stats */}
                <div className="premium-card animate-slide-up" style={styles.gamificationParams}>
                    <div style={styles.tierHeader}>
                        <div style={styles.tierIcon}>{userTier.icon}</div>
                        <div style={styles.tierInfo}>
                            <h2 style={{ ...styles.tierTitle, color: userTier.color }}>
                                {userTier.name} Tier
                            </h2>
                            <p style={styles.pointsLabel}>You have earned <strong>{user.points || 0}</strong> points</p>
                        </div>
                    </div>
                    <div style={styles.pointsProgress}>
                        <div style={{
                            ...styles.progressBar,
                            width: `${Math.min(((user.points || 0) / 200) * 100, 100)}%`,
                            background: userTier.color
                        }} />
                    </div>
                    <p style={styles.nextGoal}>
                        Next Goal: {
                            (user.points || 0) < 10 ? 10 :
                                (user.points || 0) < 20 ? 20 :
                                    (user.points || 0) < 50 ? 50 :
                                        (user.points || 0) < 100 ? 100 : 200
                        } points
                    </p>

                    {/* Share Button */}
                    <button onClick={handleNativeShare} style={styles.shareButton}>
                        <Share2 size={18} />
                        <span>Share Achievement</span>
                    </button>
                </div>

                {/* Share Modal */}
                {showShareModal && (
                    <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
                        <div style={styles.shareModal} onClick={e => e.stopPropagation()} className="frosted-card-strong animate-scale-up">
                            <h3 style={styles.shareModalTitle}>Share Your Achievement 🎉</h3>

                            {/* Shareable Card - This gets captured as image */}
                            <div ref={shareCardRef} style={styles.shareableCard}>
                                <div style={styles.shareCardGradient}>
                                    <div style={styles.shareCardLogo}>🌊 Coastal Monitor</div>
                                    <div style={styles.shareCardTier}>
                                        <span style={styles.shareCardTierIcon}>{userTier.icon}</span>
                                        <div style={styles.shareCardTierText}>
                                            <span style={{ ...styles.shareCardTierName, color: userTier.color }}>{userTier.name}</span>
                                            <span style={styles.shareCardTierLabel}>TIER</span>
                                        </div>
                                    </div>
                                    <div style={styles.shareCardStats}>
                                        <div style={styles.shareCardStat}>
                                            <span style={styles.shareCardStatValue}>{user?.points || 0}</span>
                                            <span style={styles.shareCardStatLabel}>Points</span>
                                        </div>
                                        <div style={styles.shareCardDivider}></div>
                                        <div style={styles.shareCardStat}>
                                            <span style={styles.shareCardStatValue}>{reports.length}</span>
                                            <span style={styles.shareCardStatLabel}>Reports</span>
                                        </div>
                                    </div>
                                    <div style={styles.shareCardFooter}>
                                        <p style={styles.shareCardThankYou}>Thank you for protecting our oceans! 💙</p>
                                        <p style={styles.shareCardHashtags}>#CoastalMonitor #SaveOurOceans</p>
                                    </div>
                                </div>
                            </div>

                            {/* Share Options */}
                            <div style={styles.shareOptions}>
                                <button onClick={handleDownloadImage} disabled={generating} style={{ ...styles.shareOption, background: generating ? '#94a3b8' : '#10b981' }}>
                                    <Download size={20} /> {generating ? 'Generating...' : 'Download'}
                                </button>
                                <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer" style={{ ...styles.shareOption, background: '#1DA1F2' }}>
                                    <Twitter size={20} /> Twitter
                                </a>
                                <button onClick={handleCopyShare} style={{ ...styles.shareOption, background: copied ? '#10b981' : '#64748b' }}>
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            <p style={styles.shareHint}>📱 Download the image and share on Instagram!</p>

                            <button onClick={() => setShowShareModal(false)} style={styles.closeModalBtn}>
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={styles.tabContainer}>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'reports' ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab('reports')}
                    >
                        My Reports ({reports.length})
                    </button>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'settings' ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab('settings')}
                    >
                        Account Settings
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'reports' ? (
                    <div style={styles.reportsGrid}>
                        {loading ? (
                            <p>Loading your reports...</p>
                        ) : reports.length > 0 ? (
                            reports.map(report => (
                                <div key={report.id} className="premium-card" style={styles.reportCard}>
                                    <div style={styles.reportImageWrapper}>
                                        <img src={`${apiUrl}${report.image_path}`} alt="Pollution" style={styles.reportImage} />
                                        <div style={styles.statusBadge(report.status)}>
                                            {report.status || 'pending'}
                                        </div>
                                    </div>
                                    <div style={styles.reportContent}>
                                        <div style={styles.reportType}>{report.pollution_type.replace('_', ' ')}</div>
                                        <div style={styles.reportDate}>{new Date(report.created_at).toLocaleDateString()}</div>
                                        <p style={styles.reportDesc}>
                                            {report.description || "No description provided."}
                                        </p>
                                        {report.ngo_name && (
                                            <div style={styles.forwardInfo}>
                                                Forwarded to: <strong>{report.ngo_name}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={styles.emptyState}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                                <h3>No reports yet</h3>
                                <p>Help protect our oceans by reporting pollution you see.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="premium-card" style={styles.settingsCard}>
                        <h3>Profile Information</h3>
                        <div style={styles.infoRow}>
                            <label>Full Name</label>
                            <input type="text" value={user.full_name} readOnly style={styles.input} />
                        </div>
                        <div style={styles.infoRow}>
                            <label>Email Address</label>
                            <input type="email" value={user.email} readOnly style={styles.input} />
                        </div>
                        <div style={styles.infoRow}>
                            <label>Account Role</label>
                            <input type="text" value={user.role} readOnly style={styles.input} />
                        </div>
                        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => alert("Feature coming soon!")}>
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '2rem 1rem',
    },
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
    },
    profileHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        padding: '3rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    },
    avatar: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        fontWeight: 'bold',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: '2.5rem',
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: '0.25rem',
    },
    userEmail: {
        fontSize: '1.1rem',
        color: '#64748b',
        marginBottom: '1rem',
    },
    badge: {
        display: 'inline-block',
        padding: '0.35rem 1rem',
        background: 'rgba(14, 165, 233, 0.1)',
        color: '#0ea5e9',
        borderRadius: '2rem',
        fontSize: '0.9rem',
        fontWeight: '700',
    },
    tabContainer: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0.5rem',
    },
    tab: {
        background: 'none',
        border: 'none',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#64748b',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderRadius: '0.5rem',
    },
    activeTab: {
        color: '#0ea5e9',
        background: 'rgba(14, 165, 233, 0.05)',
    },
    reportsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
    },
    reportCard: {
        padding: 0,
        overflow: 'hidden',
    },
    reportImageWrapper: {
        position: 'relative',
        height: '200px',
    },
    reportImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    statusBadge: (status) => ({
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        background: status === 'resolved' ? '#dcfce7' : status === 'forwarded' ? '#dbeafe' : '#fef9c3',
        color: status === 'resolved' ? '#166534' : status === 'forwarded' ? '#1e40af' : '#854d0e',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    }),
    reportContent: {
        padding: '1.5rem',
    },
    reportType: {
        fontSize: '1.25rem',
        fontWeight: '800',
        color: '#0f172a',
        textTransform: 'capitalize',
        marginBottom: '0.25rem',
    },
    reportDate: {
        fontSize: '0.85rem',
        color: '#94a3b8',
        marginBottom: '1rem',
    },
    reportDesc: {
        fontSize: '0.95rem',
        color: '#475569',
        lineHeight: 1.5,
        marginBottom: '1rem',
    },
    forwardInfo: {
        fontSize: '0.85rem',
        padding: '0.75rem',
        background: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
    },
    emptyState: {
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '5rem 0',
        color: '#94a3b8',
    },
    settingsCard: {
        maxWidth: '600px',
    },
    infoRow: {
        marginBottom: '1.5rem',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        marginTop: '0.5rem',
        color: '#475569',
        fontWeight: '600',
        fontWeight: '600',
    },
    gamificationParams: {
        marginBottom: '2rem',
        padding: '2rem',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
    },
    tierHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '1rem',
    },
    tierIcon: {
        fontSize: '3.5rem',
        background: '#f8fafc',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tierInfo: {
        flex: 1,
    },
    tierTitle: {
        fontSize: '1.5rem',
        fontWeight: '800',
        marginBottom: '0.25rem',
    },
    pointsLabel: {
        color: '#64748b',
        fontSize: '1rem',
    },
    pointsProgress: {
        height: '10px',
        background: '#f1f5f9',
        borderRadius: '5px',
        overflow: 'hidden',
        marginBottom: '0.5rem',
    },
    progressBar: {
        height: '100%',
        transition: 'width 0.5s ease-out',
    },
    nextGoal: {
        textAlign: 'right',
        fontSize: '0.85rem',
        color: '#94a3b8',
        fontWeight: '600',
    },
    shareButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '1.5rem',
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '0.95rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
    },
    shareModal: {
        width: '100%',
        maxWidth: '420px',
        padding: '2rem',
        textAlign: 'center',
    },
    shareModalTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '1.5rem',
        color: '#0f172a',
    },
    sharePreview: {
        background: 'linear-gradient(135deg, #ecfeff, #e0f2fe)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(14, 165, 233, 0.2)',
    },
    sharePreviewHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem',
    },
    sharePreviewMsg: {
        margin: 0,
        fontSize: '1rem',
        color: '#0f172a',
        fontWeight: '500',
    },
    shareOptions: {
        display: 'flex',
        gap: '10px',
        marginBottom: '1rem',
    },
    shareOption: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '12px',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '0.85rem',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
    },
    shareHint: {
        fontSize: '0.9rem',
        color: '#64748b',
        marginBottom: '1rem',
    },
    closeModalBtn: {
        padding: '10px 32px',
        background: '#f1f5f9',
        color: '#475569',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    // Shareable Card Styles (for image generation)
    shareableCard: {
        width: '360px',
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    },
    shareCardGradient: {
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #06b6d4 100%)',
        padding: '24px',
        color: 'white',
    },
    shareCardLogo: {
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '20px',
        opacity: 0.9,
    },
    shareCardTier: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
    },
    shareCardTierIcon: {
        fontSize: '4rem',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
    },
    shareCardTierText: {
        display: 'flex',
        flexDirection: 'column',
    },
    shareCardTierName: {
        fontSize: '2rem',
        fontWeight: '800',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    shareCardTierLabel: {
        fontSize: '0.9rem',
        fontWeight: '600',
        letterSpacing: '3px',
        opacity: 0.8,
    },
    shareCardStats: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
    },
    shareCardStat: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    shareCardStatValue: {
        fontSize: '2rem',
        fontWeight: '800',
    },
    shareCardStatLabel: {
        fontSize: '0.8rem',
        fontWeight: '500',
        opacity: 0.8,
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    shareCardDivider: {
        width: '2px',
        height: '40px',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '1px',
    },
    shareCardFooter: {
        textAlign: 'center',
    },
    shareCardThankYou: {
        margin: 0,
        fontSize: '1rem',
        fontWeight: '500',
        marginBottom: '8px',
    },
    shareCardHashtags: {
        margin: 0,
        fontSize: '0.85rem',
        opacity: 0.7,
    }
};

export default Profile;
