import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function ProjectMapScreen({ navigation, route }) {
  const [projects, setProjects] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [region, setRegion] = useState({
    latitude: 19.0760, // Mumbai default
    longitude: 72.8777,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    requestLocationPermission();
    loadProjects();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Blue Carbon Registry needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      },
      (error) => {
        console.log('Location error:', error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadProjects = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://10.0.2.2:5000/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Load sample data for demonstration
      setProjects(sampleProjects);
    }
  };

  const sampleProjects = [
    {
      id: 1,
      name: 'Mangrove Restoration - Sundarbans',
      location: { latitude: 21.9497, longitude: 88.9470 },
      status: 'active',
      type: 'mangrove',
      area: 150,
      boundaries: [
        { latitude: 21.9497, longitude: 88.9470 },
        { latitude: 21.9510, longitude: 88.9490 },
        { latitude: 21.9490, longitude: 88.9510 },
        { latitude: 21.9480, longitude: 88.9480 },
      ],
    },
    {
      id: 2,
      name: 'Seagrass Protection - Goa',
      location: { latitude: 15.2993, longitude: 74.1240 },
      status: 'monitoring',
      type: 'seagrass',
      area: 75,
      boundaries: [
        { latitude: 15.2993, longitude: 74.1240 },
        { latitude: 15.3000, longitude: 74.1250 },
        { latitude: 15.2985, longitude: 74.1260 },
        { latitude: 15.2980, longitude: 74.1235 },
      ],
    },
    {
      id: 3,
      name: 'Salt Marsh Conservation - Gujarat',
      location: { latitude: 23.0225, longitude: 72.5714 },
      status: 'planning',
      type: 'saltmarsh',
      area: 200,
      boundaries: [
        { latitude: 23.0225, longitude: 72.5714 },
        { latitude: 23.0240, longitude: 72.5730 },
        { latitude: 23.0210, longitude: 72.5740 },
        { latitude: 23.0200, longitude: 72.5720 },
      ],
    },
  ];

  const getMarkerColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'monitoring': return '#FF9800';
      case 'planning': return '#2196F3';
      case 'completed': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getEcosystemIcon = (type) => {
    switch (type) {
      case 'mangrove': return '🌿';
      case 'seagrass': return '🌾';
      case 'saltmarsh': return '🌱';
      default: return '🌊';
    }
  };

  const navigateToProject = (project) => {
    navigation.navigate('ProjectDetails', { projectId: project.id });
  };

  const navigateToFieldData = (project) => {
    navigation.navigate('FieldDataCollection', { projectId: project.id });
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Project Markers and Boundaries */}
        {projects.map((project) => (
          <React.Fragment key={project.id}>
            {/* Project Boundary */}
            {project.boundaries && (
              <Polygon
                coordinates={project.boundaries}
                fillColor={`${getMarkerColor(project.status)}40`}
                strokeColor={getMarkerColor(project.status)}
                strokeWidth={2}
              />
            )}

            {/* Project Marker */}
            <Marker
              coordinate={project.location}
              title={project.name}
              description={`${project.type} - ${project.area} hectares`}
              pinColor={getMarkerColor(project.status)}
              onPress={() => setSelectedProject(project)}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Project Status</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Active</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Monitoring</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Planning</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
      </View>

      {/* Project Details Bottom Sheet */}
      {selectedProject && (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.projectName}>
              {getEcosystemIcon(selectedProject.type)} {selectedProject.name}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedProject(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.projectInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{selectedProject.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getMarkerColor(selectedProject.status) }]}>
                <Text style={styles.statusText}>{selectedProject.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Area:</Text>
              <Text style={styles.infoValue}>{selectedProject.area} hectares</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>
                {selectedProject.location.latitude.toFixed(4)}, {selectedProject.location.longitude.toFixed(4)}
              </Text>
            </View>
          </View>

          <View style={styles.projectActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => navigateToProject(selectedProject)}
            >
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigateToFieldData(selectedProject)}
            >
              <Text style={styles.actionButtonText}>Collect Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.quickActionText}>📍</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('TaskManagement')}
        >
          <Text style={styles.quickActionText}>📋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('OfflineDataSync')}
        >
          <Text style={styles.quickActionText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  projectInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  projectActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  quickActions: {
    position: 'absolute',
    left: 10,
    bottom: 100,
    flexDirection: 'column',
  },
  quickActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 20,
  },
});
