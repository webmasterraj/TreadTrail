import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING } from '../../styles/theme';
import { Svg, Path, Circle, Rect } from 'react-native-svg';

export type TabName = 'Workouts' | 'Profile' | 'Settings';

interface BottomTabBarProps {
  activeTab: TabName;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab }) => {
  const navigation = useNavigation();

  const handleWorkoutsPress = () => {
    navigation.navigate('WorkoutLibrary' as never);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never);
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings' as never);
  };

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={styles.tab}
        onPress={handleWorkoutsPress}
      >
        <View style={styles.tabIcon}>
          <Svg viewBox="0 0 24 24" width={24} height={24}>
            <Path 
              d="M4 6h16M4 12h16M4 18h7" 
              stroke={activeTab === 'Workouts' ? COLORS.accent : 'rgba(255, 255, 255, 0.5)'} 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={[
          styles.tabLabel,
          activeTab === 'Workouts' && styles.activeTabText
        ]}>Workouts</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab}
        onPress={handleProfilePress}
      >
        <View style={styles.tabIcon}>
          <Svg viewBox="0 0 24 24" width={24} height={24}>
            <Path 
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" 
              stroke={activeTab === 'Profile' ? COLORS.accent : 'rgba(255, 255, 255, 0.5)'} 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Rect 
              x="8" y="2" width="8" height="4" rx="1" ry="1" 
              stroke={activeTab === 'Profile' ? COLORS.accent : 'rgba(255, 255, 255, 0.5)'} 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle 
              cx="12" cy="14" r="4" 
              stroke={activeTab === 'Profile' ? COLORS.accent : 'rgba(255, 255, 255, 0.5)'} 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={[
          styles.tabLabel,
          activeTab === 'Profile' && styles.activeTabText
        ]}>Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab}
        onPress={handleSettingsPress}
      >
        <View style={styles.tabIcon}>
          <Svg viewBox="0 0 24 24" width={24} height={24}>
            <Circle 
              cx="12" cy="12" r="3" 
              stroke={activeTab === 'Settings' ? COLORS.accent : 'rgba(255, 255, 255, 0.5)'} 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path 
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" 
              stroke={activeTab === 'Settings' ? COLORS.accent : 'rgba(255, 255, 255, 0.5)'} 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={[
          styles.tabLabel,
          activeTab === 'Settings' && styles.activeTabText
        ]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    backgroundColor: COLORS.darkGray,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 20, // Extra padding for bottom safe area
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    marginBottom: 5,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    color: COLORS.white,
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  }
});

export default BottomTabBar;