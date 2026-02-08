import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Webcam from 'react-webcam';
import { useDropzone } from 'react-dropzone';
import { InfinityLoader } from '../components/ui/loader-13';

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

    // Refs
    const fileInputRef = useRef(null);
    const webcamRef = useRef(null);
    // Camera state
    const [showCamera, setShowCamera] = useState(false);

    // Handlers
    const handleFile = useCallback((file) => {
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
            extractGPS(file);
        }
    }, []);

    const handleFileChange = (e) => {
        handleFile(e.target.files[0]);
    };

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            handleFile(acceptedFiles[0]);
        }
    }, [handleFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
        noClick: false // Allow clicking to open file dialog
    });

    const captureCamera = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    handleFile(file);
                    setShowCamera(false);
                });
        }
    }, [webcamRef, handleFile]);

    // Paste handler
    useEffect(() => {
        const handlePaste = (e) => {
            if (e.clipboardData && e.clipboardData.items) {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                        const file = items[i].getAsFile();
                        handleFile(file);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFile]);

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

    if (isUploading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-300">
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <InfinityLoader className="text-blue-500" size={120} />
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-slate-800">Analyzing Report</h3>
                        <p className="text-slate-500 font-medium animate-pulse">Our AI is detecting pollution levels...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                            <div style={styles.successIcon}>
                                {uploadResult.label === 'no_waste' ? '✅' : '🎉'}
                            </div>
                            <h2 style={styles.successTitle}>
                                {uploadResult.label === 'no_waste' ? 'No Pollution Detected!' : 'Report Analyzed!'}
                            </h2>
                            {uploadResult.label === 'no_waste' && (
                                <p style={{ color: '#22c55e', fontWeight: 600, marginTop: '0.5rem' }}>
                                    Great news! This image doesn't appear to contain any waste or pollution.
                                </p>
                            )}
                        </div>

                        <div style={styles.resultBox} className="glass">
                            <div style={styles.resultMain}>
                                <div style={styles.resIcon}>{uploadResult.pollution_icon}</div>
                                <div style={styles.resContent}>
                                    <div style={styles.resLabel}>
                                        {uploadResult.label === 'no_waste' ? 'Classification' : 'Detected Pollutant'}
                                    </div>
                                    <div style={{ ...styles.resValue, color: uploadResult.pollution_color }}>
                                        {uploadResult.pollution_name}
                                    </div>
                                </div>
                            </div>
                            <div style={styles.resGrid}>
                                <div style={styles.resItem}>
                                    <span style={styles.resSmallLabel}>Confidence</span>
                                    <span style={{
                                        ...styles.resSmallVal,
                                        color: getConfidenceColor(uploadResult.confidence)
                                    }}>
                                        {getConfidenceLevel(uploadResult.confidence)}
                                    </span>
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

                            {/* Analysis Details Dropdown */}
                            {/* Analysis Details Dropdown */}
                            {uploadResult.analysis_details && (
                                <details style={styles.detailsSection} className="animate-fade-in">
                                    <summary style={styles.summaryHeader}>
                                        <span>🧠 View Model Analysis</span>
                                        <span style={styles.summaryIcon}>▼</span>
                                    </summary>
                                    <div style={styles.detailsContent}>
                                        <div style={styles.detailRow}>
                                            <div style={styles.detailLabel}>👁️ CLIP Vision</div>
                                            <div style={styles.detailValue}>
                                                {uploadResult.analysis_details.clip.label}
                                                <span style={styles.detailSub}>({(uploadResult.analysis_details.clip.confidence * 100).toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            )}
                        </div>

                        <div style={styles.actionGroup}>
                            <button onClick={resetForm} className="btn-primary" style={{ flex: 1 }}>
                                📸 Submit New
                            </button>
                            {uploadResult.label !== 'no_waste' && (
                                <Link to="/map" style={styles.secondaryBtn}>
                                    🗺️ View Map
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={styles.uploadCard} className="premium-card animate-slide-up">
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>1. Snap, Scan, or Upload</label>

                                <div {...getRootProps()} style={{
                                    ...styles.dropZone,
                                    ...(isDragActive ? styles.dropZoneActive : {}),
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}>
                                    <input {...getInputProps()} />

                                    {imagePreview ? (
                                        <div style={styles.previewContainer}>
                                            <img src={imagePreview} alt="Preview" style={styles.preview} />
                                            <button type="button" style={styles.removeBtn} onClick={(e) => {
                                                e.stopPropagation();
                                                setImagePreview(null);
                                                setSelectedFile(null);
                                            }}>✕ Remove</button>
                                        </div>
                                    ) : (
                                        <div style={styles.dropContent}>
                                            <div style={styles.dropIcon}>☁️</div>
                                            <p style={{ marginBottom: '1rem', fontWeight: 600, color: '#64748b' }}>
                                                Drag & Drop, Paste (Ctrl+V), or Click to Upload
                                            </p>

                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                                                <button type="button" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCamera(true);
                                                }} style={styles.optBtn}>
                                                    <span>📷</span> Use Camera
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {isExtracting && <div style={styles.status}>🕒 Analyzing image metadata...</div>}
                            </div>

                            {/* Camera Modal */}
                            {showCamera && (
                                <div style={styles.cameraModal}>
                                    <div style={styles.cameraContainer}>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            style={{ width: '100%', borderRadius: '1rem' }}
                                        />
                                        <div style={styles.cameraControls}>
                                            <button type="button" onClick={captureCamera} className="btn-primary" style={{ flex: 1 }}>
                                                📸 Capture
                                            </button>
                                            <button type="button" onClick={() => setShowCamera(false)} style={styles.secondaryBtn}>
                                                ✕ Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

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
        </div >
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
    successTitle: { fontSize: '2rem', fontWeight: 800 },
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
    secondaryBtn: { padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', color: '#1e293b', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: '150px', cursor: 'pointer', background: 'white' },

    cameraModal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    cameraContainer: { background: 'white', padding: '1rem', borderRadius: '1.5rem', width: '100%', maxWidth: '500px' },
    cameraControls: { display: 'flex', gap: '1rem', marginTop: '1rem' },

    // Details Section
    detailsSection: { marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' },
    summaryHeader: { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, color: '#475569', listStyle: 'none', padding: '0.5rem 0' },
    summaryIcon: { fontSize: '0.8rem', opacity: 0.5 },
    detailsContent: { padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', marginTop: '0.5rem', fontSize: '0.9rem' },
    detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
    detailLabel: { fontWeight: 600, color: '#64748b' },
    detailValue: { fontWeight: 700, color: '#0f172a' },
    detailSub: { fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.8rem' },
    detailDivider: { height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }
};

// Helper for confidence color
const getConfidenceColor = (conf) => {
    if (conf >= 0.85) return '#16a34a'; // High - Green
    if (conf >= 0.60) return '#d97706'; // Med - Amber
    return '#dc2626'; // Low - Red
};

// Helper for confidence text
const getConfidenceLevel = (conf) => {
    if (conf >= 0.85) return 'High';
    if (conf >= 0.60) return 'Medium';
    return 'Low';
};

export default Upload;
