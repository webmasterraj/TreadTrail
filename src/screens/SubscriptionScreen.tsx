import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../styles/theme';
import { UserContext } from '../context';
import BottomTabBar from '../components/common/BottomTabBar';
import { useSubscription, PREMIUM_SUBSCRIPTION_ID } from '../context/SubscriptionContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useContext(UserContext);
  const {
    subscriptionInfo,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
    products,
    initializeIAP,
    purchaseSubscription,
    restorePurchases,
    validateSubscription,
    setSubscriptionInfo,
  } = useSubscription();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productPrice, setProductPrice] = useState('$2.99/month');
  const [showDevOptions, setShowDevOptions] = useState(false);

  // Initialize IAP and validate subscription when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        
        // Initialize IAP
        const initSuccess = await initializeIAP();
        
        if (!initSuccess) {
          console.warn('[SubscriptionScreen] IAP initialization failed');
          // Continue anyway to allow viewing subscription details
        }
        
        // Validate current subscription
        await validateSubscription();
      } catch (error) {
        console.error('[SubscriptionScreen] Error initializing:', error);
        Alert.alert(
          'Initialization Error',
          'There was a problem initializing the subscription service. Some features may be limited.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  // Update product price when products are loaded
  useEffect(() => {
    if (products && products.length > 0) {
      const premiumProduct = products.find(product => product.productId === PREMIUM_SUBSCRIPTION_ID);
      if (premiumProduct) {
        setProductPrice(premiumProduct.localizedPrice || '$2.99/month');
      }
    }
  }, [products]);

  // Handle subscription purchase
  const handleSubscribe = async () => {
    try {
      // Check if user is authenticated
      if (!authState || !authState.isAuthenticated) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to subscribe to premium workouts.',
          [
            {
              text: 'Sign In',
              onPress: () => navigation.navigate('Landing'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      setIsProcessing(true);
      
      // Ensure IAP is initialized
      if (!products || products.length === 0) {
        const initSuccess = await initializeIAP();
        if (!initSuccess) {
          throw new Error('Failed to initialize in-app purchases');
        }
      }
      
      // Attempt to purchase
      const success = await purchaseSubscription();
      
      if (success) {
        Alert.alert(
          'Subscription Successful',
          'Thank you for subscribing to TreadTrail Premium! You now have access to all premium workouts.',
          [{ text: 'OK' }]
        );
      } else {
        // If purchase function returned false but didn't throw
        Alert.alert(
          'Subscription Failed',
          'The subscription process was not completed. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[SubscriptionScreen] Error purchasing subscription:', error);
      Alert.alert(
        'Subscription Error', 
        'Failed to complete purchase. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle restore purchases
  const handleRestore = async () => {
    try {
      setIsProcessing(true);
      const restored = await restorePurchases();
      
      if (restored) {
        Alert.alert(
          'Subscription Restored',
          'Your premium subscription has been successfully restored.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Subscription Found',
          'We couldn\'t find any active subscription associated with your account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[SubscriptionScreen] Error restoring purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render loading state
  if (isInitializing || isSubscriptionLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading subscription info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>TreadTrail Premium</Text>
        
        {/* Subscription Status */}
        {subscriptionInfo.isActive ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Subscription Active</Text>
            <Text style={styles.statusDescription}>
              Your premium subscription is active. You have access to all premium workouts.
            </Text>
            {subscriptionInfo.expirationDate && (
              <Text style={styles.expirationDate}>
                Expires: {new Date(subscriptionInfo.expirationDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.subscriptionContainer}>
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>🔓</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Unlock Premium Workouts</Text>
                <Text style={styles.featureDescription}>
                  Get access to all premium workouts designed by professional trainers.
                </Text>
              </View>
            </View>
            
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>🏃</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Advanced Training Programs</Text>
                <Text style={styles.featureDescription}>
                  Follow structured training programs for different fitness goals.
                </Text>
              </View>
            </View>
            
            <View style={styles.premiumFeature}>
              <Text style={styles.featureIcon}>📊</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Detailed Performance Stats</Text>
                <Text style={styles.featureDescription}>
                  Track your progress with detailed performance statistics.
                </Text>
              </View>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{productPrice}</Text>
              <Text style={styles.priceDescription}>
                Cancel anytime through {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.subscribeButton, isProcessing && styles.disabledButton]}
              onPress={handleSubscribe}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.black} />
              ) : (
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isProcessing}
            >
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Subscription Management for Active Subscribers */}
        {subscriptionInfo.isActive && (
          <View style={styles.managementContainer}>
            <Text style={styles.managementTitle}>Manage Subscription</Text>
            <Text style={styles.managementDescription}>
              To manage or cancel your subscription, please visit:
            </Text>
            <TouchableOpacity
              style={styles.managementButton}
              onPress={() => {
                // In a real app, this would open the appropriate subscription management page
                Alert.alert(
                  'Manage Subscription',
                  `Please go to ${Platform.OS === 'ios' ? 'App Store Settings' : 'Google Play Subscriptions'} to manage your subscription.`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.managementButtonText}>
                {Platform.OS === 'ios' ? 'App Store Settings' : 'Google Play Subscriptions'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Development Options (only in dev mode) */}
        {__DEV__ && (
          <View style={styles.devContainer}>
            <TouchableOpacity 
              style={styles.devToggleButton}
              onPress={() => setShowDevOptions(!showDevOptions)}>
              <Text style={styles.devToggleText}>
                {showDevOptions ? 'Hide Dev Options' : 'Show Dev Options'}
              </Text>
            </TouchableOpacity>
            
            {showDevOptions && (
              <View style={styles.devOptionsContainer}>
                <Text style={styles.devSectionTitle}>Development Testing</Text>
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={() => {
                    setSubscriptionInfo({
                      isActive: true,
                      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      productId: PREMIUM_SUBSCRIPTION_ID,
                      transactionId: 'dev-transaction-id',
                      purchaseDate: new Date().toISOString(),
                      receiptData: 'dev-receipt-data',
                    });
                    Alert.alert('Dev Mode', 'Subscription activated for development');
                  }}>
                  <Text style={styles.devButtonText}>Set as Subscribed</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={() => {
                    setSubscriptionInfo({
                      isActive: false,
                      expirationDate: null,
                      productId: null,
                      transactionId: null,
                      purchaseDate: null,
                      receiptData: null,
                    });
                    Alert.alert('Dev Mode', 'Subscription deactivated for development');
                  }}>
                  <Text style={styles.devButtonText}>Set as Unsubscribed</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        {/* Error Message */}
        {subscriptionError && (
          <Text style={styles.errorText}>{subscriptionError}</Text>
        )}
      </ScrollView>
      {authState.isAuthenticated && <BottomTabBar activeTab="Settings" />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollContent: {
    padding: SPACING.large,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: SPACING.medium,
    fontSize: FONT_SIZES.medium,
  },
  title: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    marginBottom: SPACING.large,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: SPACING.large,
    marginBottom: SPACING.large,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
  },
  statusTitle: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  statusDescription: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  expirationDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZES.small,
  },
  subscriptionContainer: {
    marginBottom: SPACING.large,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.large,
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: SPACING.medium,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: SPACING.medium,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZES.small,
  },
  priceContainer: {
    alignItems: 'center',
    marginVertical: SPACING.large,
  },
  price: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZES.small,
  },
  subscribeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  disabledButton: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  restoreButtonText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.small,
  },
  managementContainer: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: SPACING.large,
    marginBottom: SPACING.large,
  },
  managementTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  managementDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.medium,
  },
  managementButton: {
    backgroundColor: COLORS.mediumGray,
    borderRadius: 8,
    padding: SPACING.medium,
    alignItems: 'center',
  },
  managementButtonText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginBottom: SPACING.xlarge,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
    marginTop: SPACING.medium,
  },
  // Development styles
  devContainer: {
    marginTop: SPACING.medium,
    marginBottom: SPACING.medium,
    padding: SPACING.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.darkGray,
  },
  devToggleButton: {
    padding: SPACING.small,
    alignItems: 'center',
  },
  devToggleText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  devOptionsContainer: {
    marginTop: SPACING.small,
  },
  devSectionTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  devButton: {
    backgroundColor: COLORS.darkGray,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: SPACING.small,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  devButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
});

export default SubscriptionScreen;
