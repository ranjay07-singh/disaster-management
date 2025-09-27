import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';

interface AnalyticsScreenProps {
  user: User;
}

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ user }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const screenWidth = Dimensions.get('window').width;

  // Mock analytics data
  const analyticsData = {
    week: {
      emergencies: [12, 8, 15, 10, 18, 7, 20],
      volunteers: [45, 52, 48, 55, 60, 42, 58],
      responseTime: [8, 6, 9, 7, 5, 10, 6], // minutes
    },
    month: {
      emergencies: [120, 135, 98, 165, 142, 178, 156, 189, 201, 185, 167, 145],
      volunteers: [450, 520, 480, 550, 600, 420, 580, 610, 565, 590, 575, 560],
      responseTime: [7.5, 6.8, 8.2, 6.5, 7.1, 8.5, 6.9, 7.3, 6.4, 7.8, 7.2, 6.7],
    },
    year: {
      emergencies: [1200, 1450, 1300, 1600, 1800, 1550],
      volunteers: [5000, 5500, 5200, 6000, 6500, 6200],
      responseTime: [7.2, 6.9, 7.5, 6.8, 7.0, 6.5],
    },
  };

  const currentData = analyticsData[selectedPeriod];

  const StatCard = ({ title, value, change, icon, color }: {
    title: string;
    value: string;
    change: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statChange, { color: change.startsWith('+') ? '#34C759' : '#FF3B30' }]}>
        {change}
      </Text>
    </View>
  );

  const SimpleChart = ({ data, color, title }: { data: number[]; color: string; title: string }) => {
    const maxValue = Math.max(...data);
    const chartWidth = screenWidth - 60;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chart}>
          {data.map((value, index) => {
            const height = (value / maxValue) * 100;
            const barWidth = chartWidth / data.length - 4;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${height}%`,
                      backgroundColor: color,
                      width: barWidth,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['week', 'month', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriod,
            ]}
            onPress={() => setSelectedPeriod(period as any)}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === period && styles.selectedPeriodText,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Emergencies"
          value={currentData.emergencies.reduce((a, b) => a + b, 0).toString()}
          change="+12.5%"
          icon="alert-circle"
          color="#FF3B30"
        />
        <StatCard
          title="Active Volunteers"
          value={Math.max(...currentData.volunteers).toString()}
          change="+8.3%"
          icon="people"
          color="#34C759"
        />
        <StatCard
          title="Avg Response Time"
          value={`${(currentData.responseTime.reduce((a, b) => a + b, 0) / currentData.responseTime.length).toFixed(1)} min`}
          change="-5.2%"
          icon="time"
          color="#007AFF"
        />
        <StatCard
          title="Success Rate"
          value="94.2%"
          change="+2.1%"
          icon="checkmark-circle"
          color="#FF9500"
        />
      </View>

      {/* Emergency Distribution Chart */}
      <SimpleChart
        data={currentData.emergencies}
        color="#FF3B30"
        title="Emergency Requests"
      />

      {/* Volunteer Activity Chart */}
      <SimpleChart
        data={currentData.volunteers}
        color="#34C759"
        title="Volunteer Activity"
      />

      {/* Response Time Chart */}
      <SimpleChart
        data={currentData.responseTime}
        color="#007AFF"
        title="Average Response Time (minutes)"
      />

      {/* Additional Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Key Insights</Text>
        
        <View style={styles.insightCard}>
          <Ionicons name="trending-up" size={20} color="#34C759" />
          <Text style={styles.insightText}>
            Emergency response time improved by 15% this {selectedPeriod}
          </Text>
        </View>
        
        <View style={styles.insightCard}>
          <Ionicons name="people" size={20} color="#007AFF" />
          <Text style={styles.insightText}>
            Volunteer participation increased during weekends
          </Text>
        </View>
        
        <View style={styles.insightCard}>
          <Ionicons name="location" size={20} color="#FF9500" />
          <Text style={styles.insightText}>
            Most emergencies reported in urban areas (68%)
          </Text>
        </View>
        
        <View style={styles.insightCard}>
          <Ionicons name="time" size={20} color="#FF3B30" />
          <Text style={styles.insightText}>
            Peak emergency hours: 6-9 PM on weekdays
          </Text>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Performance Metrics</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>System Uptime</Text>
          <Text style={styles.metricValue}>99.9%</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>User Satisfaction</Text>
          <Text style={styles.metricValue}>4.7/5.0</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>False Alerts</Text>
          <Text style={styles.metricValue}>2.3%</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Volunteer Retention</Text>
          <Text style={styles.metricValue}>87%</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 5,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriod: {
    backgroundColor: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedPeriodText: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    borderRadius: 2,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
  },
  insightsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  metricsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 30,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AnalyticsScreen;