import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
  Dimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/theme';
import { GoogleSheetsService } from '../services/googleSheets';
import { StorageService } from '../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

const ScannerScreen = ({ navigation, sheetsConfig }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const sheetsService = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    if (sheetsConfig) {
      sheetsService.current = new GoogleSheetsService(sheetsConfig);
    }
  }, [sheetsConfig]);

  useEffect(() => {
    if (!scanned) {
      startScanLineAnimation();
    }
  }, [scanned]);

  const startScanLineAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const showResultAnimation = () => {
    resultScaleAnim.setValue(0);
    Animated.spring(resultScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);
    Vibration.vibrate(100);

    if (!sheetsService.current) {
      setScanResult({
        status: 'error',
        message: 'No Google Sheet configured. Please set up your sheet in Settings.',
        qrValue: data,
      });
      setProcessing(false);
      showResultAnimation();
      return;
    }

    try {
      const result = await sheetsService.current.processQRCode(data);
      setScanResult({ ...result, qrValue: data });

      // Save to local history
      await StorageService.addScanToHistory({
        qrValue: data,
        status: result.status,
        attendeeName: result.ticket?.attendeeName,
        ticketType: result.ticket?.ticketType,
      });

      if (result.status === 'valid') {
        Vibration.vibrate([0, 100, 50, 100]);
      } else if (result.status === 'already_used') {
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (error) {
      setScanResult({
        status: 'error',
        message: error.message || 'An unexpected error occurred.',
        qrValue: data,
      });
    } finally {
      setProcessing(false);
      showResultAnimation();
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setScanned(false);
    setProcessing(false);
  };

  const getResultColor = (status) => {
    switch (status) {
      case 'valid': return Colors.success;
      case 'already_used': return Colors.warning;
      case 'not_found': return Colors.error;
      case 'error': return Colors.error;
      default: return Colors.midGrey;
    }
  };

  const getResultIcon = (status) => {
    switch (status) {
      case 'valid': return '✓';
      case 'already_used': return '⚠';
      case 'not_found': return '✗';
      case 'error': return '!';
      default: return '?';
    }
  };

  const getResultTitle = (status) => {
    switch (status) {
      case 'valid': return 'CHECK-IN SUCCESSFUL';
      case 'already_used': return 'ALREADY CHECKED IN';
      case 'not_found': return 'TICKET NOT FOUND';
      case 'error': return 'SCAN ERROR';
      default: return 'UNKNOWN';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          DotCom Events needs camera access to scan QR codes.
          Please enable it in your device settings.
        </Text>
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'ean13'],
        }}
      />

      {/* Dark overlay */}
      <View style={styles.overlay}>
        {/* Top dark area */}
        <View style={styles.overlayTop} />

        {/* Middle row with scan area */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />

          {/* Scan window */}
          <View style={styles.scanWindow}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
            {!scanned && (
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineTranslateY }] },
                ]}
              />
            )}

            {/* Processing overlay */}
            {processing && (
              <View style={styles.processingOverlay}>
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* Bottom dark area */}
        <View style={styles.overlayBottom}>
          <Text style={styles.instructionText}>
            {!scanned ? 'Point camera at QR code to scan' : 'Tap below to scan another ticket'}
          </Text>

          {/* Flash toggle */}
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => setFlashEnabled(!flashEnabled)}
          >
            <Text style={styles.flashIcon}>{flashEnabled ? '🔦' : '💡'}</Text>
            <Text style={styles.flashText}>{flashEnabled ? 'Flash ON' : 'Flash OFF'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result overlay */}
      {scanResult && !processing && (
        <View style={styles.resultOverlay}>
          <Animated.View
            style={[
              styles.resultCard,
              { transform: [{ scale: resultScaleAnim }] },
            ]}
          >
            {/* Status icon */}
            <View
              style={[
                styles.resultIconContainer,
                { backgroundColor: getResultColor(scanResult.status) },
              ]}
            >
              <Text style={styles.resultIcon}>{getResultIcon(scanResult.status)}</Text>
            </View>

            {/* Status title */}
            <Text
              style={[
                styles.resultTitle,
                { color: getResultColor(scanResult.status) },
              ]}
            >
              {getResultTitle(scanResult.status)}
            </Text>

            {/* Ticket details */}
            {scanResult.ticket && (
              <View style={styles.ticketDetails}>
                <Text style={styles.attendeeName}>{scanResult.ticket.attendeeName}</Text>
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketType}>{scanResult.ticket.ticketType}</Text>
                </View>
                {scanResult.ticket.checkInTime ? (
                  <Text style={styles.checkInTime}>
                    {scanResult.status === 'already_used' ? 'Previously checked in: ' : 'Checked in: '}
                    {scanResult.ticket.checkInTime}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Message */}
            <Text style={styles.resultMessage}>{scanResult.message}</Text>

            {/* QR Value (small) */}
            <Text style={styles.qrValue} numberOfLines={1}>
              ID: {scanResult.qrValue}
            </Text>

            {/* Scan again button */}
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleScanAgain}
            >
              <Text style={styles.scanAgainText}>SCAN NEXT TICKET</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.charcoal,
    padding: Spacing.xl,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.white,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.midGrey,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Camera overlay
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },

  // Scan window
  scanWindow: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.turquoise,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.turquoise,
    shadowColor: Colors.turquoise,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 191, 188, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },

  // Bottom instruction
  instructionText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  flashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  flashIcon: {
    fontSize: 18,
  },
  flashText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },

  // Result overlay
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...Shadows.large,
  },
  resultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultIcon: {
    fontSize: 40,
    color: Colors.white,
    fontWeight: Typography.fontWeights.bold,
  },
  resultTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.extraBold,
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  ticketDetails: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    width: '100%',
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  attendeeName: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.darkGrey,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  ticketBadge: {
    backgroundColor: Colors.turquoiseSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  ticketType: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.turquoiseDark,
  },
  checkInTime: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.midGrey,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: Typography.fontSizes.md,
    color: Colors.darkGrey,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  qrValue: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.midGrey,
    marginBottom: Spacing.lg,
    fontFamily: 'monospace',
  },
  scanAgainButton: {
    backgroundColor: Colors.turquoise,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    width: '100%',
    alignItems: 'center',
    ...Shadows.medium,
  },
  scanAgainText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1,
  },
});

export default ScannerScreen;
