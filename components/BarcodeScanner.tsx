import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../utils/theme';
import { getProductByBarcode, FoodProduct } from '../utils/openFoodFacts';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onFound: (product: FoodProduct) => void;
}

export default function BarcodeScanner({ visible, onClose, onFound }: BarcodeScannerProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    setLookupLoading(true);
    setNotFound(false);
    try {
      const product = await getProductByBarcode(data);
      if (product) {
        onFound(product);
      } else {
        setNotFound(true);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const tryAgain = () => {
    setNotFound(false);
    setScanning(true);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Camera access is needed to scan barcodes.</Text>
            <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.accent }]} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Allow camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeLink} onPress={onClose}>
              <Text style={styles.closeLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={scanning ? handleScanned : undefined}
            />
            <View style={styles.overlay}>
              {lookupLoading && <ActivityIndicator color="#FFFFFF" />}
              {notFound && (
                <>
                  <Text style={styles.overlayText}>Product not found</Text>
                  <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.accent }]} onPress={tryAgain}>
                    <Text style={styles.permissionButtonText}>Try again</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.closeLink} onPress={onClose}>
                <Text style={styles.closeLinkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 4,
  },
  closeLink: {
    marginTop: 16,
    padding: 10,
  },
  closeLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
