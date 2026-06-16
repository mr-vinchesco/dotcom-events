import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/theme';
import { StorageService } from '../utils/storage';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = await StorageService.getScanHistory();
    setHistory(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will remove all local scan records. Google Sheet data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearScanHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return Colors.success;
      case 'already_used': return Colors.warning;
      case 'not_found': return Colors.error;
      default: return Colors.midGrey;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'valid': return 'CHECKED IN';
      case 'already_used': return 'DUPLICATE';
      case 'not_found': return 'NOT FOUND';
      default: return status?.toUpperCase() || 'UNKNOWN';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return '✓';
      case 'already_used': return '⚠';
      case 'not_found': return '✗';
      default: return '?';
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-ZA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Stats summary
  const stats = history.reduce(
    (acc, item) => {
      if (item.status === 'valid') acc.valid++;
      else if (item.status === 'already_used') acc.duplicates++;
      else if (item.status === 'not_found') acc.notFound++;
      return acc;
    },
    { valid: 0, duplicates: 0, notFound: 0 }
  );

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
      </View>

      <View style={styles.itemContent}>
        <Text style={styles.attendeeName}>
          {item.attendeeName || 'Unknown Attendee'}
        </Text>
        {item.ticketType && (
          <Text style={styles.ticketType}>{item.ticketType}</Text>
        )}
        <Text style={styles.qrValue} numberOfLines={1}>
          {item.qrValue}
        </Text>
      </View>

      <View style={styles.itemRight}>
        <View
          style={[
            styles.statusChip,
            { backgroundColor: getStatusColor(item.status) + '22' },
          ]}
        >
          <Text
            style={[
              styles.statusChipText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  const ListHeader = () => (
    <View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: Colors.success }]}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>
            {stats.valid}
          </Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: Colors.warning }]}>
          <Text style={[styles.statNumber, { color: Colors.warning }]}>
            {stats.duplicates}
          </Text>
          <Text style={styles.statLabel}>Duplicates</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: Colors.error }]}>
          <Text style={[styles.statNumber, { color: Colors.error }]}>
            {stats.notFound}
          </Text>
          <Text style={styles.statLabel}>Not Found</Text>
        </View>
      </View>

      {/* History header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>SCAN LOG</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.turquoise}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyText}>
              Scan some tickets and your history will appear here.
            </Text>
          </View>
        }
        contentContainerStyle={
          history.length === 0 ? styles.emptyContainer : styles.listContent
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.md,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    ...Shadows.small,
  },
  statNumber: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.extraBold,
  },
  statLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.midGrey,
    fontWeight: Typography.fontWeights.medium,
    marginTop: 2,
  },

  // List header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  listHeaderTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.extraBold,
    color: Colors.midGrey,
    letterSpacing: 1.5,
  },
  clearText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.error,
    fontWeight: Typography.fontWeights.medium,
  },

  // History items
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
    gap: Spacing.sm,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statusIcon: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: Typography.fontWeights.bold,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  attendeeName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.darkGrey,
  },
  ticketType: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.turquoise,
    fontWeight: Typography.fontWeights.medium,
  },
  qrValue: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.midGrey,
    fontFamily: 'monospace',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusChipText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.midGrey,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.darkGrey,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.midGrey,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HistoryScreen;
