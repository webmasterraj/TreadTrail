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
    title: 'Recovery',
    description: 'Very light effort, used for active recovery between intervals or for warm-up/cool-down.',
    speedRange: '2-4 mph | 3-6.5 kph',
    inclineRange: '0-2%',
  },
  base: {
    title: 'Base',
    description: 'Moderate effort that feels sustainable. You can hold a conversation at this pace.',
    speedRange: '4-6 mph | 6.5-9.5 kph',
    inclineRange: '1-3%',
  },
  run: {
    title: 'Run',
    description: 'Challenging but sustainable pace. Conversation becomes more difficult.',
    speedRange: '6-8 mph | 9.5-13 kph',
    inclineRange: '1-4%',
  },
  sprint: {
    title: 'Sprint',
    description: 'Maximum effort for short durations. Conversation is not possible.',
    speedRange: '8-12 mph | 13-19 kph',
    inclineRange: '1-5%',
  },
};

const EditPaceScreen: React.FC<Props> = ({ navigation }) => {
  const { userSettings, updatePaceSetting } = useContext(UserContext);
  
  // Initialize pace settings from user context or use defaults
  const [paceSettings, setPaceSettings] = useState<Record<PaceType, PaceSetting>>({
    recovery: { speed: 3.0, incline: 1.0 },
    base: { speed: 5.0, incline: 1.0 },
    run: { speed: 7.0, incline: 1.0 },
    sprint: { speed: 9.0, incline: 1.0 },
  });
  
  // Track which pace type is being edited
  const [editingPace, setEditingPace] = useState<PaceType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load user settings when component mounts
  useEffect(() => {
    if (userSettings?.paceSettings) {
      setPaceSettings(userSettings.paceSettings);
    }
  }, [userSettings]);
  
  // Start editing a pace type
  const handleEditPace = (paceType: PaceType) => {
    setEditingPace(paceType);
  };
  
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
  
  // Render pace setting card
  const renderPaceCard = (paceType: PaceType) => {
    const { title, description, speedRange, inclineRange } = PaceTypeInfo[paceType];
    const { speed, incline } = paceSettings[paceType];
    const isEditing = editingPace === paceType;
    
    return (
      <View 
        key={paceType}
        style={[
          styles.paceCard,
          { backgroundColor: PACE_COLORS[paceType] }
        ]}
      >
        <Text style={styles.paceTitle}>{title}</Text>
        <Text style={styles.paceDescription}>{description}</Text>
        
        <View style={styles.paceRanges}>
          <Text style={styles.paceRangeText}>
            <Text style={styles.bold}>Speed:</Text> {speedRange}
          </Text>
          <Text style={styles.paceRangeText}>
            <Text style={styles.bold}>Incline:</Text> {inclineRange}
          </Text>
        </View>
        
        <View style={styles.paceSettings}>
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Speed (mph)</Text>
            {isEditing ? (
              <TextInput
                style={styles.settingInput}
                value={speed.toString()}
                onChangeText={value => handleUpdateValue(paceType, 'speed', value)}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            ) : (
              <Text style={styles.settingValue}>{speed.toFixed(1)}</Text>
            )}
          </View>
          
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Incline (%)</Text>
            {isEditing ? (
              <TextInput
                style={styles.settingInput}
                value={incline.toString()}
                onChangeText={value => handleUpdateValue(paceType, 'incline', value)}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            ) : (
              <Text style={styles.settingValue}>{incline.toFixed(1)}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => isEditing ? setEditingPace(null) : handleEditPace(paceType)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Personalize Your Pace Settings</Text>
        <Text style={styles.description}>
          Set your preferred treadmill speeds and inclines for each pace level. 
          These will be used during workouts to guide your intensity.
        </Text>
        
        {/* Pace setting cards */}
        {(['recovery', 'base', 'run', 'sprint'] as PaceType[]).map(renderPaceCard)}
        
        {/* Save button */}
        <View style={styles.buttonContainer}>
          <Button 
            title="Save Pace Settings" 
            onPress={handleSaveSettings}
            type="accent"
            size="large"
            fullWidth
            loading={isSubmitting}
          />
        </View>
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
  },
  header: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  description: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    marginBottom: SPACING.large,
    opacity: 0.8,
  },
  paceCard: {
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  paceTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.black,
  },
  paceDescription: {
    fontSize: FONT_SIZES.medium,
    marginBottom: SPACING.small,
    color: COLORS.black,
  },
  paceRanges: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.small,
    marginBottom: SPACING.small,
  },
  paceRangeText: {
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.xs,
    color: COLORS.black,
  },
  bold: {
    fontWeight: 'bold',
  },
  paceSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingGroup: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.black,
    opacity: 0.8,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  settingInput: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.black,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
  },
  editButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
  },
  editButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: SPACING.large,
    marginBottom: SPACING.xxl,
  },
});

export default EditPaceScreen;