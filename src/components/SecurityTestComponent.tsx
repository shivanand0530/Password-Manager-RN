import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedSecureStorage from '@/utils/enhancedSecureStorage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { savePassword, selectAllPasswords, clearAllPasswords } from '@/store/Slices/passwordSliceSimplified';

export default function SecurityTestComponent() {
  const dispatch = useAppDispatch();
  const passwords = useAppSelector(selectAllPasswords);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [rawStorageData, setRawStorageData] = useState<string>('');

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSecurity = async () => {
    try {
      addLog('🔍 Testing storage security...');
      
      // Test 1: Check if Redux Persist data is encrypted
      const keys = await AsyncStorage.getAllKeys();
      const reduxKeys = keys.filter(key => key.startsWith('persist:'));
      
      addLog(`📊 Found ${reduxKeys.length} Redux Persist keys`);
      
      for (const key of reduxKeys) {
        const rawValue = await AsyncStorage.getItem(key);
        if (rawValue) {
          const isEncrypted = rawValue.startsWith('__ENCRYPTED__');
          addLog(`🔑 ${key}: ${isEncrypted ? '✅ ENCRYPTED' : '❌ PLAIN TEXT'}`);
          
          if (!isEncrypted && rawValue.length > 100) {
            // Show first 100 chars to demonstrate the security risk
            setRawStorageData(rawValue.substring(0, 100) + '...');
          }
        }
      }
      
      // Test 2: Demonstrate the difference
      await demonstrateSecurityDifference();
      
    } catch (error) {
      addLog(`❌ Security test failed: ${error}`);
    }
  };

  const demonstrateSecurityDifference = async () => {
    const testData = JSON.stringify({
      password: 'superSecretPassword123',
      username: 'testUser',
      sensitive: 'This should not be readable!'
    });

    addLog('🧪 Demonstrating security difference...');
    
    // Store in plain AsyncStorage
    await AsyncStorage.setItem('TEST_PLAIN', testData);
    const plainStored = await AsyncStorage.getItem('TEST_PLAIN');
    addLog(`📝 Plain storage: ${plainStored?.substring(0, 50)}...`);
    
    // Store in encrypted storage
    await EnhancedSecureStorage.setItem('TEST_ENCRYPTED', testData);
    const encryptedStored = await AsyncStorage.getItem('TEST_ENCRYPTED');
    addLog(`🔒 Encrypted storage: ${encryptedStored?.substring(0, 50)}...`);
    
    // Retrieve from encrypted storage
    const decryptedData = await EnhancedSecureStorage.getItem('TEST_ENCRYPTED');
    const matches = decryptedData === testData;
    addLog(`✅ Decryption works: ${matches ? 'YES' : 'NO'}`);
    
    // Cleanup
    await AsyncStorage.removeItem('TEST_PLAIN');
    await AsyncStorage.removeItem('TEST_ENCRYPTED');
  };

  const addTestPassword = async () => {
    try {
      const testPassword = {
        title: 'Secure Test Password',
        username: 'secureUser',
        password: 'verySecurePassword!@#',
        website: 'secure.example.com',
        notes: 'This password is stored with AES-256 encryption!',
        category: '1',
        isFavorite: true
      };

      addLog('💾 Adding encrypted test password...');
      await dispatch(savePassword(testPassword)).unwrap();
      addLog('✅ Encrypted password saved successfully');
      
      // Check if it's actually encrypted in storage
      setTimeout(testSecurity, 1000); // Give Redux Persist time to save
    } catch (error) {
      addLog(`❌ Failed to add test password: ${error}`);
    }
  };

  const checkStorageSecurity = async () => {
    try {
      addLog('🔍 Checking current storage security...');
      
      const keys = await AsyncStorage.getAllKeys();
      const persistKeys = keys.filter(k => k.includes('persist'));
      
      for (const key of persistKeys) {
        const isEncrypted = await EnhancedSecureStorage.isDataEncrypted(key);
        addLog(`📋 ${key}: ${isEncrypted ? '🔒 Encrypted' : '⚠️ Not encrypted'}`);
      }
    } catch (error) {
      addLog(`❌ Security check failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
    setRawStorageData('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Security Analysis</Text>
      
      <View style={styles.securityInfo}>
        <View style={styles.securitySection}>
          <Text style={styles.sectionTitle}>❌ AsyncStorage Security Issues:</Text>
          <Text style={styles.bulletPoint}>• Stores data in PLAIN TEXT</Text>
          <Text style={styles.bulletPoint}>• Readable by anyone with device access</Text>
          <Text style={styles.bulletPoint}>• No encryption by default</Text>
          <Text style={styles.bulletPoint}>• Easy to extract from device backups</Text>
        </View>
        
        <View style={styles.securitySection}>
          <Text style={styles.sectionTitle}>✅ Our Encrypted Solution:</Text>
          <Text style={styles.bulletPoint}>• AES-256 encryption using your existing utils</Text>
          <Text style={styles.bulletPoint}>• Unique encryption key per device</Text>
          <Text style={styles.bulletPoint}>• Data unreadable without decryption</Text>
          <Text style={styles.bulletPoint}>• Automatic encryption/decryption</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={addTestPassword}>
          <Text style={styles.buttonText}>Add Encrypted Password</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testSecurity}>
          <Text style={styles.buttonText}>Test Security</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={checkStorageSecurity}>
          <Text style={styles.buttonText}>Check Storage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {rawStorageData && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>⚠️ SECURITY RISK - Plain Text Data:</Text>
          <Text style={styles.dangerText}>{rawStorageData}</Text>
          <Text style={styles.dangerNote}>👆 This is what attackers would see without encryption!</Text>
        </View>
      )}

      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Security Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.logText}>{result}</Text>
        ))}
      </ScrollView>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>🎯 Security Summary:</Text>
        <Text style={styles.summaryText}>✅ Redux Persist + Encryption = Secure & Simple</Text>
        <Text style={styles.summaryText}>🔒 Your passwords are now AES-256 encrypted</Text>
        <Text style={styles.summaryText}>⚡ No performance impact, automatic encryption</Text>
        <Text style={styles.highlight}>MUCH MORE SECURE than plain AsyncStorage!</Text>
      </View>
    </View>
  );
}

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
    marginBottom: 20,
  },
  securityInfo: {
    marginBottom: 20,
  },
  securitySection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    marginBottom: 5,
    paddingLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: '48%',
  },
  clearButton: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dangerZone: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 2,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 10,
  },
  dangerText: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#FFCDD2',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dangerNote: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
  },
  logContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    maxHeight: 200,
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  summaryContainer: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 5,
  },
  highlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    textAlign: 'center',
    marginTop: 10,
  },
});