import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/theme';
import { SubscriptionContext } from '../../context/SubscriptionContext';

interface TrialBannerProps {
  compact?: boolean; // For smaller version of the banner
}

const TrialBanner: React.FC<TrialBannerProps> = ({ compact = false }) => {
  const { subscriptionInfo } = useContext(SubscriptionContext);
  
  // If not in trial, don't show banner
  if (!subscriptionInfo.trialActive) {
    return null;
  }
  
  // Calculate days remaining in trial
  const calculateDaysRemaining = (): number => {
    if (!subscriptionInfo.trialEndDate) return 0;
    
    const now = new Date();
    const trialEnd = new Date(subscriptionInfo.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // Ensure we don't show negative days
  };
  
  const daysRemaining = calculateDaysRemaining();
  
  if (compact) {
    // Compact version for workout cards - just show as small text
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactText}>
          Trial Access: {daysRemaining} days left
        </Text>
      </View>
    );
  }
  
  // Full version for workout details
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⭐</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Premium Workout</Text>
        <Text style={styles.description}>
          You have access to this workout during your free trial.
          {daysRemaining > 0 ? ` ${daysRemaining} days remaining.` : ' Trial ends today.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.premiumLight,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.premium,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.premium,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  compactContainer: {
    backgroundColor: 'transparent', // Remove background
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginTop: -4, // Move it up a bit
  },
  compactText: {
    fontSize: 11,
    color: COLORS.premium,
    fontWeight: '400',
  },
});

export default TrialBanner;
