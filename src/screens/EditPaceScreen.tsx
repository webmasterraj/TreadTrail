import React, { useContext, useState, useEffect, useRef } from 'react';
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
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PaceType, PaceSettings, PaceSetting } from '../types';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, PACE_COLORS } from '../styles/theme';
import { UserContext } from '../context';
import Button from '../components/common/Button';
import { kgToLbs, lbsToKg } from '../utils/calorieUtils';

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
    updateWeight,
    // Get the saveSettings function directly from context
    saveSettings = async (settings) => {
      console.error('saveSettings not available');
      return false;
    } 
  } = useContext(UserContext);
  
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
    recovery: { speed: 4.5, incline: 1.0 },
    base: { speed: 5.5, incline: 1.5 },
    run: { speed: 7.0, incline: 2.0 },
    sprint: { speed: 9.0, incline: 2.5 },
  });
  
  const [inputValues, setInputValues] = useState<Record<PaceType, string>>({
    recovery: paceSettings.recovery.speed.toFixed(1),
    base: paceSettings.base.speed.toFixed(1),
    run: paceSettings.run.speed.toFixed(1),
    sprint: paceSettings.sprint.speed.toFixed(1),
  });
  
  // Weight state
  const [weightInput, setWeightInput] = useState('');
  const [useMetricWeight, setUseMetricWeight] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Toggle between mph and km/h
  const [useMetric, setUseMetric] = useState(false);
  
  // Initialize from user settings when component mounts
  useEffect(() => {
    if (userSettings?.paceSettings) {
      setPaceSettings(userSettings.paceSettings);
      
      // Check if the user has a preference for units
      const isMetric = userSettings.preferences?.units === 'metric';
      setUseMetric(isMetric);
      setUseMetricWeight(isMetric);
      unitPreferenceRef.current = isMetric ? 'metric' : 'imperial';
      
      // Initialize input values based on pace settings and unit preference
      const updatedValues: Record<PaceType, string> = {
        recovery: '',
        base: '',
        run: '',
        sprint: ''
      };
      
      (['recovery', 'base', 'run', 'sprint'] as PaceType[]).forEach(paceType => {
        const currentSpeed = userSettings.paceSettings[paceType].speed;
        
        if (isMetric) {
          // Display in km/h
          updatedValues[paceType] = convertToMetric(currentSpeed);
        } else {
          // Display in mph
          updatedValues[paceType] = currentSpeed.toFixed(1);
        }
      });
      
      setInputValues(updatedValues);
      
      // Initialize weight input
      if (userSettings.profile?.weight) {
        const weight = userSettings.profile.weight;
        if (isMetric) {
          setWeightInput(Math.round(weight).toString());
        } else {
          setWeightInput(Math.round(kgToLbs(weight)).toString());
        }
      } else {
        setWeightInput('');
      }
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
  
  // Convert mph to km/h for display
  const convertToMetric = (speed: number) => {
    return (speed * 1.60934).toFixed(1);
  };
  
  // Convert km/h back to mph for storage
  const convertFromMetric = (speed: number) => {
    return speed / 1.60934;
  };
  
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
    // If empty, default to 0
    let numValue = 0;
    
    if (inputValues[paceType] !== '') {
      numValue = parseFloat(inputValues[paceType]);
      
      // Ensure the value is within a reasonable range (0.1 to 15)
      numValue = Math.max(0.1, Math.min(numValue, 15));
      
      // Update the input value to show the constrained value
      setInputValues(prev => ({
        ...prev,
        [paceType]: numValue.toFixed(1)
      }));
    }
    
    // Convert from display units to storage units (always in mph)
    const speedInMph = useMetric ? convertFromMetric(numValue) : numValue;
    
    setPaceSettings(prev => ({
      ...prev,
      [paceType]: {
        ...prev[paceType],
        speed: speedInMph,
      },
    }));
    
    setFocusedInput(null);
  };
  
  // Toggle between miles and kilometers
  const toggleUnits = (useMetricUnits: boolean) => {
    const unitPref = useMetricUnits ? 'metric' : 'imperial';
    // Update the ref value
    unitPreferenceRef.current = unitPref;
    // Update the state
    setUseMetric(useMetricUnits);
    
    // Update the displayed values based on the new unit system
    const updatedValues: Record<PaceType, string> = {};
    
    (['recovery', 'base', 'run', 'sprint'] as PaceType[]).forEach(paceType => {
      const currentSpeed = paceSettings[paceType].speed;
      
      if (useMetricUnits) {
        // Converting from mph to km/h
        updatedValues[paceType] = convertToMetric(currentSpeed);
      } else {
        // Converting from km/h to mph
        updatedValues[paceType] = currentSpeed.toFixed(1);
      }
    });
    
    setInputValues(updatedValues);
  };
  
  // Toggle weight units
  const toggleWeightUnits = (useMetricUnits: boolean) => {
    setUseMetricWeight(useMetricUnits);
    
    // Convert the weight value if needed
    if (weightInput) {
      const numValue = parseFloat(weightInput);
      if (!isNaN(numValue)) {
        if (useMetricUnits && !useMetricWeight) {
          // Convert from lbs to kg
          setWeightInput(Math.round(lbsToKg(numValue)).toString());
        } else if (!useMetricUnits && useMetricWeight) {
          // Convert from kg to lbs
          setWeightInput(Math.round(kgToLbs(numValue)).toString());
        }
      }
    }
  };
  
  // Handle weight input change
  const handleWeightInputChange = (value: string) => {
    // Allow only valid numeric input
    if (value === '' || /^\d+$/.test(value)) {
      setWeightInput(value);
    }
  };
  
  // Save pace settings
  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    
    try {
      // If there's a currently focused input, process its value before saving
      if (focusedInput) {
        handleInputBlur(focusedInput);
        // Small delay to ensure state updates before proceeding
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Validate weight input - required field
      if (!weightInput.trim()) {
        Alert.alert(
          'Weight Required',
          'Please enter your weight to continue. This is needed for calorie calculations.',
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }
      
      const weightValue = parseInt(weightInput, 10);
      if (isNaN(weightValue) || weightValue <= 0) {
        Alert.alert(
          'Invalid Weight',
          'Please enter a valid weight value greater than 0.',
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }
      
      // Create a fresh pace settings object directly from input values
      const freshInputPaceSettings: PaceSettings = {
        recovery: { 
          speed: inputValues.recovery ? 
            (useMetric ? convertFromMetric(parseFloat(inputValues.recovery) || 0.1) : parseFloat(inputValues.recovery) || 0.1) : 
            paceSettings.recovery.speed,
          incline: paceSettings.recovery.incline 
        },
        base: { 
          speed: inputValues.base ? 
            (useMetric ? convertFromMetric(parseFloat(inputValues.base) || 0.1) : parseFloat(inputValues.base) || 0.1) : 
            paceSettings.base.speed,
          incline: paceSettings.base.incline 
        },
        run: { 
          speed: inputValues.run ? 
            (useMetric ? convertFromMetric(parseFloat(inputValues.run) || 0.1) : parseFloat(inputValues.run) || 0.1) : 
            paceSettings.run.speed,
          incline: paceSettings.run.incline 
        },
        sprint: { 
          speed: inputValues.sprint ? 
            (useMetric ? convertFromMetric(parseFloat(inputValues.sprint) || 0.1) : parseFloat(inputValues.sprint) || 0.1) : 
            paceSettings.sprint.speed,
          incline: paceSettings.sprint.incline 
        }
      };
      
      // Update pace settings state with fresh values
      setPaceSettings(freshInputPaceSettings);
      
      // Get the current user settings after unit preference and weight update
      const currentSettings = userSettings;
      if (!currentSettings) {
        Alert.alert('Error', 'Could not access user settings');
        setIsSubmitting(false);
        return;
      }
      
      // Create updated settings object with all pace settings updated at once
      const updatedSettings = {
        ...currentSettings,
        paceSettings: freshInputPaceSettings,
        // Explicitly set the preferences to ensure they don't get overwritten
        preferences: {
          ...currentSettings.preferences,
          units: unitPreferenceRef.current,
        },
      };
      
      // Ensure profile and weight are preserved
      if (currentSettings.profile) {
        updatedSettings.profile = {
          ...currentSettings.profile,
        };
        
        // If we have a weight input, make sure it's included in the updated settings
        if (weightInput.trim()) {
          const weightValue = parseInt(weightInput, 10);
          if (!isNaN(weightValue) && weightValue > 0) {
            const weightInKg = useMetricWeight ? weightValue : lbsToKg(weightValue);
            updatedSettings.profile.weight = weightInKg;
          }
        }
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
      
      // Process weight input - this needs to happen BEFORE saving pace settings
      if (weightInput.trim()) {
        const weightValue = parseInt(weightInput, 10);
        if (!isNaN(weightValue) && weightValue > 0) {
          // Convert to kg if in imperial
          const weightInKg = useMetricWeight ? weightValue : lbsToKg(weightValue);
          
          try {
            // Save weight directly
            await updateWeight(weightInKg);
            
            // Force a short delay to ensure weight update propagates
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (weightError) {
            console.error('Error saving weight:', weightError);
            Alert.alert('Error', 'Failed to save weight. Please try again.');
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      // Save the updated settings
      try {
        // Use the saveSettings function from context
        const saved = await saveSettings(updatedSettings);
        if (!saved) {
          throw new Error('Save operation returned false');
        }
      } catch (saveError) {
        console.error('Error saving settings:', saveError);
        Alert.alert('Error', 'Failed to save settings. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error in handleSaveSettings:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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
          <TouchableOpacity onPress={() => handleSaveSettings()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
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
          <Text style={styles.weightDescription}>
            Your weight is used to calculate calories burned during workouts.
          </Text>
          
          <View style={styles.weightInputRow}>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={handleWeightInputChange}
                keyboardType="numeric"
                placeholder={useMetricWeight ? "Weight in kg" : "Weight in lbs"}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.weightUnitLabel}>
                {useMetricWeight ? 'kg' : 'lbs'}
              </Text>
            </View>
            
            <View style={styles.weightUnitsToggle}>
              <TouchableOpacity onPress={() => toggleWeightUnits(false)}>
                <Text style={useMetricWeight ? styles.toggleOptionInactive : styles.toggleOptionActive}>lbs</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleWeightUnits(true)}>
                <Text style={useMetricWeight ? styles.toggleOptionActive : styles.toggleOptionInactive}>kg</Text>
              </TouchableOpacity>
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
    paddingBottom: 20, // Extra padding at the bottom to ensure space for keyboard
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
    paddingRight: 50, // Space for the unit label
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
    marginRight: SPACING.medium,
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
    paddingRight: 50, // Space for the unit label
  },
  weightUnitLabel: {
    position: 'absolute',
    right: 12,
    top: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZES.medium,
  },
  weightUnitsToggle: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
});

export default EditPaceScreen;