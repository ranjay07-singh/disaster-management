import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatsGridProps {
  stats: {
    casesHandled: number;
    activeYears: number;
    resolvedCases: number;
    pendingCases: number;
  };
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const StatCard = ({ title, value, icon, color }: {
    title: string;
    value: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Performance Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="Cases Handled"
          value={stats.casesHandled.toLocaleString()}
          icon="document-text"
          color="#34C759"
        />
        <StatCard
          title="Active Since"
          value={`${stats.activeYears} years`}
          icon="time"
          color="#007AFF"
        />
        <StatCard
          title="Resolved Cases"
          value={stats.resolvedCases.toLocaleString()}
          icon="checkmark-circle"
          color="#30D158"
        />
        <StatCard
          title="Pending Cases"
          value={stats.pendingCases.toString()}
          icon="hourglass"
          color="#FF9F0A"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 4,
    minHeight: 120,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    padding: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default StatsGrid;