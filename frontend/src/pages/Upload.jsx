import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { InfinityLoader } from '../components/ui/loader-13';

const Upload = ({ apiUrl = 'http://localhost:8000' }) => {
    // State
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Inject custom styles for animations
    const animationStyles = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes pulse-blue {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .loader {
            display: inline-block;
            animation: spin 1s linear infinite;
        }
    `;
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [locationSource, setLocationSource] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationAddress, setLocationAddress] = useState('');

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Refs
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Handlers
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        handleFileSelection(file);
    };

    const handleFileSelection = (file) => {
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
            extractGPS(file);
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragEnter = (e) => {
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
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileSelection(file);
        }
    };

    // Camera Handlers
    const startCamera = async () => {
        setError(null);
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Could not access camera. Please check permissions.");
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                handleFileSelection(file);
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const fetchLocationName = async (lat, lon) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data && data.display_name) {
                // Shorten the address for display
                const parts = data.display_name.split(',').slice(0, 3).join(',');
                setLocationAddress(parts);
            }
        } catch (error) {
            console.error("Error fetching location name:", error);
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
                const lat = data.latitude.toFixed(6);
                const lon = data.longitude.toFixed(6);
                setLatitude(lat);
                setLongitude(lon);
                setLocationSource('exif');
                fetchLocationName(lat, lon);
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

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(6);
                const lon = pos.coords.longitude.toFixed(6);
                setLatitude(lat);
                setLongitude(lon);
                setLocationSource('browser');
                setError(null);
                fetchLocationName(lat, lon);
                setIsGettingLocation(false);
            },
            (err) => {
                setError("Could not get location. Please enter manually.");
                setIsGettingLocation(false);
            }
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
                    <style>{animationStyles}</style>
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
                                <label style={styles.label}>1. Snap or Upload Photo</label>
                                <div style={styles.uploadOptions}>
                                    <button type="button" onClick={startCamera} style={styles.optBtn}>
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
                                        ...(imagePreview ? styles.dropZoneActive : {}),
                                        ...(isDragging ? styles.dropZoneDrag : {})
                                    }}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {imagePreview ? (
                                        <div style={styles.previewContainer}>
                                            <img src={imagePreview} alt="Preview" style={styles.preview} />
                                            <button type="button" style={styles.removeBtn} onClick={() => { setImagePreview(null); setSelectedFile(null); }}>✕ Remove</button>
                                        </div>
                                    ) : (
                                        <div style={styles.dropContent}>
                                            <div style={styles.dropIcon}>{isDragging ? '📂' : '☁️'}</div>
                                            <p>{isDragging ? 'Drop image here' : 'Drag & drop, tap camera, or choose from gallery'}</p>
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
                                    <button
                                        type="button"
                                        onClick={getBrowserLocation}
                                        style={{
                                            ...styles.gpsBtn,
                                            ...(isGettingLocation ? styles.gpsBtnLoading : {})
                                        }}
                                        disabled={isGettingLocation}
                                    >
                                        {isGettingLocation ? (
                                            <span className="loader">↻</span>
                                        ) : '📍 GPS'}
                                    </button>
                                </div>
                                {locationAddress && (
                                    <div style={styles.addressTag}>
                                        📍 {locationAddress}
                                    </div>
                                )}
                                {locationSource && !locationAddress && (
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

                {/* Camera Modal */}
                {showCamera && (
                    <div style={styles.cameraModal}>
                        <div style={styles.cameraContent}>
                            <video ref={videoRef} autoPlay playsInline style={styles.videoPreview}></video>
                            <div style={styles.cameraControls}>
                                <button type="button" onClick={stopCamera} style={styles.closeCamBtn}>Close</button>
                                <button type="button" onClick={capturePhoto} style={styles.captureBtn}>⚪</button>
                                <div style={{ width: '60px' }}></div> {/* Spacer for alignment */}
                            </div>
                        </div>
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

    dropZone: { border: '2px dashed #cbd5e1', borderRadius: '1.25rem', padding: '1.5rem', background: '#f1f5f9', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'all 0.2s' },
    dropZoneActive: { borderStyle: 'solid', borderColor: '#0ea5e9', background: '#f0f9ff' },
    dropZoneDrag: { borderColor: '#10b981', background: '#ecfdf5', transform: 'scale(1.02)' },
    dropContent: { color: '#94a3b8' },
    dropIcon: { fontSize: '3rem', marginBottom: '1rem' },

    previewContainer: { position: 'relative', width: '100%' },
    preview: { width: '100%', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    removeBtn: { position: 'absolute', top: '10px', right: '10px', background: 'rgba(244, 63, 94, 0.9)', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },

    status: { fontSize: '0.85rem', color: '#0ea5e9', fontWeight: 600, marginTop: '0.75rem' },

    locRow: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem' },
    input: { padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, width: '100%' },
    gpsBtn: { padding: '1rem', borderRadius: '0.75rem', border: 'none', background: '#1e293b', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    gpsBtnLoading: { background: '#3b82f6', animation: 'pulse-blue 1.5s infinite' },
    sourceTag: { fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginTop: '0.5rem' },
    addressTag: { fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginTop: '0.5rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.5rem' },

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
    secondaryBtn: { padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', color: '#1e293b', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: '150px' },

    // Camera Modal Styles
    cameraModal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    cameraContent: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' },
    videoPreview: { width: '100%', height: '100%', objectFit: 'cover' },
    cameraControls: { position: 'absolute', bottom: '2rem', left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 2rem' },
    captureBtn: { width: '70px', height: '70px', borderRadius: '50%', background: 'white', border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,0,0,0.3)' },
    closeCamBtn: { color: 'white', background: 'rgba(0,0,0,0.5)', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }
};

export default Upload;
