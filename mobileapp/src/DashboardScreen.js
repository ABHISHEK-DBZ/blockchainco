import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5000/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError('Failed to fetch projects');
      }
    };
    fetchProjects();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restoration Projects</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={projects}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Lat: {item.latitude}, Lon: {item.longitude}</Text>
            <Text>IPFS: {item.ipfs_hash}</Text>
          </View>
        )}
      />
      <Button title="Upload Project" onPress={() => navigation.navigate('Upload')} />
      <Button title="Logout" onPress={async () => { await AsyncStorage.removeItem('token'); navigation.replace('Login'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  item: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  name: { fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 10 }
});
