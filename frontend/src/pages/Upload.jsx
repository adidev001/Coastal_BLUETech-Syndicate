import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Upload = ({ apiUrl = 'http://localhost:8000' }) => {
    // State
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [locationSource, setLocationSource] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Handlers
    const processFile = (file) => {
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
            extractGPS(file);
        }
    };

    const handleFileChange = (e) => {
        processFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const extractGPS = async (file) => {
        setIsExtracting(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${apiUrl}/api/extract-gps`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.has_gps) {
                setLatitude(data.latitude.toFixed(6));
                setLongitude(data.longitude.toFixed(6));
                setLocationSource('exif');
            }
        } catch (err) {
            console.error('GPS extraction failed');
        } finally {
            setIsExtracting(false);
        }
    };

    const getBrowserLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toFixed(6));
                setLongitude(pos.coords.longitude.toFixed(6));
                setLocationSource('browser');
                setError(null);
            },
            (err) => setError("Could not get location. Please enter manually.")
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);
        formData.append('description', description);

        try {
            const res = await axios.post(`${apiUrl}/api/upload`, formData);
            const data = res.data; // axios returns data in .data
            if (data.success) {
                setUploadResult(data.report || data);
            } else {
                setError(data.message || 'Upload failed');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Server connection error. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setLatitude('');
        setLongitude('');
        setDescription('');
        setUploadResult(null);
        setError(null);
        setLocationSource(null);
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header} className="animate-fade-in">
                    <h1 style={styles.title}>Submit Report</h1>
                    <p style={styles.subtitle}>Our AI will analyze your photo and map the findings</p>
                </div>

                {uploadResult ? (
                    <div style={styles.successCard} className="premium-card animate-slide-up">
                        <div style={styles.successHeader}>
                            <div style={styles.successIcon}>🎉</div>
                            <h2 style={styles.successTitle}>Thank You!</h2>
                            <p style={styles.successSubtitle}>Thanks for being a responsible citizen 🌍</p>
                            <div style={styles.pointsBadge}>+1 Point Earned 🏆</div>
                        </div>

                        <div style={styles.resultBox} className="glass">
                            <div style={styles.resultMain}>
                                <div style={styles.resIcon}>{uploadResult.pollution_icon}</div>
                                <div style={styles.resContent}>
                                    <div style={styles.resLabel}>Detected Pollutant</div>
                                    <div style={{ ...styles.resValue, color: uploadResult.pollution_color }}>
                                        {uploadResult.pollution_name}
                                    </div>
                                </div>
                            </div>
                            <div style={styles.resGrid}>
                                <div style={styles.resItem}>
                                    <span style={styles.resSmallLabel}>Confidence</span>
                                    <span style={styles.resSmallVal}>{uploadResult.confidence ? (uploadResult.confidence * 100).toFixed(1) : '0'}%</span>
                                </div>
                                <div style={styles.resItem}>
                                    <span style={styles.resSmallLabel}>Latitude</span>
                                    <span style={styles.resSmallVal}>{uploadResult.latitude ? uploadResult.latitude.toFixed(4) : '0.0000'}</span>
                                </div>
                                <div style={styles.resItem}>
                                    <span style={styles.resSmallLabel}>Longitude</span>
                                    <span style={styles.resSmallVal}>{uploadResult.longitude ? uploadResult.longitude.toFixed(4) : '0.0000'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={styles.actionGroup}>
                            <button onClick={resetForm} className="btn-primary" style={{ flex: 1 }}>
                                📸 Submit New
                            </button>
                            <Link to="/map" style={styles.secondaryBtn}>
                                🗺️ View Map
                            </Link>

                        </div>
                    </div>
                ) : (
                    <div style={styles.uploadCard} className="premium-card animate-slide-up">
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>1. Snap or Upload Photo</label>
                                <div style={styles.uploadOptions}>
                                    <button type="button" onClick={() => cameraInputRef.current.click()} style={styles.optBtn}>
                                        <span>📷</span> Camera
                                    </button>
                                    <button type="button" onClick={() => fileInputRef.current.click()} style={styles.optBtn}>
                                        <span>📁</span> Gallery
                                    </button>
                                </div>

                                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

                                <div
                                    style={{
                                        ...styles.dropZone,
                                        ...(isDragging || imagePreview ? styles.dropZoneActive : {})
                                    }}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {imagePreview ? (
                                        <div style={styles.previewContainer}>
                                            <img src={imagePreview} alt="Preview" style={styles.preview} />
                                            <button type="button" style={styles.removeBtn} onClick={(e) => {
                                                e.stopPropagation(); // Prevent drop event propagation if button clicked
                                                setImagePreview(null);
                                                setSelectedFile(null);
                                            }}>✕ Remove</button>
                                        </div>
                                    ) : (
                                        <div style={styles.dropContent}>
                                            <div style={styles.dropIcon}>
                                                {isDragging ? '📂' : '☁️'}
                                            </div>
                                            <p>{isDragging ? 'Drop image here' : 'Tap camera or drag & drop image here'}</p>
                                        </div>
                                    )}
                                </div>
                                {isExtracting && <div style={styles.status}>🕒 Analyzing image metadata...</div>}
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>2. Verify Location</label>
                                <div style={styles.locRow}>
                                    <input placeholder="Lat" value={latitude} readOnly style={styles.input} />
                                    <input placeholder="Lng" value={longitude} readOnly style={styles.input} />
                                    <button type="button" onClick={getBrowserLocation} style={styles.gpsBtn}>📍 GPS</button>
                                </div>
                                {locationSource && (
                                    <div style={styles.sourceTag}>
                                        Source: {locationSource === 'exif' ? 'Photo Metadata' : 'Browser GPS'}
                                    </div>
                                )}
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>3. Additional Context (Optional)</label>
                                <textarea
                                    placeholder="Tell us more about the pollution incident..."
                                    style={styles.textArea}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {error && <div style={styles.error}>{error}</div>}

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', padding: '1.25rem', marginTop: '1rem', justifyContent: 'center' }}
                                disabled={isUploading || !selectedFile || !latitude}
                            >
                                {isUploading ? '⚡ AI Processing...' : '🚀 Submit Report'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '6rem 1rem' },
    container: { maxWidth: '600px', margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: '3rem' },
    title: { fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' },
    subtitle: { color: '#64748b' },

    uploadCard: { padding: '2.5rem' },
    formGroup: { marginBottom: '2rem' },
    label: { display: 'block', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', color: '#1e293b', letterSpacing: '1px', marginBottom: '1rem' },

    uploadOptions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
    optBtn: { padding: '0.75rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },

    dropZone: { border: '2px dashed #cbd5e1', borderRadius: '1.25rem', padding: '1.5rem', background: '#f1f5f9', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    dropZoneActive: { borderStyle: 'solid', borderColor: '#0ea5e9', background: '#f0f9ff' },
    dropContent: { color: '#94a3b8' },
    dropIcon: { fontSize: '3rem', marginBottom: '1rem' },

    previewContainer: { position: 'relative', width: '100%' },
    preview: { width: '100%', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    removeBtn: { position: 'absolute', top: '10px', right: '10px', background: 'rgba(244, 63, 94, 0.9)', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },

    status: { fontSize: '0.85rem', color: '#0ea5e9', fontWeight: 600, marginTop: '0.75rem' },

    locRow: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem' },
    input: { padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, width: '100%' },
    gpsBtn: { padding: '1rem', borderRadius: '0.75rem', border: 'none', background: '#1e293b', color: 'white', fontWeight: 700, cursor: 'pointer' },
    sourceTag: { fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginTop: '0.5rem' },

    textArea: { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', minHeight: '100px', outline: 'none', fontFamily: 'inherit' },
    error: { background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 },

    // Success Card
    successHeader: { textAlign: 'center', marginBottom: '2rem' },
    successIcon: { fontSize: '4rem', marginBottom: '1rem' },
    successTitle: { fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' },
    successSubtitle: { fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginBottom: '1rem' },
    pointsBadge: {
        display: 'inline-block',
        padding: '0.5rem 1.5rem',
        background: '#fffbeb',
        color: '#d97706',
        borderRadius: '2rem',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        border: '2px solid #fcd34d'
    },
    resultBox: { padding: '2rem', borderRadius: '1.5rem', marginBottom: '2rem' },
    resultMain: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '2rem' },
    resIcon: { fontSize: '4rem', background: 'white', width: '80px', height: '80px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    resContent: { textAlign: 'left' },
    resLabel: { fontSize: '0.8rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' },
    resValue: { fontSize: '2rem', fontWeight: 900 },
    resGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' },
    resItem: { textAlign: 'center' },
    resSmallLabel: { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' },
    resSmallVal: { fontWeight: 800, fontSize: '1rem' },

    actionGroup: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
    secondaryBtn: { padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', color: '#1e293b', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: '150px' }
};

export default Upload;
