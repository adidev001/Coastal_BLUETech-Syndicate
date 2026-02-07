/**
 * 🌊 Ocean Waves Component
 * Beautiful animated ocean waves for a coastal theme
 */

import React from 'react';

const OceanWaves = ({ variant = 'bottom', showBubbles = true, showFoam = true }) => {
    if (variant === 'full') {
        return (
            <div className="ocean-bg-full">
                <div className="wave wave-3"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-1"></div>
                {showBubbles && (
                    <div className="bubbles">
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                    </div>
                )}
                <div className="water-shimmer"></div>
            </div>
        );
    }

    return (
        <div className="ocean-bg">
            <div className="wave wave-3"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-1"></div>
            {showFoam && (
                <div className="foam">
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                    <div className="foam-particle"></div>
                </div>
            )}
            {showBubbles && (
                <div className="bubbles">
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                </div>
            )}
            <div className="water-shimmer"></div>
        </div>
    );
};

// Wave Divider for section breaks
export const WaveDivider = ({ flip = false, color = '#f8fafc' }) => (
    <div className={`wave-divider ${flip ? 'wave-divider-top' : ''}`}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
                fill={color}
                d="M0,64 C120,100 240,20 360,50 C480,80 600,110 720,90 C840,70 960,30 1080,50 C1200,70 1320,110 1440,80 L1440,120 L0,120 Z"
            >
                <animate
                    attributeName="d"
                    dur="10s"
                    repeatCount="indefinite"
                    values="
                        M0,64 C120,100 240,20 360,50 C480,80 600,110 720,90 C840,70 960,30 1080,50 C1200,70 1320,110 1440,80 L1440,120 L0,120 Z;
                        M0,80 C120,40 240,100 360,70 C480,40 600,20 720,60 C840,100 960,80 1080,40 C1200,20 1320,60 1440,100 L1440,120 L0,120 Z;
                        M0,64 C120,100 240,20 360,50 C480,80 600,110 720,90 C840,70 960,30 1080,50 C1200,70 1320,110 1440,80 L1440,120 L0,120 Z
                    "
                />
            </path>
        </svg>
    </div>
);

// Animated Header with Ocean Theme
export const OceanHeader = ({ children, height = '300px' }) => (
    <div className="ocean-header" style={{ minHeight: height, position: 'relative', padding: '4rem 2rem' }}>
        {children}
        <div className="wave-svg-container">
            <svg className="wave-svg wave-svg-1" viewBox="0 0 1440 120" preserveAspectRatio="none">
                <path d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,80 1440,64 L1440,120 L0,120 Z" />
            </svg>
            <svg className="wave-svg wave-svg-2" viewBox="0 0 1440 120" preserveAspectRatio="none">
                <path d="M0,96 C180,40 360,100 540,80 C720,60 900,100 1080,80 C1260,60 1380,100 1440,80 L1440,120 L0,120 Z" />
            </svg>
        </div>
    </div>
);

export default OceanWaves;
