import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { createWallet } from '../utils/utils'
import { createUserWallet, getUserWallet, testDatabaseConnection } from '../utils/supabase'

export default function DebugScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testDatabase = async () => {
    try {
      setLoading(true)
      addTestResult('Testing database connection...')
      const result = await testDatabaseConnection()
      if (result.success) {
        addTestResult('✅ Database connection successful')
      } else {
        addTestResult(`❌ Database connection failed: ${JSON.stringify(result.error)}`)
      }
    } catch (error) {
      addTestResult(`❌ Database test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testWalletCreation = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in')
      return
    }

    try {
      setLoading(true)
      addTestResult('Creating wallet...')
      const walletData = await createWallet('sepolia')
      addTestResult(`✅ Wallet created: ${JSON.stringify(walletData, null, 2)}`)
      
      addTestResult('Storing wallet in database...')
      const result = await createUserWallet(user.id, walletData)
      addTestResult(`✅ Wallet stored successfully: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      addTestResult(`❌ Wallet creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testWalletRetrieval = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in')
      return
    }

    try {
      setLoading(true)
      addTestResult('Retrieving wallet from database...')
      const wallet = await getUserWallet(user.id)
      if (wallet) {
        addTestResult(`✅ Wallet retrieved: ${JSON.stringify(wallet, null, 2)}`)
      } else {
        addTestResult('ℹ️ No wallet found for user')
      }
    } catch (error) {
      addTestResult(`❌ Wallet retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const checkEnvironmentVariables = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    const cavosKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY

    addTestResult(`Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
    addTestResult(`Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`)
    addTestResult(`Cavos API Key: ${cavosKey ? '✅ Set' : '❌ Missing'}`)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Debug Screen</Text>
        
        <Text style={styles.userInfo}>
          User ID: {user?.id || 'Not logged in'}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={checkEnvironmentVariables}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Environment Variables</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={testDatabase}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Database Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={testWalletCreation}
            disabled={loading || !user?.id}
          >
            <Text style={styles.buttonText}>Test Wallet Creation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={testWalletRetrieval}
            disabled={loading || !user?.id}
          >
            <Text style={styles.buttonText}>Test Wallet Retrieval</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    minHeight: 200,
  },
  resultsTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
}) 