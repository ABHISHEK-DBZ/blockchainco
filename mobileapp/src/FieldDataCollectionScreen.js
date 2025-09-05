import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export default function FieldDataCollectionScreen({ navigation, route }) {
  const [projectId, setProjectId] = useState(route.params?.projectId || '');
  const [dataType, setDataType] = useState('monitoring'); // initial, monitoring, drone, field_survey
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    getCurrentLocation();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Blue Carbon Registry needs access to your location for field data collection.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.log('Location error:', error.code, error.message);
        Alert.alert('Location Error', 'Unable to get current location. Please enable GPS.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const selectImage = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        const newImage = {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          fileName: response.assets[0].fileName,
          timestamp: Date.now(),
          location: location,
        };
        setImages([...images, newImage]);
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets) {
        const newImages = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
          timestamp: Date.now(),
          location: location,
        }));
        setImages([...images, ...newImages]);
      }
    });
  };

  const saveDataOffline = async (data) => {
    try {
      const existingData = await AsyncStorage.getItem('offline_field_data');
      const offlineData = existingData ? JSON.parse(existingData) : [];
      offlineData.push({
        ...data,
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem('offline_field_data', JSON.stringify(offlineData));
      Alert.alert('Data Saved Offline', 'Your field data has been saved and will be synced when online.');
    } catch (error) {
      console.error('Error saving offline data:', error);
      Alert.alert('Error', 'Failed to save data offline.');
    }
  };

  const uploadFieldData = async () => {
    if (!projectId || !description || images.length === 0) {
      Alert.alert('Missing Information', 'Please fill all fields and add at least one image.');
      return;
    }

    setUploading(true);

    const fieldData = {
      projectId,
      dataType,
      description,
      location,
      images,
      timestamp: new Date().toISOString(),
    };

    if (!isOnline) {
      await saveDataOffline(fieldData);
      setUploading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('data_type', dataType);
      formData.append('description', description);
      formData.append('location', JSON.stringify(location));

      // Add images to FormData
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type,
          name: image.fileName || `field_image_${index}.jpg`,
        });
      });

      const response = await fetch('http://10.0.2.2:5000/field-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Success', 'Field data uploaded successfully!');
        
        // Clear form
        setDescription('');
        setImages([]);
        getCurrentLocation();
        
        navigation.goBack();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Save offline if upload fails
      await saveDataOffline(fieldData);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Field Data Collection</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Project ID</Text>
        <TextInput
          style={styles.input}
          value={projectId}
          onChangeText={setProjectId}
          placeholder="Enter project ID"
        />

        <Text style={styles.label}>Data Type</Text>
        <View style={styles.dataTypeContainer}>
          {['initial', 'monitoring', 'drone', 'field_survey'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.dataTypeButton, dataType === type && styles.selectedDataType]}
              onPress={() => setDataType(type)}
            >
              <Text style={[styles.dataTypeText, dataType === type && styles.selectedDataTypeText]}>
                {type.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the field observations..."
          multiline
          numberOfLines={4}
        />

        <View style={styles.locationContainer}>
          <Text style={styles.label}>Location</Text>
          {location ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Lat: {location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Lng: {location.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Accuracy: ±{location.accuracy.toFixed(0)}m
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.getLocationButton} onPress={getCurrentLocation}>
              <Text style={styles.getLocationText}>Get Current Location</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imagesContainer}>
          <Text style={styles.label}>Images ({images.length})</Text>
          <TouchableOpacity style={styles.addImageButton} onPress={selectImage}>
            <Text style={styles.addImageText}>+ Add Images</Text>
          </TouchableOpacity>
          
          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, uploading && styles.disabledButton]}
          onPress={uploadFieldData}
          disabled={uploading}
        >
          <Text style={styles.submitButtonText}>
            {uploading ? 'Uploading...' : isOnline ? 'Upload Data' : 'Save Offline'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dataTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  dataTypeButton: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 5,
  },
  selectedDataType: {
    backgroundColor: '#2196F3',
  },
  dataTypeText: {
    color: '#333',
    fontSize: 12,
  },
  selectedDataTypeText: {
    color: 'white',
  },
  locationContainer: {
    marginBottom: 15,
  },
  locationInfo: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationText: {
    color: '#666',
    fontSize: 14,
  },
  getLocationButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  getLocationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagesContainer: {
    marginBottom: 20,
  },
  addImageButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  addImageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageItem: {
    position: 'relative',
    margin: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
