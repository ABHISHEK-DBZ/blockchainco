import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineDataSyncScreen({ navigation }) {
  const [offlineData, setOfflineData] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOfflineData();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected && offlineData.length > 0) {
        // Auto-sync when coming online
        syncAllData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadOfflineData = async () => {
    try {
      const data = await AsyncStorage.getItem('offline_field_data');
      if (data) {
        setOfflineData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const syncSingleItem = async (item, index) => {
    if (!isOnline) {
      Alert.alert('No Internet', 'Please check your internet connection.');
      return false;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('project_id', item.projectId);
      formData.append('data_type', item.dataType);
      formData.append('description', item.description);
      formData.append('location', JSON.stringify(item.location));

      // Add images to FormData
      item.images.forEach((image, imgIndex) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type,
          name: image.fileName || `field_image_${imgIndex}.jpg`,
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
        // Remove synced item from offline storage
        const updatedData = offlineData.filter((_, i) => i !== index);
        setOfflineData(updatedData);
        await AsyncStorage.setItem('offline_field_data', JSON.stringify(updatedData));
        return true;
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  };

  const syncAllData = async () => {
    if (!isOnline) {
      Alert.alert('No Internet', 'Please check your internet connection.');
      return;
    }

    if (offlineData.length === 0) {
      Alert.alert('No Data', 'No offline data to sync.');
      return;
    }

    setSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = offlineData.length - 1; i >= 0; i--) {
      const success = await syncSingleItem(offlineData[i], i);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setSyncing(false);

    if (failCount === 0) {
      Alert.alert('Sync Complete', `Successfully synced ${successCount} items.`);
    } else {
      Alert.alert(
        'Sync Partial',
        `Synced ${successCount} items. ${failCount} items failed to sync.`
      );
    }
  };

  const deleteOfflineItem = (index) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this offline data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedData = offlineData.filter((_, i) => i !== index);
            setOfflineData(updatedData);
            await AsyncStorage.setItem('offline_field_data', JSON.stringify(updatedData));
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOfflineData();
    setRefreshing(false);
  };

  const renderOfflineItem = ({ item, index }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.projectId}>Project: {item.projectId}</Text>
        <Text style={styles.dataType}>{item.dataType.toUpperCase()}</Text>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>
          Images: {item.images?.length || 0}
        </Text>
        <Text style={styles.detailText}>
          Saved: {new Date(item.savedAt).toLocaleDateString()}
        </Text>
      </View>

      {item.location && (
        <Text style={styles.locationText}>
          📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>
      )}

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.syncButton, !isOnline && styles.disabledButton]}
          onPress={() => syncSingleItem(item, index)}
          disabled={!isOnline}
        >
          <Text style={styles.syncButtonText}>
            {isOnline ? 'Sync Now' : 'Offline'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteOfflineItem(index)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Data Sync</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {offlineData.length} items waiting to sync
        </Text>
        {offlineData.length > 0 && (
          <TouchableOpacity
            style={[styles.syncAllButton, (!isOnline || syncing) && styles.disabledButton]}
            onPress={syncAllData}
            disabled={!isOnline || syncing}
          >
            <Text style={styles.syncAllButtonText}>
              {syncing ? 'Syncing...' : 'Sync All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={offlineData}
        renderItem={renderOfflineItem}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No offline data to sync</Text>
            <Text style={styles.emptySubText}>
              Field data will appear here when saved offline
            </Text>
          </View>
        }
      />
    </View>
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
  summary: {
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
  },
  syncAllButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  syncAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dataType: {
    fontSize: 12,
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#888',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  syncButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
  },
});
