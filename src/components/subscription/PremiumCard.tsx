import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../styles/theme';

interface PremiumCardProps {
  title?: string;
  description: string;
  buttonText?: string;
  onButtonPress?: () => void;
  onCardPress?: () => void;
  showButton?: boolean;
}

/**
 * PremiumCard Component
 * 
 * A reusable card for displaying premium workout information with optional button.
 * Used in both WorkoutDetailsScreen for trial users and PremiumWorkoutPreviewScreen.
 */
const PremiumCard: React.FC<PremiumCardProps> = ({ 
  title = 'Premium Workout',
  description,
  buttonText = 'Subscribe to Unlock',
  onButtonPress,
  onCardPress,
  showButton = false
}) => {
  return (
    <TouchableOpacity 
      style={styles.premiumOverlay}
      onPress={onCardPress}
      activeOpacity={onCardPress ? 0.8 : 1}
      disabled={!onCardPress}
    >
      <View style={styles.premiumContent}>
        <Text style={styles.premiumTitle}>{title}</Text>
        <Text style={styles.premiumDescription}>
          {description}
        </Text>
        {showButton && onButtonPress && (
          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={onButtonPress}
          >
            <Text style={styles.subscribeButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  premiumOverlay: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginBottom: 20,
    overflow: 'hidden',
  },
  premiumContent: {
    padding: 16,
    alignItems: 'center',
  },
  premiumTitle: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  premiumDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  subscribeButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PremiumCard;
