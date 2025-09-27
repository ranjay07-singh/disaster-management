import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ApiService } from '../services/ApiService';

export const BackendTestScreen: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Ready to test');

  const testHealthEndpoint = async () => {
    setLoading(true);
    setConnectionStatus('🧪 Testing API Gateway health endpoint...');
    try {
      console.log('🧪 Testing API Gateway health endpoint...');
      const result = await ApiService.checkHealth();
      setHealthStatus(result);
      setConnectionStatus('✅ Health endpoint working!');
      Alert.alert('✅ Success!', 'API Gateway health endpoint working perfectly!');
    } catch (error) {
      setConnectionStatus('❌ Health endpoint failed');
      Alert.alert('❌ Error', `Health endpoint failed: ${error}`);
      console.error('Health endpoint error:', error);
    }
    setLoading(false);
  };

  const testDatabaseEndpoint = async () => {
    setLoading(true);
    setConnectionStatus('🧪 Testing API Gateway database endpoint...');
    try {
      console.log('🧪 Testing API Gateway database endpoint...');
      const result = await ApiService.checkDatabaseHealth();
      setDbStatus(result);
      setConnectionStatus('✅ Database endpoint working!');
      Alert.alert('✅ Success!', 'API Gateway database endpoint working perfectly!');
    } catch (error) {
      setConnectionStatus('❌ Database endpoint failed');
      Alert.alert('❌ Error', `Database endpoint failed: ${error}`);
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Auto-test on component mount
    testHealthEndpoint();
    testDatabaseEndpoint();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚀 API Gateway Test</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔗 API Gateway Details</Text>
        <Text style={styles.infoText}>URL: https://mnjvucz4b4.execute-api.us-east-1.amazonaws.com/prod/api</Text>
        <Text style={styles.infoText}>Security: ✅ HTTPS/SSL Enabled</Text>
        <Text style={styles.infoText}>Status: {connectionStatus}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testHealthEndpoint}
        disabled={loading}
      >
        <Text style={styles.buttonText}>🏥 Test Health Endpoint</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testDatabaseEndpoint}
        disabled={loading}
      >
        <Text style={styles.buttonText}>🗄️ Test Database Endpoint</Text>
      </TouchableOpacity>

      {healthStatus && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Health Status:</Text>
          <Text style={styles.resultText}>{JSON.stringify(healthStatus, null, 2)}</Text>
        </View>
      )}

      {dbStatus && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Database Status:</Text>
          <Text style={styles.resultText}>{JSON.stringify(dbStatus, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
});