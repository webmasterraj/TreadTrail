import React, { useContext, useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  // Get all the context functions we need
  const { 
    userSettings, 
    updatePaceSetting, 
    updatePreference, 
    authState,
    // Get the saveSettings function directly from context
    saveSettings = async (settings) => {
      console.error('saveSettings not available');
      return false;
    } 
  } = useContext(UserContext);
  // Create a ref to track the most up-to-date unit preference
  const unitPreferenceRef = useRef<'imperial' | 'metric'>('imperial');
  
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
    
    // If the user has a preference for units, use that
    if (userSettings?.preferences) {
      // Check the units preference
      const unitsPreference = userSettings.preferences.units;
      
      if (unitsPreference) {
        // Update the ref to the current preference
        unitPreferenceRef.current = unitsPreference;
        // Update the state
        setUseMetric(unitsPreference === 'metric');
      }
    }
  }, [userSettings]);
  
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
  
  // Toggle between miles and kilometers
  const toggleUnits = (useMetricUnits: boolean) => {
    const unitPref = useMetricUnits ? 'metric' : 'imperial';
    // Update the ref value
    unitPreferenceRef.current = unitPref;
    // Update the state
    setUseMetric(useMetricUnits);
    // Units preference is saved when user clicks Save
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

      // Get the units preference from our ref
      const unitPref = unitPreferenceRef.current;
      
      try {
        // Save the preference first
        await updatePreference('units', unitPref);
        
        // Force a short delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (prefError) {
        console.error('Error saving units preference:', prefError);
        Alert.alert('Error', 'Failed to save units preference. Please try again.');
      }
      
      // Get the current user settings after unit preference update
      const currentSettings = userSettings;
      if (!currentSettings) {
        Alert.alert('Error', 'Could not access user settings');
        setIsSubmitting(false);
        return;
      }
      
      // Create updated settings object with all pace settings updated at once
      const updatedSettings = {
        ...currentSettings,
        paceSettings: {
          ...paceSettings
        },
        // Explicitly set the preferences to ensure they don't get overwritten
        preferences: {
          ...currentSettings.preferences,
          units: unitPref, // Use the value we saved earlier
        }
      };
      
      // Save the complete updated settings
      try {
        // Debug log before saving
        console.log('[DEBUG-EDIT] About to save settings with paces:', {
          recovery: updatedSettings.paceSettings.recovery.speed,
          base: updatedSettings.paceSettings.base.speed,
          run: updatedSettings.paceSettings.run.speed,
          sprint: updatedSettings.paceSettings.sprint.speed
        });
        
        const success = await saveSettings(updatedSettings);
        
        // Debug log after saving
        console.log('[DEBUG-EDIT] Settings saved successfully:', success);
        console.log('[DEBUG-EDIT] Navigate back to Workouts screen');
      } catch (error) {
        console.error('Error saving settings:', error);
        Alert.alert('Error', 'Failed to save pace settings');
        setIsSubmitting(false);
        return;
      }
      
      // If not authenticated, prompt to create account
      if (!authState.isAuthenticated) {
        Alert.alert(
          'Settings Saved Temporarily',
          'Create an account to save your preferences permanently.',
          [
            {
              text: 'Create Account',
              onPress: () => navigation.navigate('Landing'),
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        setIsSubmitting(false);
        return;
      }
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error saving pace settings:', error);
      Alert.alert(
        'Error',
        'Failed to save pace settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back arrow and title */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Set Your Pace Levels</Text>
          <View style={styles.emptySpace} />
        </View>
        
        {/* Description text */}
        <Text style={styles.description}>
          Set your personal pace levels for your treadmill workouts
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
    marginBottom: SPACING.medium,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 24,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
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