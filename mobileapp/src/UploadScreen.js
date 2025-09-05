import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export default function UploadScreen({ navigation }) {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access location was denied');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude.toString());
    setLongitude(location.coords.longitude.toString());
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!result.cancelled) {
      setPhoto(result.uri);
    }
  };

  const handleUpload = async () => {
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    if (photo) {
      formData.append('photo', { uri: photo, name: 'photo.jpg', type: 'image/jpeg' });
    }
    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });
      const data = await response.json();
      if (data.msg === 'Project uploaded') {
        navigation.replace('Dashboard');
      } else {
        setError(data.msg || 'Upload failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Restoration Project</Text>
      <TextInput style={styles.input} placeholder="Project Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Latitude" value={latitude} onChangeText={setLatitude} />
      <TextInput style={styles.input} placeholder="Longitude" value={longitude} onChangeText={setLongitude} />
      <Button title="Get Current Location" onPress={getLocation} />
      <Button title="Pick Photo" onPress={pickImage} />
      {photo && <Image source={{ uri: photo }} style={{ width: 200, height: 200, marginVertical: 10 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Upload" onPress={handleUpload} />
      <Button title="Back to Dashboard" onPress={() => navigation.replace('Dashboard')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 }
});
