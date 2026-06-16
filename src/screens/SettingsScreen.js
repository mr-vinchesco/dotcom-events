import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/theme';
import { GoogleSheetsService } from '../services/googleSheets';
import { StorageService } from '../utils/storage';

const SettingsScreen = ({ onConfigSaved }) => {
  const [config, setConfig] = useState({
    apiKey: '',
    spreadsheetId: '',
    sheetName: 'Sheet1',
    headerRow: '1',
    ticketIdColumn: 'A',
    attendeeNameColumn: 'B',
    ticketTypeColumn: 'C',
    statusColumn: 'D',
    checkInTimeColumn: 'E',
  });
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // 'ok' | 'error' | null
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const savedConfig = await StorageService.getSheetsConfig();
    if (savedConfig) {
      setConfig({ ...config, ...savedConfig });
      setSaved(true);
    }
  };

  const handleTestConnection = async () => {
    if (!config.apiKey || !config.spreadsheetId) {
      Alert.alert('Missing Fields', 'Please enter your API Key and Spreadsheet ID first.');
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    try {
      const service = new GoogleSheetsService({
        ...config,
        headerRow: parseInt(config.headerRow) || 1,
      });
      await service.testConnection();
      setConnectionStatus('ok');
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert('Connection Failed', error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!config.apiKey || !config.spreadsheetId) {
      Alert.alert('Missing Fields', 'API Key and Spreadsheet ID are required.');
      return;
    }

    const configToSave = {
      ...config,
      headerRow: parseInt(config.headerRow) || 1,
    };

    const success = await StorageService.saveSheetsConfig(configToSave);
    if (success) {
      setSaved(true);
      onConfigSaved && onConfigSaved(configToSave);
      Alert.alert('✓ Saved', 'Your Google Sheets configuration has been saved.');
    } else {
      Alert.alert('Error', 'Failed to save configuration. Please try again.');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Configuration',
      'Are you sure you want to remove all saved settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearSheetsConfig();
            setConfig({
              apiKey: '',
              spreadsheetId: '',
              sheetName: 'Sheet1',
              headerRow: '1',
              ticketIdColumn: 'A',
              attendeeNameColumn: 'B',
              ticketTypeColumn: 'C',
              statusColumn: 'D',
              checkInTimeColumn: 'E',
            });
            setSaved(false);
            setConnectionStatus(null);
            onConfigSaved && onConfigSaved(null);
          },
        },
      ]
    );
  };

  const Field = ({ label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize, hint }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.midGrey}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Setup Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>📋 Setup Guide</Text>
          <Text style={styles.guideStep}>1. Go to console.cloud.google.com</Text>
          <Text style={styles.guideStep}>2. Enable "Google Sheets API"</Text>
          <Text style={styles.guideStep}>3. Create an API Key under Credentials</Text>
          <Text style={styles.guideStep}>4. Restrict the API key to Google Sheets API</Text>
          <Text style={styles.guideStep}>5. Make your Google Sheet publicly readable (or use OAuth)</Text>
          <Text style={styles.guideStep}>6. Copy the Spreadsheet ID from the URL</Text>
          <View style={styles.urlExample}>
            <Text style={styles.urlExampleText}>
              sheets.google.com/d/<Text style={styles.urlHighlight}>SPREADSHEET_ID</Text>/edit
            </Text>
          </View>
        </View>

        {/* Required Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REQUIRED</Text>

          <Field
            label="Google Sheets API Key"
            value={config.apiKey}
            onChangeText={(v) => setConfig({ ...config, apiKey: v })}
            placeholder="AIzaSy..."
            secureTextEntry={true}
            hint="Get this from Google Cloud Console → Credentials"
          />

          <Field
            label="Spreadsheet ID"
            value={config.spreadsheetId}
            onChangeText={(v) => setConfig({ ...config, spreadsheetId: v })}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            hint="Found in your Google Sheet URL"
          />
        </View>

        {/* Sheet Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHEET SETTINGS</Text>

          <Field
            label="Sheet Tab Name"
            value={config.sheetName}
            onChangeText={(v) => setConfig({ ...config, sheetName: v })}
            placeholder="Sheet1"
            hint="The tab name at the bottom of your spreadsheet"
          />

          <Field
            label="Header Row Number"
            value={config.headerRow}
            onChangeText={(v) => setConfig({ ...config, headerRow: v })}
            placeholder="1"
            hint="Row number containing column headers (usually 1)"
          />
        </View>

        {/* Column Mapping */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COLUMN MAPPING</Text>
          <Text style={styles.sectionSubtitle}>
            Specify which column letter contains each field
          </Text>

          <View style={styles.columnGrid}>
            {[
              { label: 'Ticket ID / QR', key: 'ticketIdColumn' },
              { label: 'Attendee Name', key: 'attendeeNameColumn' },
              { label: 'Ticket Type', key: 'ticketTypeColumn' },
              { label: 'Status', key: 'statusColumn' },
              { label: 'Check-in Time', key: 'checkInTimeColumn' },
            ].map(({ label, key }) => (
              <View key={key} style={styles.columnField}>
                <Text style={styles.columnLabel}>{label}</Text>
                <TextInput
                  style={styles.columnInput}
                  value={config[key]}
                  onChangeText={(v) => setConfig({ ...config, [key]: v.toUpperCase() })}
                  placeholder="A"
                  placeholderTextColor={Colors.midGrey}
                  maxLength={2}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Connection Status */}
        {connectionStatus && (
          <View
            style={[
              styles.statusBanner,
              connectionStatus === 'ok' ? styles.statusOk : styles.statusError,
            ]}
          >
            <Text style={styles.statusText}>
              {connectionStatus === 'ok'
                ? '✓ Connection successful! Your sheet is accessible.'
                : '✗ Connection failed. Check your credentials.'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.testButton, testing && styles.buttonDisabled]}
          onPress={handleTestConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color={Colors.turquoise} size="small" />
          ) : (
            <Text style={styles.testButtonText}>TEST CONNECTION</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE CONFIGURATION</Text>
        </TouchableOpacity>

        {saved && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear Saved Settings</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },

  // Guide card
  guideCard: {
    backgroundColor: Colors.darkerGrey,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.turquoise,
  },
  guideTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.turquoise,
    marginBottom: Spacing.sm,
  },
  guideStep: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.lightGrey,
    marginBottom: 4,
    lineHeight: 20,
  },
  urlExample: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  urlExampleText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.midGrey,
    fontFamily: 'monospace',
  },
  urlHighlight: {
    color: Colors.turquoise,
    fontWeight: Typography.fontWeights.bold,
  },

  // Sections
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.extraBold,
    color: Colors.turquoise,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.midGrey,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Fields
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.darkGrey,
    marginBottom: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSizes.md,
    color: Colors.darkGrey,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  fieldHint: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.midGrey,
    marginTop: 4,
  },

  // Column grid
  columnGrid: {
    gap: Spacing.sm,
  },
  columnField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  columnLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.darkGrey,
    flex: 1,
  },
  columnInput: {
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: Typography.fontSizes.md,
    color: Colors.darkGrey,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    width: 60,
    textAlign: 'center',
    fontWeight: Typography.fontWeights.bold,
  },

  // Status
  statusBanner: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusOk: {
    backgroundColor: Colors.successLight,
  },
  statusError: {
    backgroundColor: Colors.errorLight,
  },
  statusText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.darkGrey,
    textAlign: 'center',
  },

  // Buttons
  testButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.turquoise,
    height: 52,
    justifyContent: 'center',
  },
  testButtonText: {
    color: Colors.turquoise,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1,
  },
  saveButton: {
    backgroundColor: Colors.turquoise,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.medium,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  clearButtonText: {
    color: Colors.error,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default SettingsScreen;
