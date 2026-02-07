# 🌊 Coastal Pollution Monitor - Frontend

React-based frontend for the Coastal Pollution Monitoring application.

## 📋 Features

- **Home Page**: Attractive landing page with project overview
- **Upload Page**: Submit pollution reports with image and GPS
- **Map Page**: Interactive map showing all reports
- **Responsive Design**: Works on mobile and desktop

## 🛠️ Tech Stack

- **React 18** - UI framework
- **React Router** - Client-side routing
- **Leaflet** - Interactive maps (no API key required!)
- **Axios** - HTTP client for API calls

## 📁 File Structure

```
frontend/
├── public/
│   └── index.html        # HTML template with SEO tags
├── src/
│   ├── index.js         # React entry point
│   ├── index.css        # Global styles & design system
│   ├── App.js           # Main app with routing
│   ├── components/
│   │   └── Navbar.jsx   # Navigation bar
│   └── pages/
│       ├── Home.jsx     # Landing page
│       ├── Upload.jsx   # Upload form
│       └── Map.jsx      # Map view
└── package.json
```

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API URL (Optional)

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm start
```

Opens at: **http://localhost:3000**

## 🔗 API Connection

The frontend connects to the backend at `http://localhost:8000` by default.

Make sure the backend is running before using the frontend!

## 📱 Pages

### Home (`/`)
- Hero section with ocean theme
- Feature highlights
- Pollution type descriptions
- Call-to-action buttons

### Upload (`/upload`)
- Drag & drop image upload
- GPS location capture
- Optional description
- Real-time classification results

### Map (`/map`)
- Interactive Leaflet map
- Color-coded markers by type
- Clickable popups with details
- Statistics panel
- Filtering by type

## 🎨 Design System

The app uses a custom CSS design system with:
- Ocean blue color palette (#0891b2, #06b6d4)
- Inter font family
- CSS custom properties for theming
- Responsive breakpoints
- Smooth animations

## 🐛 Troubleshooting

### Map not loading
- Check internet connection (OpenStreetMap tiles)
- Refresh the page

### Images not showing
- Verify backend is running
- Check CORS configuration

### GPS not working
- Allow location permission in browser
- Use HTTPS in production

## 📦 Build for Production

```bash
npm run build
```

Creates optimized build in `build/` folder.
