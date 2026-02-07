import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const markerColors = {
    plastic: '#ef4444',
    oil_spill: '#1f2937',
    other_solid_waste: '#92400e',
    marine_debris: '#0ea5e9',
};

const FitBounds = ({ reports }) => {
    const map = useMap();
    useEffect(() => {
        if (reports?.length > 0) {
            const bounds = L.latLngBounds(reports.map(r => [r.latitude, r.longitude]));
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 12 });
        }
    }, [reports, map]);
    return null;
};

const MapView = ({ apiUrl = 'http://localhost:8000' }) => {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reportsRes, statsRes] = await Promise.all([
                fetch(`${apiUrl}/api/reports`),
                fetch(`${apiUrl}/api/stats`)
            ]);
            const reportsData = await reportsRes.json();
            const statsData = await statsRes.json();

            // Backend returns direct list/dict, not wrapped in {success, reports}
            setReports(Array.isArray(reportsData) ? reportsData : []);
            setStats(statsData);
        } catch (err) {
            console.error('Map data sync failed');
        } finally {
            setLoading(false);
        }
    };

    const createMarkerIcon = (color) => L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:4px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

    const filtered = filter === 'all' ? reports : reports.filter(r => r.pollution_type === filter);

    return (
        <div style={styles.page}>
            {/* Header Control Panel */}
            <div style={styles.overlayTop} className="glass">
                <div style={styles.panelHeader}>
                    <div style={styles.titleGroup}>
                        <h2 style={styles.panelTitle}>Pollution Hotspots</h2>
                        <span style={styles.pulseBadge}>LIVE MONITORING</span>
                    </div>
                    <button onClick={fetchData} style={styles.refreshBtn}>
                        {loading ? 'SYNCING...' : 'REFRESH'}
                    </button>
                </div>

                <div style={styles.filterBar}>
                    <button
                        style={{ ...styles.filterBtn, ...(filter === 'all' ? styles.filterBtnActive : {}) }}
                        onClick={() => setFilter('all')}
                    >
                        ALL ({reports.length})
                    </button>
                    {stats && Object.entries(stats.by_type).map(([type, count]) => (
                        <button
                            key={type}
                            style={{
                                ...styles.filterBtn,
                                ...(filter === type ? styles.filterBtnActive : {}),
                                borderBottomColor: markerColors[type]
                            }}
                            onClick={() => setFilter(type)}
                        >
                            {type.replace('_', ' ').toUpperCase()} ({count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Map Container */}
            <MapContainer center={[20, 78]} zoom={5} style={styles.map}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                />

                {filtered.length > 0 && <FitBounds reports={filtered} />}

                {filtered.map(r => (
                    <Marker
                        key={r.id}
                        position={[r.latitude, r.longitude]}
                        icon={createMarkerIcon(markerColors[r.pollution_type] || r.pollution_color)}
                    >
                        <Popup className="premium-popup">
                            <div style={styles.popupCard}>
                                <img src={`${apiUrl}${r.image_path}`} alt="Pollution" style={styles.popupImg} />
                                <div style={styles.popupContent}>
                                    <div style={styles.popupHeader}>
                                        <span style={styles.popupIcon}>{r.pollution_icon || '🌊'}</span>
                                        <h3 style={styles.popupTitle}>{r.pollution_name || r.pollution_type}</h3>
                                    </div>
                                    <div style={styles.popupMeta}>
                                        <div>📅 {new Date(r.created_at).toLocaleDateString()}</div>
                                        <div>📊 {Math.round(r.confidence * 100)}% Match</div>
                                    </div>
                                    {r.description && <p style={styles.popupDesc}>"{r.description}"</p>}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Bottom Floating Stats */}
            <div style={styles.overlayBottom} className="glass">
                <div style={styles.miniStat}>
                    <div style={styles.miniVal}>{filtered.length}</div>
                    <div style={styles.miniLabel}>Reports in View</div>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.miniStat}>
                    <div style={styles.miniVal}>{stats?.total || 0}</div>
                    <div style={styles.miniLabel}>Global Incidents</div>
                </div>
            </div>

            <style>{`
                .leaflet-container { font-family: 'Inter', sans-serif; }
                .premium-popup .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 1rem; }
                .premium-popup .leaflet-popup-content { margin: 0; width: 280px !important; }
                .leaflet-popup-tip-container { display: none; }
            `}</style>
        </div>
    );
};

const styles = {
    page: { height: 'calc(100vh - 80px)', position: 'relative', background: '#f8fafc' },
    map: { width: '100%', height: '100%', zIndex: 1 },

    overlayTop: { position: 'absolute', top: '2rem', left: '2rem', right: '2rem', zIndex: 1000, padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '1rem' },
    panelTitle: { fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' },
    pulseBadge: { background: '#fef2f2', color: '#ef4444', fontSize: '0.65rem', fontWeight: 900, padding: '0.35rem 0.75rem', borderRadius: '1rem', letterSpacing: '1px' },
    refreshBtn: { background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' },

    filterBar: { display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' },
    filterBtn: { background: 'rgba(0,0,0,0.03)', border: 'none', borderBottom: '3px solid transparent', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' },
    filterBtnActive: { background: 'white', borderBottomWidth: '3px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },

    overlayBottom: { position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: '2rem', padding: '1rem 3rem', borderRadius: '3rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' },
    miniStat: { textAlign: 'center' },
    miniVal: { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 },
    miniLabel: { fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: '0.25rem' },
    divider: { width: '1px', background: '#e2e8f0', height: '30px', alignSelf: 'center' },

    popupCard: { overflow: 'hidden' },
    popupImg: { width: '100%', height: '160px', objectFit: 'cover' },
    popupContent: { padding: '1.25rem' },
    popupHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
    popupIcon: { fontSize: '2rem', background: '#f8fafc', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    popupTitle: { fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b' },
    popupMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, padding: '0.75rem 0', borderTop: '1px solid #f1f5f9', marginBottom: '0.75rem' },
    popupDesc: { margin: 0, fontSize: '0.85rem', color: '#4b5563', fontStyle: 'italic', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem' }
};

export default MapView;
