import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { Share2, Download, X, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getBadge = (points) => {
    if (points >= 15) return { name: 'Gold Guardian', color: '#d97706', icon: '🥇' }; // Amber-600
    if (points >= 10) return { name: 'Silver Guardian', color: '#64748b', icon: '🥈' }; // Slate-500
    if (points >= 5) return { name: 'Bronze Guardian', color: '#b45309', icon: '🥉' }; // Amber-700
    return { name: 'New Recruit', color: '#3b82f6', icon: '🌱' }; // Blue-500
};

const REWARDS = [
    { id: 1, title: 'Digital Certificate', cost: 5, icon: '📜', color: '#3b82f6', desc: 'Official recognition of your contribution.' },
    { id: 2, title: 'Metal Straw Set', cost: 15, icon: '🥤', color: '#d97706', desc: 'Say no to plastic straws forever.' },
    { id: 3, title: 'Ocean Warrior T-Shirt', cost: 30, icon: '👕', color: '#0ea5e9', desc: 'Wear your commitment proudly.' },
    { id: 4, title: '$10 Ocean Donation', cost: 50, icon: '🌊', color: '#10b981', desc: 'We donate to cleanup NGOs in your name.' },
    { id: 5, title: 'Exclusive Hoodie', cost: 100, icon: '🧥', color: '#6366f1', desc: 'Premium sustainable cotton hoodie.' },
    { id: 6, title: 'Solar Power Bank', cost: 200, icon: '☀️', color: '#eab308', desc: 'Charge your devices with clean energy.' },
];

const Profile = ({ apiUrl = 'http://localhost:8000' }) => {
    const { user, logout, refreshUser } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reports');

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [badgeImageBlob, setBadgeImageBlob] = useState(null);
    const [badgeImageUrl, setBadgeImageUrl] = useState(null);

    useEffect(() => {
        if (refreshUser) refreshUser();
    }, [refreshUser]);

    useEffect(() => {
        const fetchMyReports = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/reports/my`);
                setReports(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching reports:", error);
                setLoading(false);
            }
        };

        fetchMyReports();
    }, [apiUrl]);

    const handleShare = async () => {
        const badgeElement = document.getElementById('share-badge');
        if (!badgeElement) return;

        // Temporarily show the badge for capture
        badgeElement.style.display = 'flex';

        try {
            const canvas = await html2canvas(badgeElement, {
                backgroundColor: null,
                scale: 2
            });

            // Hide it again
            badgeElement.style.display = 'none';

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setBadgeImageBlob(blob);
                    setBadgeImageUrl(url);
                    setShowShareModal(true);
                }
            }, 'image/png');

        } catch (err) {
            console.error('Badge generation failed', err);
            badgeElement.style.display = 'none';
        }
    };

    const downloadBadge = () => {
        if (!badgeImageUrl) return;
        const link = document.createElement('a');
        link.download = 'coastal-guardian-badge.png';
        link.href = badgeImageUrl;
        link.click();
    };

    const shareToSocial = (platform) => {
        const text = `I've earned ${user.points} points reporting coastal pollution with Coastal Guardian! 🌊 Join me in cleaning our oceans. #CoastalGuardian #OceanCleanup`;
        const url = encodeURIComponent(window.location.origin); // Or your app's public URL

        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
                break;
            case 'linkedin':
                // LinkedIn only allows sharing URL, not pre-filled text easily for personal profiles via API without SDK
                // But we can try the share article format
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
                break;
            default:
                return;
        }
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    const closeModal = () => {
        setShowShareModal(false);
        // Clean up URL object to prevent memory leaks
        if (badgeImageUrl) {
            URL.revokeObjectURL(badgeImageUrl);
            setBadgeImageUrl(null);
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
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={styles.badge}>
                                {user.role === 'admin' ? '🛡️ System Admin' : '🌊 Coastal Guardian'}
                            </div>
                            <div style={{ ...styles.badge, background: (getBadge(user.points || 0).color) + '15', color: getBadge(user.points || 0).color, border: `1px solid ${getBadge(user.points || 0).color}30` }}>
                                {getBadge(user.points || 0).icon} {getBadge(user.points || 0).name}
                            </div>
                            <div style={{ ...styles.badge, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                                💎 {user.points || 0} Points
                            </div>
                            <button onClick={handleShare} style={styles.shareBtn}>
                                📤 Share Impact
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hidden Badge for Sharing */}
                <div id="share-badge" style={styles.shareBadge}>
                    <div style={styles.shareBadgeInner}>
                        <div style={styles.shareBadgeHeader}>Coastal Guardian</div>
                        <div style={styles.shareBadgeAvatar}>{user.full_name?.charAt(0) || 'U'}</div>
                        <div style={styles.shareBadgeName}>{user.full_name}</div>
                        <div style={styles.shareBadgeRank}>{getBadge(user.points).name}</div>
                        <div style={styles.shareBadgePoints}>
                            <span>💎</span>
                            <span>{user.points || 0} Points</span>
                        </div>
                        <div style={styles.shareBadgeFooter}>Fighting for Cleaner Oceans</div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={styles.tabContainer}>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'reports' ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab('reports')}
                    >
                        My Reports ({reports.length})
                    </button>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'redeem' ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab('redeem')}
                    >
                        🎁 Redeem Rewards
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
                ) : activeTab === 'redeem' ? (
                    <div style={styles.rewardsGrid}>
                        {REWARDS.map(reward => {
                            const progress = Math.min(100, ((user.points || 0) / reward.cost) * 100);
                            const canRedeem = (user.points || 0) >= reward.cost;

                            return (
                                <div key={reward.id} className="premium-card" style={styles.rewardCard}>
                                    <div style={{ ...styles.rewardHeader, background: `${reward.color}15` }}>
                                        <div style={{ fontSize: '3rem' }}>{reward.icon}</div>
                                        <div style={{ ...styles.rewardBadge, color: reward.color, borderColor: `${reward.color}40` }}>
                                            {reward.cost} Points
                                        </div>
                                    </div>
                                    <div style={styles.rewardBody}>
                                        <h3 style={styles.rewardTitle}>{reward.title}</h3>
                                        <p style={styles.rewardDesc}>{reward.desc}</p>

                                        <div style={styles.progressContainer}>
                                            <div style={styles.progressBar}>
                                                <div style={{ ...styles.progressFill, width: `${progress}%`, background: reward.color }}></div>
                                            </div>
                                            <div style={styles.progressText}>
                                                {canRedeem ? 'Goal Reached!' : `${reward.cost - (user.points || 0)} more points needed`}
                                            </div>
                                        </div>

                                        <button
                                            className="btn-primary"
                                            style={{
                                                width: '100%',
                                                marginTop: '1rem',
                                                opacity: canRedeem ? 1 : 0.5,
                                                cursor: canRedeem ? 'pointer' : 'not-allowed',
                                                background: canRedeem ? '#0f172a' : '#cbd5e1'
                                            }}
                                            disabled={!canRedeem}
                                            onClick={() => alert(`Redemption request for "${reward.title}" sent!`)}
                                        >
                                            {canRedeem ? '🎉 Redeem Now' : '🔒 Locked'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
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

            {/* Share Modal */}
            {showShareModal && (
                <div style={styles.modalOverlay} onClick={closeModal} className="animate-fade-in">
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()} className="animate-slide-up">
                        <button style={styles.closeBtn} onClick={closeModal}>
                            <X size={24} />
                        </button>

                        <h2 style={styles.modalTitle}>Share Active Impact! 🌍</h2>
                        <p style={styles.modalSubtitle}>Inspire others by sharing your contribution.</p>

                        <div style={styles.previewContainer}>
                            {badgeImageUrl && <img src={badgeImageUrl} alt="Badge" style={styles.previewImage} />}
                        </div>

                        <div style={styles.shareActions}>
                            <button onClick={downloadBadge} style={styles.actionBtn}>
                                <Download size={20} /> Download Image
                            </button>

                            <div style={styles.socialRow}>
                                <button onClick={() => shareToSocial('twitter')} style={{ ...styles.socialBtn, background: '#1DA1F2', color: 'white' }}>
                                    <Twitter size={20} /> Twitter
                                </button>
                                <button onClick={() => shareToSocial('linkedin')} style={{ ...styles.socialBtn, background: '#0A66C2', color: 'white' }}>
                                    <Linkedin size={20} /> LinkedIn
                                </button>
                                <button onClick={() => shareToSocial('whatsapp')} style={{ ...styles.socialBtn, background: '#25D366', color: 'white' }}>
                                    <MessageCircle size={20} /> WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: 'transparent',
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
    shareBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 1rem',
        background: '#0f172a',
        color: 'white',
        borderRadius: '2rem',
        fontSize: '0.9rem',
        fontWeight: '700',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    shareBadge: {
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '400px',
        height: '500px',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
        display: 'none', // Hidden by default, toggled via JS
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '2rem',
    },
    shareBadgeInner: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
    },
    shareBadgeHeader: {
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        fontWeight: '800',
        color: '#64748b',
        marginBottom: '2rem',
    },
    shareBadgeAvatar: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        color: 'white',
        fontSize: '3.5rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)',
    },
    shareBadgeName: {
        fontSize: '2rem',
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: '0.25rem',
    },
    shareBadgeRank: {
        fontSize: '1.1rem',
        color: '#0ea5e9',
        fontWeight: '700',
        marginBottom: '1.5rem',
    },
    shareBadgePoints: {
        background: '#f0fdf4',
        color: '#15803d',
        padding: '0.75rem 2rem',
        borderRadius: '1rem',
        fontSize: '1.5rem',
        fontWeight: '800',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '3rem',
        border: '1px solid #bbf7d0',
    },
    shareBadgeFooter: {
        fontSize: '0.8rem',
        color: '#94a3b8',
        fontWeight: '600',
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
    },
    rewardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '2rem',
    },
    rewardCard: {
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    rewardHeader: {
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
    },
    rewardBadge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '2rem',
        background: 'white',
        border: '1px solid',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    rewardBody: {
        padding: '1.5rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    rewardTitle: {
        fontSize: '1.25rem',
        fontWeight: '800',
        marginBottom: '0.5rem',
        color: '#1e293b',
    },
    rewardDesc: {
        fontSize: '0.9rem',
        color: '#64748b',
        marginBottom: '1.5rem',
        flex: 1,
    },
    progressContainer: {
        marginBottom: '0.5rem',
    },
    progressBar: {
        height: '8px',
        background: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '0.5rem',
    },
    progressFill: {
        height: '100%',
        transition: 'width 0.5s ease-out',
    },
    progressText: {
        fontSize: '0.8rem',
        color: '#64748b',
        fontWeight: '600',
        textAlign: 'right',
    },

    // Modal Styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
    },
    modalContent: {
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        textAlign: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94a3b8',
        padding: '0.5rem',
        borderRadius: '50%',
        transition: 'all 0.2s',
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: '0.5rem',
    },
    modalSubtitle: {
        color: '#64748b',
        marginBottom: '1.5rem',
    },
    previewContainer: {
        background: '#f1f5f9',
        borderRadius: '1rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'center',
    },
    previewImage: {
        maxWidth: '100%',
        maxHeight: '300px',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    shareActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        background: '#0f172a',
        color: 'white',
        borderRadius: '0.75rem',
        fontWeight: '700',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    socialRow: {
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'center',
    },
    socialBtn: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        borderRadius: '0.75rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
    }
};

export default Profile;
