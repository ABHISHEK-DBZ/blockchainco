# Blue Carbon Registry Mobile App

A React Native mobile application for GPS-enabled field data collection with offline sync capabilities, designed for blue carbon ecosystem restoration projects.

## 🚀 Features

### 🗺️ Project Map
- Interactive Google Maps integration showing all restoration projects
- Real-time GPS location tracking
- Project boundaries visualization with different colors for status
- Quick navigation to project details and field data collection

### 📋 Task Management
- Role-based task assignment and tracking
- Priority-based task organization
- Status updates (pending, in progress, completed)
- Integration with field data collection workflows

### 📸 Field Data Collection
- GPS-enabled data collection with location accuracy
- Multiple image capture from camera or gallery
- Data type categorization (initial, monitoring, drone, field_survey)
- Rich metadata collection with timestamps

### 📡 Offline Sync
- Automatic offline data storage when network is unavailable
- Smart sync when connection is restored
- Manual sync controls with progress tracking
- Data integrity with retry mechanisms

### 🏠 Dashboard
- Project overview with status summaries
- Recent activity tracking
- Quick access to key functions
- User profile and role management

## 📱 App Screenshots

```
Dashboard → Map → Tasks → Field Data Collection → Offline Sync
   📊        🗺️     📋         📸                   📤
```

## 🛠️ Technical Stack

### Core Dependencies
- **React Native** 0.72+
- **React Navigation** 6.x (Stack & Tab Navigation)
- **React Native Maps** (Google Maps integration)
- **React Native Geolocation Service** (GPS tracking)
- **React Native Image Picker** (Camera & Gallery)
- **AsyncStorage** (Offline data persistence)
- **NetInfo** (Network connectivity monitoring)

### Backend Integration
- **JWT Authentication** with role-based access
- **REST API** for data synchronization
- **IPFS/Pinata** for decentralized file storage
- **SQLite** backend database

## 📁 Project Structure

```
mobileapp/
├── src/
│   ├── DashboardScreen.js          # Main dashboard with project overview
│   ├── ProjectMapScreen.js         # Interactive map with project locations
│   ├── TaskManagementScreen.js     # Task assignment and tracking
│   ├── FieldDataCollectionScreen.js # GPS-enabled data collection
│   ├── OfflineDataSyncScreen.js    # Offline data management
│   ├── LoginScreen.js              # User authentication
│   └── RegisterScreen.js           # User registration
├── App.tsx                         # Main navigation setup
├── package.json                    # Dependencies and scripts
└── README_MOBILE.md               # This documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- React Native CLI or Expo CLI
- Android Studio (for Android) / Xcode (for iOS)

### Installation
```bash
# Navigate to mobile app directory
cd mobileapp

# Install dependencies
npm install

# iOS only - install pods
cd ios && pod install && cd ..
```

### Running the App
```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

## 🔧 Configuration

### Google Maps Setup
1. Get API key from Google Cloud Console
2. Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY_HERE" />
```

### Required Permissions
- **Location**: GPS field data collection
- **Camera**: Photo documentation
- **Storage**: Offline data management
- **Internet**: Data synchronization

## 📱 Screen Details

### FieldDataCollectionScreen.js
**Purpose**: GPS-enabled field data collection with image capture

**Features**:
- ✅ Real-time GPS with accuracy display
- ✅ Camera & gallery image capture
- ✅ Data type categorization
- ✅ Offline storage with auto-sync
- ✅ Form validation & error handling

### ProjectMapScreen.js
**Purpose**: Interactive project visualization

**Features**:
- ✅ Google Maps with custom markers
- ✅ Project boundary polygons
- ✅ Status-based color coding
- ✅ Bottom sheet project details
- ✅ Quick navigation shortcuts

### TaskManagementScreen.js
**Purpose**: Field agent task management

**Features**:
- ✅ Role-based task filtering
- ✅ Priority & status management
- ✅ Statistics dashboard
- ✅ Field data collection integration
- ✅ Offline task updates

### OfflineDataSyncScreen.js
**Purpose**: Offline data management

**Features**:
- ✅ Offline data inventory
- ✅ Individual & batch sync
- ✅ Network status monitoring
- ✅ Data integrity validation
- ✅ Sync progress tracking

## 🔄 Data Flow

### Field Data Collection Process
1. **Location**: High-accuracy GPS acquisition
2. **Images**: Multiple photo capture with metadata
3. **Assembly**: Combine location, images, form data
4. **Network**: Check online/offline status
5. **Storage**: Direct upload or offline queue
6. **Feedback**: User confirmation of status

### Offline Sync Process
1. **Queue**: Maintain offline data queue
2. **Detection**: Monitor network changes
3. **Auto-sync**: Automatic when online
4. **Manual**: User-initiated operations
5. **Retry**: Exponential backoff logic
6. **Reporting**: Detailed progress feedback

## 🌐 API Integration

### Backend Endpoints
- `POST /field-data` - Upload field data with images
- `GET /tasks` - Retrieve assigned tasks
- `PUT /tasks/:id/status` - Update task status
- `GET /projects` - Fetch project locations

### IPFS Integration
- **Files**: Images → Pinata IPFS
- **Metadata**: JSON with IPFS hashes
- **Storage**: Decentralized documentation

## 🧪 Testing Checklist

### Manual Testing
- [ ] GPS accuracy in various environments
- [ ] Image capture & storage
- [ ] Offline data persistence
- [ ] Network transitions (online ↔ offline)
- [ ] Map interaction & project selection
- [ ] Task updates & sync
- [ ] Authentication flow

## 🚀 Deployment

### Android APK
```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/
```

### iOS App Store
1. Archive in Xcode
2. Upload to App Store Connect

## 🔧 Troubleshooting

### Common Issues

**GPS Not Working**
- ✅ Check location permissions
- ✅ Enable device GPS
- ✅ Test outdoors

**Images Not Uploading**
- ✅ Verify camera permissions
- ✅ Check network connectivity
- ✅ Validate IPFS config

**Offline Sync Failing**
- ✅ Check network status
- ✅ Verify auth tokens
- ✅ Review backend connectivity

### Debug Commands
```bash
# View logs
npx react-native log-android
npx react-native log-ios

# Reset cache
npx react-native start --reset-cache

# Clean build
cd android && ./gradlew clean
```

## 🤝 Contributing

1. Follow React Native coding standards
2. Test on both platforms
3. Verify offline functionality
4. Update documentation
5. Include error handling

## 📄 License

MIT License - See LICENSE file for details

---

**Blue Carbon Registry Mobile App** - Empowering field agents with GPS-enabled data collection for blue carbon ecosystem restoration projects.
