import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, DisasterType } from '../../types/User';

interface SafetyTricksScreenProps {
  user: User;
}

interface SafetyTip {
  id: string;
  title: string;
  content: string;
  type: 'do' | 'dont';
}

interface SafetyGuide {
  disaster: DisasterType;
  label: string;
  icon: string;
  color: string;
  tips: SafetyTip[];
  videoUrl?: string;
}

const SafetyTricksScreen: React.FC<SafetyTricksScreenProps> = ({ user }) => {
  const [selectedGuide, setSelectedGuide] = useState<SafetyGuide | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = ['English', 'Hindi', 'Spanish', 'French', 'German'];

  const safetyGuides: SafetyGuide[] = [
    {
      disaster: DisasterType.FLOOD,
      label: 'Flood Safety',
      icon: 'water',
      color: '#4A90E2',
      tips: [
        {
          id: '1',
          title: 'Move to Higher Ground',
          content: 'Immediately move to higher ground or upper floors of buildings.',
          type: 'do',
        },
        {
          id: '2',
          title: 'Avoid Walking in Water',
          content: 'Never walk through moving water. Even 6 inches can knock you down.',
          type: 'dont',
        },
        {
          id: '3',
          title: 'Stay Informed',
          content: 'Keep a battery-powered or hand-crank radio for emergency updates.',
          type: 'do',
        },
        {
          id: '4',
          title: 'Don\'t Drive Through Flooded Roads',
          content: 'Turn around, don\'t drown. Most flood deaths occur in vehicles.',
          type: 'dont',
        },
      ],
      videoUrl: 'https://example.com/flood-safety-video',
    },
    {
      disaster: DisasterType.EARTHQUAKE,
      label: 'Earthquake Safety',
      icon: 'globe',
      color: '#8B4513',
      tips: [
        {
          id: '1',
          title: 'Drop, Cover, and Hold On',
          content: 'Drop to hands and knees, take cover under a desk, and hold on.',
          type: 'do',
        },
        {
          id: '2',
          title: 'Don\'t Run Outside',
          content: 'Don\'t run outside during shaking. Most injuries occur from falling debris.',
          type: 'dont',
        },
        {
          id: '3',
          title: 'Stay Away from Glass',
          content: 'Avoid windows, mirrors, and glass that can shatter.',
          type: 'do',
        },
        {
          id: '4',
          title: 'Don\'t Stand in Doorways',
          content: 'Doorways are not safer than other parts of the house.',
          type: 'dont',
        },
      ],
    },
    {
      disaster: DisasterType.FIRE,
      label: 'Fire Safety',
      icon: 'flame',
      color: '#FF6B35',
      tips: [
        {
          id: '1',
          title: 'Stay Low and Go',
          content: 'Crawl low under smoke to your exit. Smoke rises, cleaner air is near the floor.',
          type: 'do',
        },
        {
          id: '2',
          title: 'Don\'t Use Elevators',
          content: 'Never use elevators during a fire emergency. Use stairs only.',
          type: 'dont',
        },
        {
          id: '3',
          title: 'Test Doors Before Opening',
          content: 'Feel doors with the back of your hand before opening.',
          type: 'do',
        },
        {
          id: '4',
          title: 'Don\'t Hide',
          content: 'Don\'t hide under beds or in closets. Firefighters need to find you.',
          type: 'dont',
        },
      ],
    },
    {
      disaster: DisasterType.ROAD_ACCIDENT,
      label: 'Road Accident Safety',
      icon: 'car',
      color: '#FF3B30',
      tips: [
        {
          id: '1',
          title: 'Move to Safety',
          content: 'If possible, move your vehicle out of traffic and turn on hazard lights.',
          type: 'do',
        },
        {
          id: '2',
          title: 'Don\'t Leave the Scene',
          content: 'Never leave the scene of an accident, even if it\'s minor.',
          type: 'dont',
        },
        {
          id: '3',
          title: 'Call Emergency Services',
          content: 'Call 108 for ambulance or 100 for police immediately.',
          type: 'do',
        },
        {
          id: '4',
          title: 'Don\'t Move Injured People',
          content: 'Don\'t move seriously injured people unless they\'re in immediate danger.',
          type: 'dont',
        },
      ],
    },
    {
      disaster: DisasterType.CYCLONE,
      label: 'Cyclone Safety',
      icon: 'refresh',
      color: '#5856D6',
      tips: [
        {
          id: '1',
          title: 'Evacuate if Advised',
          content: 'Follow evacuation orders from authorities immediately.',
          type: 'do',
        },
        {
          id: '2',
          title: 'Don\'t Go Outside',
          content: 'Don\'t go outside during the eye of the storm. The other side is coming.',
          type: 'dont',
        },
        {
          id: '3',
          title: 'Secure Your Home',
          content: 'Board up windows and secure outdoor furniture.',
          type: 'do',
        },
        {
          id: '4',
          title: 'Don\'t Use Candles',
          content: 'Avoid candles during power outages. Use flashlights instead.',
          type: 'dont',
        },
      ],
    },
  ];

  const openGuide = (guide: SafetyGuide) => {
    setSelectedGuide(guide);
    setModalVisible(true);
  };

  const renderTip = ({ item }: { item: SafetyTip }) => (
    <View style={[styles.tipCard, item.type === 'do' ? styles.doCard : styles.dontCard]}>
      <View style={styles.tipHeader}>
        <Ionicons 
          name={item.type === 'do' ? 'checkmark-circle' : 'close-circle'} 
          size={24} 
          color={item.type === 'do' ? '#34C759' : '#FF3B30'} 
        />
        <Text style={styles.tipTitle}>{item.title}</Text>
      </View>
      <Text style={styles.tipContent}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Safety Guidelines</Text>
        <Text style={styles.subtitle}>Learn how to stay safe during disasters</Text>
        
        {/* Language Selector */}
        <TouchableOpacity style={styles.languageSelector}>
          <Ionicons name="language" size={20} color="#007AFF" />
          <Text style={styles.languageText}>{selectedLanguage}</Text>
          <Ionicons name="chevron-down" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Safety Guides Grid */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.guidesGrid}>
          {safetyGuides.map((guide) => (
            <TouchableOpacity
              key={guide.disaster}
              style={[styles.guideCard, { backgroundColor: guide.color }]}
              onPress={() => openGuide(guide)}
            >
              <Ionicons name={guide.icon as any} size={40} color="white" />
              <Text style={styles.guideLabel}>{guide.label}</Text>
              <View style={styles.cardFooter}>
                <Ionicons name="play-circle" size={16} color="white" />
                <Text style={styles.cardFooterText}>View Tips</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Tips Section */}
        <View style={styles.quickTipsSection}>
          <Text style={styles.sectionTitle}>Quick Emergency Tips</Text>
          
          <View style={styles.quickTip}>
            <Ionicons name="call" size={24} color="#FF3B30" />
            <View style={styles.quickTipContent}>
              <Text style={styles.quickTipTitle}>Emergency Numbers</Text>
              <Text style={styles.quickTipText}>112 (Emergency), 100 (Police), 101 (Fire), 108 (Ambulance)</Text>
            </View>
          </View>

          <View style={styles.quickTip}>
            <Ionicons name="medkit" size={24} color="#34C759" />
            <View style={styles.quickTipContent}>
              <Text style={styles.quickTipTitle}>First Aid Kit</Text>
              <Text style={styles.quickTipText}>Keep a first aid kit with bandages, antiseptic, and medications</Text>
            </View>
          </View>

          <View style={styles.quickTip}>
            <Ionicons name="flashlight" size={24} color="#FF9500" />
            <View style={styles.quickTipContent}>
              <Text style={styles.quickTipTitle}>Emergency Kit</Text>
              <Text style={styles.quickTipText}>Flashlight, radio, water, non-perishable food for 3 days</Text>
            </View>
          </View>

          <View style={styles.quickTip}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <View style={styles.quickTipContent}>
              <Text style={styles.quickTipTitle}>Family Plan</Text>
              <Text style={styles.quickTipText}>Have a family emergency plan and meeting point</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Safety Guide Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedGuide?.label} Guidelines
            </Text>
            <View style={styles.placeholder} />
          </View>

          {selectedGuide && (
            <FlatList
              data={selectedGuide.tips}
              renderItem={renderTip}
              keyExtractor={(item) => item.id}
              style={styles.tipsList}
              contentContainerStyle={styles.tipsContainer}
            />
          )}

          {selectedGuide?.videoUrl && (
            <TouchableOpacity style={styles.videoButton}>
              <Ionicons name="play-circle" size={24} color="white" />
              <Text style={styles.videoButtonText}>Watch Safety Video</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignSelf: 'center',
  },
  languageText: {
    color: '#007AFF',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  guidesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  guideCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  guideLabel: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  cardFooterText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  quickTipsSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  quickTipContent: {
    flex: 1,
    marginLeft: 15,
  },
  quickTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  quickTipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 30,
  },
  tipsList: {
    flex: 1,
  },
  tipsContainer: {
    padding: 10,
  },
  tipCard: {
    backgroundColor: 'white',
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    borderLeftWidth: 4,
  },
  doCard: {
    borderLeftColor: '#34C759',
  },
  dontCard: {
    borderLeftColor: '#FF3B30',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  tipContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 34,
  },
  videoButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  videoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SafetyTricksScreen;