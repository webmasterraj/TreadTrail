import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar, 
  Alert,
  TextInput,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType, PaceSettings } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../styles/theme';
import { useAuth, useUserSettings } from '../hooks';
import Button from '../components/common/Button';
import { kgToLbs, lbsToKg } from '../utils/calorieUtils';

// Debug flags
const DEBUG_PACE_SETTINGS = false;
const DEBUG_PREFIX = '[DEBUG-PACE-SETTINGS]';

// Debug logging helper
const logDebug = (message: string, ...args: any[]) => {
  if (DEBUG_PACE_SETTINGS) {
    if (args.length > 0) {
      console.log(`${DEBUG_PREFIX} ${message}`, ...args);
    } else {
      console.log(`${DEBUG_PREFIX} ${message}`);
    }
  }
};

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

// Convert mph to km/h
const mphToKmh = (mph: number): number => {
  return mph * 1.60934;
};

// Convert km/h to mph
const kmhToMph = (kmh: number): number => {
  return kmh / 1.60934;
};

const EditPaceScreen: React.FC<Props> = ({ navigation }) => {
  // Get all the context functions we need using hooks
  const { authState } = useAuth();
  const { 
    userSettings, 
    syncUserSettings,
    isLoading
  } = useUserSettings();
  
  // Reference to the ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Track which input is currently focused
  const [focusedInput, setFocusedInput] = useState<PaceType | null>(null);
  
  // State to track keyboard height for scrolling adjustments
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Create a ref to track the most up-to-date unit preference
  const unitPreferenceRef = useRef<'imperial' | 'metric'>('imperial');
  
  // Initialize pace settings from user context or use defaults
  const [paceSettings, setPaceSettings] = useState<PaceSettings>({
    recovery: { speed: 7.2, incline: 1.0 }, 
    base: { speed: 8.8, incline: 1.5 },     
    run: { speed: 11.3, incline: 2.0 },     
    sprint: { speed: 14.5, incline: 2.5 },  
  });
  
  const [inputValues, setInputValues] = useState<Record<PaceType, string>>({
    recovery: paceSettings.recovery.speed.toFixed(1),
    base: paceSettings.base.speed.toFixed(1),
    run: paceSettings.run.speed.toFixed(1),
    sprint: paceSettings.sprint.speed.toFixed(1),
  });
  
  // Add state to track previous valid values
  const [previousValidValues, setPreviousValidValues] = useState<Record<PaceType, string>>({
    recovery: '',
    base: '',
    run: '',
    sprint: ''
  });
  
  // Weight state
  const [weightInput, setWeightInput] = useState('');
  const [previousValidWeight, setPreviousValidWeight] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Toggle between mph and km/h
  const [useMetric, setUseMetric] = useState(true);
  
  // Initialize from user settings when component mounts
  useEffect(() => {
    logDebug('EditPaceScreen mounted or userSettings changed');
    
    // Initialize the input values from the user's pace settings
    if (userSettings) {
      logDebug('User settings loaded', userSettings);
      
      // Check if the user has a preference for units
      const isMetric = userSettings.preferences?.units === 'metric';
      logDebug('Unit preference detected', { units: isMetric ? 'metric' : 'imperial' });
      
      // Only update the unit preference if it's different from the current value
      // This prevents unnecessary re-renders
      if (useMetric !== isMetric) {
        logDebug('Updating unit preference state');
        setUseMetric(isMetric);
        unitPreferenceRef.current = isMetric ? 'metric' : 'imperial';
      }
      
      // Always update the pace settings from user settings to ensure consistency
      // This is important when returning to the screen after saving
      logDebug('Initializing pace settings from user settings');
      setPaceSettings({
        recovery: { ...userSettings.paceSettings.recovery },
        base: { ...userSettings.paceSettings.base },
        run: { ...userSettings.paceSettings.run },
        sprint: { ...userSettings.paceSettings.sprint }
      });
      
      // Initialize weight input
      if (userSettings.weight) {
        const weightValue = isMetric ? userSettings.weight : kgToLbs(userSettings.weight);
        const weightStr = Math.round(weightValue).toString();
        setWeightInput(weightStr);
        setPreviousValidWeight(weightStr);
        logDebug('Weight initialized', { weight: weightValue, units: isMetric ? 'kg' : 'lbs' });
      }
      
      // Always update input values to ensure they match the current unit system
      logDebug('Updating input values for display');
      const updatedValues: Record<PaceType, string> = {
        recovery: '',
        base: '',
        run: '',
        sprint: ''
      };
      
      (['recovery', 'base', 'run', 'sprint'] as PaceType[]).forEach(paceType => {
        // Use userSettings to ensure we have the correct values from Redux
        const currentSpeed = userSettings.paceSettings[paceType].speed;
        
        if (isMetric) {
          // Display in km/h (stored value is already in km/h)
          updatedValues[paceType] = currentSpeed.toFixed(1);
        } else {
          // Display in mph (convert from km/h to mph)
          updatedValues[paceType] = kmhToMph(currentSpeed).toFixed(1);
        }
      });
      
      setInputValues(updatedValues);
      setPreviousValidValues(updatedValues);
    }
  }, [userSettings]);
  
  // Add keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );
    
    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Scroll to the focused input when keyboard appears
  useEffect(() => {
    if (focusedInput && scrollViewRef.current && keyboardVisible) {
      // Add a slight delay to ensure the keyboard is fully shown
      setTimeout(() => {
        // Find the position to scroll to based on the focused input
        const scrollPosition = 
          focusedInput === 'recovery' ? 300 :
          focusedInput === 'base' ? 380 :
          focusedInput === 'run' ? 460 :
          focusedInput === 'sprint' ? 540 : 0;
        
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
      }, 300);
    }
  }, [focusedInput, keyboardVisible]);
  
  // Handle input change without losing focus
  const handleInputChange = (paceType: PaceType, value: string) => {
    // Allow only valid numeric input with at most one decimal point
    // This regex allows empty string, digits, and one decimal point with up to one decimal place
    if (value === '' || /^(\d+)?(\.\d{0,1})?$/.test(value)) {
      // Update the local input value
      setInputValues(prev => ({
        ...prev,
        [paceType]: value
      }));
    }
  };

  // Handle blur event to update the actual pace settings
  const handleInputBlur = (paceType: PaceType) => {
    // If empty, use previous valid value
    if (inputValues[paceType] === '') {
      setInputValues(prev => ({
        ...prev,
        [paceType]: previousValidValues[paceType]
      }));
      return;
    }
    
    const numValue = parseFloat(inputValues[paceType]);
    
    // Define min and max values based on units
    const minValue = 0.1;
    const maxValue = useMetric ? 25 : 15;
    
    // Check if value is outside the acceptable range
    if (isNaN(numValue) || numValue < minValue) {
      Alert.alert(
        'Invalid Value',
        `The ${paceType} pace must be at least ${minValue.toFixed(1)} ${useMetric ? 'km/h' : 'mph'}.`,
        [{ text: 'OK' }]
      );
      // Reset to previous valid value
      setInputValues(prev => ({
        ...prev,
        [paceType]: previousValidValues[paceType]
      }));
    } else if (numValue > maxValue) {
      Alert.alert(
        'Invalid Value',
        `The ${paceType} pace cannot exceed ${maxValue.toFixed(1)} ${useMetric ? 'km/h' : 'mph'}.`,
        [{ text: 'OK' }]
      );
      // Reset to previous valid value
      setInputValues(prev => ({
        ...prev,
        [paceType]: previousValidValues[paceType]
      }));
    } else {
      // Value is valid, update the previous valid value
      setPreviousValidValues(prev => ({
        ...prev,
        [paceType]: numValue.toFixed(1)
      }));
      
      // Format to one decimal place
      setInputValues(prev => ({
        ...prev,
        [paceType]: numValue.toFixed(1)
      }));
      
      // Convert from display units to storage units (always in km/h)
      const speedInKmh = useMetric ? numValue : mphToKmh(numValue);
      
      // Update the pace settings
      setPaceSettings(prev => ({
        ...prev,
        [paceType]: {
          ...prev[paceType],
          speed: speedInKmh
        }
      }));
    }
  };
  
  // Handle weight input change
  const handleWeightInputChange = (value: string) => {
    // Allow only valid numeric input
    if (value === '' || /^\d+$/.test(value)) {
      setWeightInput(value);
    }
  };
  
  // Handle weight input blur
  const handleWeightInputBlur = () => {
    // If empty, use previous valid value
    if (weightInput === '') {
      setWeightInput(previousValidWeight);
      return;
    }
    
    const numValue = parseFloat(weightInput);
    
    // Define min and max values based on units
    const minValue = 1;
    const maxValue = useMetric ? 453.592 : 1000; // 1000 lbs = 453.592 kg
    
    // Check if value is outside the acceptable range
    if (isNaN(numValue) || numValue < minValue) {
      Alert.alert(
        'Invalid Weight',
        `Weight must be at least ${minValue} ${useMetric ? 'kg' : 'lbs'}.`,
        [{ text: 'OK' }]
      );
      // Reset to previous valid value
      setWeightInput(previousValidWeight);
    } else if (numValue > maxValue) {
      Alert.alert(
        'Invalid Weight',
        `Weight cannot exceed ${useMetric ? '453.6 kg' : '1000 lbs'}.`,
        [{ text: 'OK' }]
      );
      // Reset to previous valid value
      setWeightInput(previousValidWeight);
    } else {
      // Value is valid, update the previous valid value
      setPreviousValidWeight(numValue.toString());
    }
  };
  
  // Toggle between miles and kilometers
  const toggleUnits = (useMetricUnits: boolean) => {
    const unitPref = useMetricUnits ? 'metric' : 'imperial';
    
    logDebug(`Toggling units to ${unitPref}`);
    
    // First, update our local reference to prevent any race conditions
    unitPreferenceRef.current = unitPref;
    
    // Calculate the converted values BEFORE updating the state
    const updatedValues: Record<PaceType, string> = {
      recovery: '',
      base: '',
      run: '',
      sprint: ''
    };
    
    // Get updated weight value
    let newWeightInput = weightInput;
    if (weightInput) {
      const numValue = parseFloat(weightInput);
      if (!isNaN(numValue)) {
        if (useMetricUnits) {
          // Convert from lbs to kg
          newWeightInput = Math.round(lbsToKg(numValue)).toString();
        } else {
          // Convert from kg to lbs
          newWeightInput = Math.round(kgToLbs(numValue)).toString();
        }
      }
    }
    
    // Convert pace values
    (['recovery', 'base', 'run', 'sprint'] as PaceType[]).forEach(paceType => {
      const currentSpeed = paceSettings[paceType].speed;
      
      if (useMetricUnits) {
        // Display in km/h (stored value is already in km/h)
        updatedValues[paceType] = currentSpeed.toFixed(1);
      } else {
        // Display in mph (convert from km/h to mph)
        updatedValues[paceType] = kmhToMph(currentSpeed).toFixed(1);
      }
    });
    
    // Batch update all state changes at once to prevent UI flicker
    setUseMetric(useMetricUnits);
    setInputValues(updatedValues);
    setPreviousValidValues(updatedValues);
    setWeightInput(newWeightInput);
    setPreviousValidWeight(newWeightInput);
    
    // Save the preference to storage - do this last to prioritize local changes
    syncUserSettings({
      preferences: {
        units: unitPref
      }
    }).then(() => {
      logDebug(`Successfully saved unit preference: ${unitPref}`);
    }).catch(error => {
      console.error('Error saving unit preference:', error);
    });
  };
  
  // Save pace settings
  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate all inputs before saving
      const paceTypes = ['recovery', 'base', 'run', 'sprint'] as PaceType[];
      let hasValidationErrors = false;
      
      // Validate pace values
      for (const paceType of paceTypes) {
        const value = parseFloat(inputValues[paceType]);
        const minValue = 0.1;
        const maxValue = useMetric ? 25 : 15;
        
        if (isNaN(value) || value < minValue || value > maxValue) {
          hasValidationErrors = true;
          Alert.alert(
            'Invalid Pace Value',
            `The ${paceType} pace must be between ${minValue.toFixed(1)} and ${maxValue.toFixed(1)} ${useMetric ? 'km/h' : 'mph'}.`,
            [{ text: 'OK' }]
          );
          setIsSubmitting(false);
          return;
        }
      }
      
      // Validate weight
      const weightValue = parseFloat(weightInput);
      const minWeight = 1;
      const maxWeight = useMetric ? 453.592 : 1000; // 1000 lbs = 453.592 kg
      
      if (weightInput && (!isNaN(weightValue) && (weightValue < minWeight || weightValue > maxWeight))) {
        hasValidationErrors = true;
        Alert.alert(
          'Invalid Weight',
          `Weight must be between ${minWeight} and ${useMetric ? '453.6 kg' : '1000 lbs'}.`,
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }
      
      // If validation passes, proceed with saving
      if (!hasValidationErrors) {
        // Create an object to hold all the updates
        const updates: {
          paceSettings?: Partial<typeof paceSettings>;
          weight?: number;
        } = {};
        
        // Add pace settings to updates
        const updatedPaceSettings = {
          recovery: { 
            speed: useMetric ? parseFloat(inputValues.recovery) : mphToKmh(parseFloat(inputValues.recovery)), 
            incline: paceSettings.recovery.incline 
          },
          base: { 
            speed: useMetric ? parseFloat(inputValues.base) : mphToKmh(parseFloat(inputValues.base)), 
            incline: paceSettings.base.incline 
          },
          run: { 
            speed: useMetric ? parseFloat(inputValues.run) : mphToKmh(parseFloat(inputValues.run)), 
            incline: paceSettings.run.incline 
          },
          sprint: { 
            speed: useMetric ? parseFloat(inputValues.sprint) : mphToKmh(parseFloat(inputValues.sprint)), 
            incline: paceSettings.sprint.incline 
          },
        };
        
        // Log the input values and the converted values for debugging
        logDebug('Input values before conversion:', {
          recovery: inputValues.recovery,
          base: inputValues.base,
          run: inputValues.run,
          sprint: inputValues.sprint,
          isMetric: useMetric
        });
        
        // Update local state to match what we're saving to ensure consistency
        setPaceSettings(updatedPaceSettings);
        
        updates.paceSettings = updatedPaceSettings;
        
        logDebug('Saving pace settings:', updatedPaceSettings);
        
        // Add weight to updates if provided
        const weightValue = parseFloat(weightInput);
        if (!isNaN(weightValue) && weightValue > 0) {
          // Convert to kg if in imperial
          updates.weight = useMetric ? weightValue : lbsToKg(weightValue);
          logDebug('Saving weight:', { value: updates.weight, units: 'kg' });
        }
        
        // Save all updates at once
        await syncUserSettings(updates);
        logDebug('Settings saved successfully');
        
        // Navigate back
        navigation.goBack();
      }
    } catch (error) {
      logDebug('Error saving settings', error);
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
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardVisible ? keyboardHeight : 20 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with back arrow and title */}
        <View style={styles.navRow}>
          <TouchableOpacity 
            onPress={() => handleSaveSettings()} 
            style={styles.backButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.backButtonText}>←</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Set Your Levels</Text>
          <View style={styles.emptySpace} />
        </View>
        
        <Text style={styles.sectionTitle}>Pace Levels</Text>
        
        {/* Description text */}
        <Text style={styles.description}>
          Set your personal pace levels for your treadmill workouts.
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
                value={inputValues[paceType]}
                onChangeText={(value) => handleInputChange(paceType, value)}
                onBlur={() => handleInputBlur(paceType)}
                keyboardType="decimal-pad"
                selectTextOnFocus
                onFocus={() => setFocusedInput(paceType)}
              />
              <Text style={styles.unitLabel}>{useMetric ? 'km/h' : 'mph'}</Text>
            </View>
          </View>
        ))}
        
        {/* Weight section */}
        <View style={styles.weightSection}>
          <Text style={styles.sectionTitle}>Your Weight</Text>
          <Text style={styles.description}>
            Your weight is used to calculate calories burned during workouts.
          </Text>
          
          <View style={styles.weightInputRow}>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={handleWeightInputChange}
                onBlur={handleWeightInputBlur}
                keyboardType="numeric"
                placeholder={useMetric ? "Weight in kg" : "Weight in lbs"}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.weightUnitLabel}>
                {useMetric ? 'kg' : 'lbs'}
              </Text>
            </View>
          </View>
        </View>
        
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
    paddingBottom: 20, 
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
    paddingRight: 50, 
  },
  recoveryInput: {
    borderColor: COLORS.recovery,
    backgroundColor: 'rgba(0, 200, 0, 0.1)',
  },
  baseInput: {
    borderColor: COLORS.base,
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
  },
  runInput: {
    borderColor: COLORS.run,
    backgroundColor: 'rgba(255, 150, 0, 0.1)',
  },
  sprintInput: {
    borderColor: COLORS.sprint,
    backgroundColor: 'rgba(255, 50, 50, 0.1)',
  },
  unitLabel: {
    position: 'absolute',
    right: 12,
    top: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZES.medium,
  },
  saveButton: {
    marginTop: SPACING.large,
  },
  // Weight section styles
  weightSection: {
    marginTop: SPACING.large,
    marginBottom: SPACING.large,
    paddingHorizontal: SPACING.small,
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.medium,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: FONT_SIZES.large,
    color: COLORS.white,
    marginVertical: SPACING.medium,
  },
  weightDescription: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.medium,
    lineHeight: 18,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightInputContainer: {
    position: 'relative',
    flex: 1,
    // marginRight: SPACING.medium,
  },
  weightInput: {
    width: '100%',
    padding: 12,
    fontSize: FONT_SIZES.large,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.medium,
    color: COLORS.white,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingRight: 50, 
  },
  weightUnitLabel: {
    position: 'absolute',
    right: 12,
    top: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZES.medium,
  },
});

export default EditPaceScreen;