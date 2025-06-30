import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'

export interface PhotoResult {
  uri: string
  base64?: string
  width?: number
  height?: number
  fileSize?: number
  proofHash: string // Simple hash/identifier for on-chain storage
}

// Generate a simple proof hash from photo metadata
export function generateProofHash(photoUri: string, timestamp: number): string {
  // Create a simple hash from URI and timestamp
  // In a real app, you might upload to IPFS and use the IPFS hash
  const simpleHash = `proof_${timestamp}_${photoUri.split('/').pop()?.slice(-8) || 'unknown'}`
  
  // Convert to a more blockchain-friendly format (felt252 compatible)
  const encoder = new TextEncoder()
  const bytes = encoder.encode(simpleHash.slice(0, 31)) // Max 31 chars for felt252
  let result = 0n
  for (let i = 0; i < bytes.length; i++) {
    result = result * 256n + BigInt(bytes[i])
  }
  return '0x' + result.toString(16)
}

// Request camera permissions
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to take proof photos for bounty completion.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
        ]
      )
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error requesting camera permissions:', error)
    return false
  }
}

// Take a photo for bounty proof
export async function takeProofPhoto(): Promise<PhotoResult | null> {
  try {
    // Check permissions first
    const hasPermission = await requestCameraPermissions()
    if (!hasPermission) {
      return null
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false, // We don't need base64 for our use case
    })

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null
    }

    const asset = result.assets[0]
    const timestamp = Date.now()
    const proofHash = generateProofHash(asset.uri, timestamp)

    // Get file info
    let fileSize: number | undefined
    try {
      const fileInfo = await FileSystem.getInfoAsync(asset.uri)
      if (fileInfo.exists && !fileInfo.isDirectory) {
        fileSize = fileInfo.size
      }
    } catch (error) {
      console.warn('Could not get file info:', error)
    }

    console.log('📸 Proof photo taken:', {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize,
      proofHash,
      timestamp
    })

    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize,
      proofHash
    }

  } catch (error) {
    console.error('Error taking photo:', error)
    Alert.alert('Error', 'Failed to take photo. Please try again.')
    return null
  }
}

// Pick a photo from gallery as alternative
export async function pickProofPhoto(): Promise<PhotoResult | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please allow photo library access to select proof photos.',
      )
      return null
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null
    }

    const asset = result.assets[0]
    const timestamp = Date.now()
    const proofHash = generateProofHash(asset.uri, timestamp)

    // Get file info
    let fileSize: number | undefined
    try {
      const fileInfo = await FileSystem.getInfoAsync(asset.uri)
      if (fileInfo.exists && !fileInfo.isDirectory) {
        fileSize = fileInfo.size
      }
    } catch (error) {
      console.warn('Could not get file info:', error)
    }

    console.log('🖼️ Proof photo selected from gallery:', {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize,
      proofHash,
      timestamp
    })

    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize,
      proofHash
    }

  } catch (error) {
    console.error('Error picking photo:', error)
    Alert.alert('Error', 'Failed to select photo. Please try again.')
    return null
  }
}

// Show photo selection options
export async function selectProofPhoto(): Promise<PhotoResult | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Add Proof Photo',
      'How would you like to add your proof photo?',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await takeProofPhoto()
            resolve(result)
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await pickProofPhoto()
            resolve(result)
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null)
        }
      ]
    )
  })
} 