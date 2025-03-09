import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType, PaceSetting } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, PACE_COLORS } from '../styles/theme';
import { UserContext } from '../context';
import Button from '../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPace'>;

const PaceTypeInfo = {
  recovery: {
    title: 'Recovery Pace',
    description: 'Easy, recovery walking or light jogging',
  },
  base: {
    title: 'Base Pace',
    description: 'Comfortable pace you can maintain for 30+ minutes',
  },
  run: {
    title: 'Run Pace',
    description: 'Challenging pace you can sustain for several minutes',
  },
  sprint: {
    title: 'Sprint Pace',
    description: 'Maximum effort for short intervals',
  },
};

const EditPaceScreen: React.FC<Props> = ({ navigation }) => {
  const { userSettings, updatePaceSetting } = useContext(UserContext);
  
  // Initialize pace settings from user context or use defaults
  const [paceSettings, setPaceSettings] = useState<Record<PaceType, PaceSetting>>({
    recovery: { speed: 4.5, incline: 1.0 },
    base: { speed: 5.5, incline: 1.5 },
    run: { speed: 7.0, incline: 2.0 },
    sprint: { speed: 9.0, incline: 2.5 },
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Toggle between mph and km/h
  const [useMetric, setUseMetric] = useState(false);
  
  // Load user settings when component mounts
  useEffect(() => {
    if (userSettings?.paceSettings) {
      setPaceSettings(userSettings.paceSettings);
    }
    // If the user has a preference for metric units, use that
    if (userSettings?.preferences?.useMetric !== undefined) {
      setUseMetric(userSettings.preferences.useMetric);
    }
  }, [userSettings]);
  
  // Update pace setting value
  const handleUpdateValue = (
    paceType: PaceType, 
    field: 'speed' | 'incline', 
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    
    setPaceSettings(prev => ({
      ...prev,
      [paceType]: {
        ...prev[paceType],
        [field]: numValue,
      },
    }));
  };
  
  // Toggle between miles and kilometers
  const toggleUnits = (useMetricUnits: boolean) => {
    setUseMetric(useMetricUnits);
  };
  
  // Convert mph to km/h for display
  const convertToMetric = (speed: number) => {
    return (speed * 1.60934).toFixed(1);
  };
  
  // Convert km/h back to mph for storage
  const convertFromMetric = (speed: number) => {
    return speed / 1.60934;
  };
  
  // Get displayed speed value based on current unit setting
  const getDisplaySpeed = (paceType: PaceType) => {
    const speedValue = paceSettings[paceType].speed;
    return useMetric ? convertToMetric(speedValue) : speedValue.toFixed(1);
  };
  
  // Handle input change with unit conversion
  const handleSpeedChange = (paceType: PaceType, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setPaceSettings(prev => ({
      ...prev,
      [paceType]: {
        ...prev[paceType],
        speed: useMetric ? convertFromMetric(numValue) : numValue,
      },
    }));
  };
  
  // Save pace settings
  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate that settings follow the expected pattern (recovery < base < run < sprint)
      if (
        paceSettings.recovery.speed >= paceSettings.base.speed ||
        paceSettings.base.speed >= paceSettings.run.speed ||
        paceSettings.run.speed >= paceSettings.sprint.speed
      ) {
        Alert.alert(
          'Invalid Pace Settings',
          'Speed settings should follow the pattern: Recovery < Base < Run < Sprint',
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }
      
      // Save each pace setting
      await Promise.all(
        Object.entries(paceSettings).map(([paceType, setting]) =>
          updatePaceSetting(paceType as PaceType, setting)
        )
      );
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save pace settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Cancel button and title */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.emptySpace} />
        </View>
        
        <Text style={styles.screenTitle}>Set Your Pace Levels</Text>
        
        {/* Description text */}
        <Text style={styles.description}>
          Define your personal pace levels for this and future workouts.
          <Text style={styles.note}> — you can always adjust it later as you improve!</Text>
        </Text>
        
        {/* Units toggle */}
        <View style={styles.unitsToggleContainer}>
          <Text style={styles.unitsLabel}>Units:</Text>
          <View style={styles.toggleSwitchText}>
            <TouchableOpacity onPress={() => toggleUnits(false)}>
              <Text style={useMetric ? styles.toggleOptionInactive : styles.toggleOptionActive}>mi</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleUnits(true)}>
              <Text style={useMetric ? styles.toggleOptionActive : styles.toggleOptionInactive}>km</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Pace setting inputs */}
        {(['recovery', 'base', 'run', 'sprint'] as PaceType[]).map(paceType => (
          <View key={paceType} style={styles.paceSection}>
            <Text style={styles.paceLabel}>{PaceTypeInfo[paceType].title}</Text>
            <Text style={styles.paceDescription}>{PaceTypeInfo[paceType].description}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.paceInput, styles[`${paceType}Input`]]}
                value={getDisplaySpeed(paceType)}
                onChangeText={(value) => handleSpeedChange(paceType, value)}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={styles.unitLabel}>{useMetric ? 'km/h' : 'mph'}</Text>
            </View>
          </View>
        ))}
        
        {/* Save button */}
        <Button 
          title="Save" 
          onPress={handleSaveSettings}
          type="accent"
          size="large"
          fullWidth
          loading={isSubmitting}
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollContent: {
    padding: SPACING.medium,
    paddingBottom: 100, // Extra padding at the bottom
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  cancelButton: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'normal',
  },
  emptySpace: {
    width: 60,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  description: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    marginBottom: SPACING.large,
    lineHeight: 22,
    opacity: 0.87,
  },
  note: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  unitsToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  unitsLabel: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: SPACING.small,
  },
  toggleSwitchText: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  toggleOptionActive: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: COLORS.accent,
    padding: 2,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  toggleOptionInactive: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    padding: 2,
  },
  paceSection: {
    marginBottom: SPACING.large,
  },
  paceLabel: {
    fontWeight: 'bold',
    fontSize: FONT_SIZES.medium,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  paceDescription: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.small,
  },
  inputContainer: {
    position: 'relative',
  },
  paceInput: {
    width: '100%',
    padding: 12,
    fontSize: FONT_SIZES.large,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.medium,
    color: COLORS.white,
    paddingRight: 50, // Space for the unit label
  },
  recoveryInput: {
    borderColor: COLORS.recovery,
    backgroundColor: COLORS.recoveryMuted,
  },
  baseInput: {
    borderColor: COLORS.base,
    backgroundColor: COLORS.baseMuted,
  },
  runInput: {
    borderColor: COLORS.run,
    backgroundColor: COLORS.runMuted,
  },
  sprintInput: {
    borderColor: COLORS.sprint,
    backgroundColor: COLORS.sprintMuted,
  },
  unitLabel: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }], // Manual adjustment to center text
    color: 'rgba(255, 255, 255, 0.6)',
  },
  saveButton: {
    marginTop: SPACING.large,
  },
});

export default EditPaceScreen;