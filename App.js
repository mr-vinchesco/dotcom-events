import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors, Typography, Spacing, BorderRadius } from './src/utils/theme';
import { StorageService } from './src/utils/storage';
import ScannerScreen from './src/screens/ScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Tab bar icon component
const TabIcon = ({ icon, label, focused }) => (
  <View style={[tabStyles.tabItem, focused && tabStyles.tabItemActive]}>
    <Text style={[tabStyles.tabIcon, focused && tabStyles.tabIconActive]}>{icon}</Text>
    <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  tabItemActive: {
    backgroundColor: Colors.turquoiseSubtle,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabIconActive: {
    // tint applied via color
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.midGrey,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: Colors.turquoise,
  },
});

export default function App() {
  const [sheetsConfig, setSheetsConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await StorageService.getSheetsConfig();
    setSheetsConfig(config);
    setLoading(false);
  };

  const handleConfigSaved = (config) => {
    setSheetsConfig(config);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.charcoal} />
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>◉</Text>
          </View>
          <Text style={styles.logoName}>DotCom Events</Text>
          <Text style={styles.logoTagline}>Event Check-in System</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.charcoal} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.charcoal,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTitleStyle: {
              color: Colors.white,
              fontSize: Typography.fontSizes.lg,
              fontWeight: Typography.fontWeights.bold,
            },
            headerTitleAlign: 'center',
            tabBarStyle: {
              backgroundColor: Colors.white,
              borderTopColor: Colors.lightGrey,
              borderTopWidth: 1,
              height: 72,
              paddingBottom: 8,
              paddingTop: 4,
            },
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="Scanner"
            options={{
              title: 'DotCom Events',
              headerLeft: () => (
                <View style={styles.headerLogo}>
                  <Text style={styles.headerLogoIcon}>◉</Text>
                </View>
              ),
              headerRight: () => (
                sheetsConfig ? (
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedDot}>●</Text>
                    <Text style={styles.connectedText}>Connected</Text>
                  </View>
                ) : (
                  <View style={styles.disconnectedBadge}>
                    <Text style={styles.connectedText}>Setup needed</Text>
                  </View>
                )
              ),
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="⬡" label="SCAN" focused={focused} />
              ),
            }}
          >
            {(props) => (
              <ScannerScreen {...props} sheetsConfig={sheetsConfig} />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: 'Scan History',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="☰" label="HISTORY" focused={focused} />
              ),
            }}
          />

          <Tab.Screen
            name="Settings"
            options={{
              title: 'Google Sheets Setup',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="⚙" label="SETTINGS" focused={focused} />
              ),
            }}
          >
            {(props) => (
              <SettingsScreen {...props} onConfigSaved={handleConfigSaved} />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.turquoise,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.turquoise,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 52,
    color: Colors.white,
  },
  logoName: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.extraBold,
    color: Colors.white,
    letterSpacing: 1,
  },
  logoTagline: {
    fontSize: Typography.fontSizes.md,
    color: Colors.midGrey,
    marginTop: Spacing.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Header
  headerLogo: {
    marginLeft: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.turquoise,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoIcon: {
    fontSize: 20,
    color: Colors.white,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  disconnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  connectedDot: {
    color: Colors.success,
    fontSize: 10,
  },
  connectedText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.darkGrey,
  },
});
