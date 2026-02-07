import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AdminDashboard = ({ apiUrl }) => {
    const [reports, setReports] = useState([]);
    const [ngos, setNgos] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [adminNote, setAdminNote] = useState('');
    const [selectedNgo, setSelectedNgo] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reportsRes, ngosRes, statsRes] = await Promise.all([
                axios.get(`${apiUrl}/api/admin/reports`),
                axios.get(`${apiUrl}/api/ngos`),
                axios.get(`${apiUrl}/api/stats`)
            ]);
            setReports(reportsRes.data);
            setNgos(ngosRes.data);
            setStats(statsRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data:", error);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!selectedReport) return;

        try {
            await axios.patch(`${apiUrl}/api/admin/reports/${selectedReport.id}/status`, {
                status: newStatus,
                ngo_id: newStatus === 'forwarded' ? (selectedNgo || null) : null,
                admin_notes: adminNote
            });

            // Refresh data
            fetchData();
            setSelectedReport(null);
            setAdminNote('');
            setSelectedNgo('');
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
            return;
        }

        try {
            await axios.delete(`${apiUrl}/api/admin/reports/${id}`);
            // Refresh data
            fetchData();
            if (selectedReport?.id === id) {
                setSelectedReport(null);
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            alert("Failed to delete report");
        }
    };

    const handleResolve = async (id) => {
        // Automatically mark as resolved without confirmation for smoother workflow,
        // or add confirmation if preferred.
        // User asked: "click on remove reports option then do resolved +1"

        try {
            await axios.patch(`${apiUrl}/api/admin/reports/${id}/status`, {
                status: 'resolved'
            });
            // Refresh data to update stats
            fetchData();
        } catch (error) {
            console.error("Error resolving report:", error);
            alert("Failed to resolve report");
        }
    };

    const filteredReports = reports.filter(r =>
        filterStatus === 'all' ? true : r.status === filterStatus
    );

    if (loading) return <div style={styles.loading}>Loading Dashboard...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Admin Dashboard</h1>
                <div style={styles.statsRow}>
                    <StatCard title="Total Reports" value={stats?.total || 0} color="#0ea5e9" icon="📊" />
                    <StatCard title="Pending" value={stats?.by_status?.pending || 0} color="#f59e0b" icon="⏳" />
                    <StatCard title="Resolved" value={stats?.by_status?.resolved || 0} color="#10b981" icon="✅" />
                </div>
            </div>

            <div style={styles.contentGrid}>
                {/* Reports List */}
                <div className="frosted-card-strong" style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <h3>Recent Reports</h3>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={styles.select}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="forwarded">Forwarded</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map(report => (
                                    <tr key={report.id} style={styles.tr}>
                                        <td style={styles.td}>#{report.id}</td>
                                        <td style={styles.td}>
                                            <span style={styles.typeTag(report.pollution_type)}>
                                                {report.pollution_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.statusTag(report.status)}>
                                                {report.status || 'pending'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    style={styles.actionBtn}
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleResolve(report.id);
                                                    }}
                                                    style={{ ...styles.actionBtn, background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}
                                                >
                                                    Resolve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Map View */}
                <div className="frosted-card-strong" style={{ ...styles.mapCard, height: '600px', padding: 0, overflow: 'hidden' }}>
                    <MapContainer
                        center={[20.5937, 78.9629]}
                        zoom={4}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        {filteredReports.map(report => (
                            <Marker
                                key={report.id}
                                position={[report.latitude, report.longitude]}
                                eventHandlers={{
                                    click: () => setSelectedReport(report),
                                }}
                            >
                                <Popup>
                                    <strong>#{report.id} {report.pollution_type}</strong><br />
                                    Status: {report.status}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedReport && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <button onClick={() => setSelectedReport(null)} style={styles.closeBtn}>×</button>

                        <div style={styles.modalGrid}>
                            <div style={styles.modalImageSection}>
                                <img
                                    src={`${apiUrl}${selectedReport.image_path}`}
                                    alt="Pollution"
                                    style={styles.modalImage}
                                />
                                <div style={styles.modalMapMini}>
                                    <p>📍 {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}</p>
                                </div>
                            </div>

                            <div style={styles.modalInfo}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h2>Report #{selectedReport.id}</h2>
                                    <button
                                        onClick={() => handleDelete(selectedReport.id)}
                                        style={{ ...styles.btn, background: '#fee2e2', color: '#dc2626', flex: '0 0 auto', padding: '0.5rem 1rem', width: 'auto' }}
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                                <p style={styles.modalDate}>
                                    Submitted by: {selectedReport.user_name || 'Anonymous'} on {new Date(selectedReport.created_at).toLocaleString()}
                                </p>

                                <div style={styles.infoBlock}>
                                    <label>Description</label>
                                    <p>{selectedReport.description || "No description provided."}</p>
                                </div>

                                <div style={styles.infoBlock}>
                                    <label>AI Analysis</label>
                                    <div style={styles.tagsRow}>
                                        <span style={styles.typeTag(selectedReport.pollution_type)}>
                                            {selectedReport.pollution_type}
                                        </span>
                                        <span style={styles.confidenceTag}>
                                            {(selectedReport.confidence * 100).toFixed(1)}% Confidence
                                        </span>
                                    </div>
                                </div>

                                <div style={styles.actionSection}>
                                    <h3>Forward to NGO</h3>

                                    <div style={styles.formGroup}>
                                        <label>Admin Notes</label>
                                        <textarea
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Add instructions for the NGO team..."
                                            style={styles.textarea}
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label>Target Organization</label>
                                        <select
                                            value={selectedNgo}
                                            onChange={(e) => setSelectedNgo(e.target.value)}
                                            style={styles.select}
                                            disabled={selectedReport.status === 'resolved'}
                                        >
                                            <option value="">Select NGO...</option>
                                            {ngos.map(ngo => (
                                                <option key={ngo.id} value={ngo.id}>{ngo.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={styles.btnRow}>
                                        <button
                                            onClick={() => handleStatusUpdate('forwarded')}
                                            disabled={!selectedNgo}
                                            style={{ ...styles.btn, ...styles.btnPrimary, opacity: !selectedNgo ? 0.5 : 1 }}
                                        >
                                            🚀 Forward Now
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('resolved')}
                                            style={{ ...styles.btn, ...styles.btnSuccess }}
                                        >
                                            ✅ Resolve Locally
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, color, icon }) => (
    <div className="frosted-card" style={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <div>
                <div style={{ ...styles.statValue, color }}>{value}</div>
                <div style={styles.statTitle}>{title}</div>
            </div>
        </div>
    </div>
);

const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
    },
    header: {
        marginBottom: '2rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0891b2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
    },
    statCard: {
        textAlign: 'center',
        padding: '1.5rem',
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: '800',
        marginBottom: '0.5rem',
    },
    statTitle: {
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: '0.8rem',
        letterSpacing: '1px',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        '@media (max-width: 1024px)': {
            gridTemplateColumns: '1fr',
        },
    },
    tableCard: {
        overflow: 'hidden',
    },
    tableHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '1rem',
        borderBottom: '2px solid #e2e8f0',
        color: '#64748b',
        fontWeight: '600',
        fontSize: '0.9rem',
    },
    td: {
        padding: '1rem',
        borderBottom: '1px solid #f1f5f9',
        fontSize: '0.95rem',
    },
    tr: {
        cursor: 'pointer',
        transition: 'background 0.2s',
        '&:hover': {
            background: '#f8fafc',
        }
    },
    typeTag: (type) => ({
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.8rem',
        fontWeight: '600',
        background: type === 'plastic' ? '#fee2e2' : type === 'oil_spill' ? '#fef3c7' : '#e0f2fe',
        color: type === 'plastic' ? '#991b1b' : type === 'oil_spill' ? '#92400e' : '#075985',
        textTransform: 'capitalize',
    }),
    statusTag: (status) => ({
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.8rem',
        fontWeight: '600',
        background: status === 'resolved' ? '#dcfce7' : status === 'forwarded' ? '#dbeafe' : '#fef9c3',
        color: status === 'resolved' ? '#166534' : status === 'forwarded' ? '#1e40af' : '#854d0e',
        textTransform: 'capitalize',
    }),
    actionBtn: {
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid #cbd5e1',
        background: 'white',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: '700',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        background: 'white',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    closeBtn: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: '2rem',
        height: '2rem',
        borderRadius: '50%',
        border: 'none',
        background: 'white',
        fontSize: '1.5rem',
        cursor: 'pointer',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    modalGrid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 40%) 1fr',
        height: '100%',
        overflow: 'auto',
    },
    modalImageSection: {
        background: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
    },
    modalImage: {
        width: '100%',
        height: '400px',
        objectFit: 'cover',
    },
    modalMapMini: {
        padding: '1rem',
        borderTop: '1px solid #e2e8f0',
        background: 'white',
    },
    modalInfo: {
        padding: '2rem',
        overflowY: 'auto',
    },
    infoBlock: {
        margin: '1.5rem 0',
    },
    tagsRow: {
        display: 'flex',
        gap: '1rem',
        marginTop: '0.5rem',
    },
    confidenceTag: {
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.8rem',
        fontWeight: '600',
        background: '#f3f4f6',
        color: '#4b5563',
    },
    actionSection: {
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f8fafc',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
    },
    formGroup: {
        marginBottom: '1rem',
    },
    textarea: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #cbd5e1',
        borderRadius: '0.5rem',
        minHeight: '80px',
        fontFamily: 'inherit',
    },
    select: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #cbd5e1',
        borderRadius: '0.5rem',
        background: 'white',
    },
    btnRow: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem',
    },
    btn: {
        flex: 1,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    btnPrimary: {
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0891b2 100%)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
    },
    btnSuccess: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        padding: '4rem',
        fontSize: '1.2rem',
        color: '#64748b',
    }
};

export default AdminDashboard;
