import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionInfo } from '../types';
import * as IAP from 'react-native-iap';
import { Platform } from 'react-native';

// Debug flag - set to false to disable debug logs
const DEBUG_SUBSCRIPTION_CONTEXT = true;

// Storage key for subscription data
const SUBSCRIPTION_KEY = 'treadtrail_subscription';

// Product ID for the premium subscription
export const PREMIUM_SUBSCRIPTION_ID = 'com.treadtrail.app.premium_monthly';

// Default subscription info
const DEFAULT_SUBSCRIPTION_INFO: SubscriptionInfo = {
  isActive: false,
  expirationDate: null,
  productId: null,
  transactionId: null,
  purchaseDate: null,
  receiptData: null,
};

// Context type definition
interface SubscriptionContextType {
  subscriptionInfo: SubscriptionInfo;
  isLoading: boolean;
  error: string | null;
  products: IAP.Product[];
  initializeIAP: () => Promise<void>;
  purchaseSubscription: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  validateSubscription: () => Promise<boolean>;
  isPremiumWorkout: (premium: boolean) => boolean;
  setSubscriptionInfo: React.Dispatch<React.SetStateAction<SubscriptionInfo>>;
}

// Create the context
export const SubscriptionContext = createContext<SubscriptionContextType>({
  subscriptionInfo: DEFAULT_SUBSCRIPTION_INFO,
  isLoading: true,
  error: null,
  products: [],
  initializeIAP: async () => {},
  purchaseSubscription: async () => false,
  restorePurchases: async () => false,
  validateSubscription: async () => false,
  isPremiumWorkout: () => false,
  setSubscriptionInfo: () => {},
});

// Provider component
interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>(DEFAULT_SUBSCRIPTION_INFO);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<IAP.Product[]>([]);
  const [purchaseUpdateSubscription, setPurchaseUpdateSubscription] = useState<IAP.Subscription | null>(null);
  const [purchaseErrorSubscription, setPurchaseErrorSubscription] = useState<IAP.Subscription | null>(null);

  // Initialize subscription data when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        if (DEBUG_SUBSCRIPTION_CONTEXT) {
          console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Starting initialization');
        }
        
        setIsLoading(true);
        
        // Load subscription info from storage
        const storedSubscription = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
        
        if (storedSubscription) {
          const parsedSubscription = JSON.parse(storedSubscription);
          setSubscriptionInfo(parsedSubscription);
          
          if (DEBUG_SUBSCRIPTION_CONTEXT) {
            console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Loaded subscription info:', {
              isActive: parsedSubscription.isActive,
              expirationDate: parsedSubscription.expirationDate,
              productId: parsedSubscription.productId,
            });
          }
          
          // Validate the subscription if it exists
          if (parsedSubscription.isActive) {
            validateSubscription();
          }
        } else {
          if (DEBUG_SUBSCRIPTION_CONTEXT) {
            console.log('[DEBUG-SUBSCRIPTION-CONTEXT] No stored subscription found, using default');
          }
          setSubscriptionInfo(DEFAULT_SUBSCRIPTION_INFO);
        }
      } catch (err) {
        setError('Failed to initialize subscription');
        console.error('[DEBUG-SUBSCRIPTION-CONTEXT] Error initializing subscription:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Clean up IAP subscriptions when component unmounts
    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
    };
  }, []);

  // Save subscription info to storage
  const saveSubscriptionInfo = async (info: SubscriptionInfo) => {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(info));
      setSubscriptionInfo(info);
      
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Saved subscription info:', {
          isActive: info.isActive,
          expirationDate: info.expirationDate,
          productId: info.productId,
        });
      }
    } catch (err) {
      setError('Failed to save subscription info');
      console.error('[DEBUG-SUBSCRIPTION-CONTEXT] Error saving subscription info:', err);
    }
  };

  // Initialize IAP connection
  const initializeIAP = async () => {
    try {
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Initializing IAP');
      }
      
      // Initialize the IAP module
      await IAP.initConnection();
      
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] IAP connection initialized');
      }
      
      // Set up purchase listeners
      if (!purchaseUpdateSubscription) {
        const updateSubscription = IAP.purchaseUpdatedListener((purchase) => {
          if (DEBUG_SUBSCRIPTION_CONTEXT) {
            console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Purchase updated:', purchase);
          }
          
          // Process the purchase
          handlePurchase(purchase);
        });
        
        setPurchaseUpdateSubscription(updateSubscription);
      }
      
      if (!purchaseErrorSubscription) {
        const errorSubscription = IAP.purchaseErrorListener((error) => {
          if (DEBUG_SUBSCRIPTION_CONTEXT) {
            console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Purchase error:', error);
          }
          setError(`Purchase error: ${error.message}`);
        });
        
        setPurchaseErrorSubscription(errorSubscription);
      }
      
      // Get available products
      const productIds = [PREMIUM_SUBSCRIPTION_ID];
      const availableProducts = await IAP.getProducts({ skus: productIds });
      
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Available products:', availableProducts);
      }
      
      setProducts(availableProducts);
      
      return true;
    } catch (err) {
      setError('Failed to initialize IAP');
      console.error('[DEBUG-SUBSCRIPTION-CONTEXT] Error initializing IAP:', err);
      return false;
    }
  };

  // Handle a successful purchase
  const handlePurchase = async (purchase: IAP.Purchase) => {
    try {
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Handling purchase:', purchase);
      }
      
      // Finish the transaction
      if (purchase.transactionReceipt) {
        await IAP.finishTransaction({ purchase });
      }
      
      // Extract receipt data
      const receiptData = purchase.transactionReceipt;
      
      // For iOS, parse the receipt to get the expiration date
      let expirationDate = null;
      if (Platform.OS === 'ios' && receiptData) {
        // In a real implementation, you would send the receipt to your server
        // or use Apple's verifyReceipt endpoint to validate and get expiration
        // For this local implementation, we'll set an expiration date 1 month from now
        const now = new Date();
        const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1));
        expirationDate = oneMonthLater.toISOString();
      }
      
      // Update subscription info
      const updatedSubscription: SubscriptionInfo = {
        isActive: true,
        expirationDate,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        purchaseDate: new Date().toISOString(),
        receiptData,
      };
      
      await saveSubscriptionInfo(updatedSubscription);
      
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Purchase processed successfully');
      }
    } catch (err) {
      setError('Failed to process purchase');
      console.error('[DEBUG-SUBSCRIPTION-CONTEXT] Error processing purchase:', err);
    }
  };

  // Purchase a subscription
  const purchaseSubscription = async (): Promise<boolean> => {
    try {
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Purchasing subscription');
      }
      
      // Ensure IAP is initialized
      if (!products || products.length === 0) {
        if (DEBUG_SUBSCRIPTION_CONTEXT) {
          console.log('[DEBUG-SUBSCRIPTION-CONTEXT] No products available, initializing IAP');
        }
        await initializeIAP();
      }
      
      if (!products || products.length === 0) {
        throw new Error('No products available for purchase');
      }
      
      // Find the premium product
      const premiumProduct = products.find(product => product.productId === PREMIUM_SUBSCRIPTION_ID);
      
      if (!premiumProduct) {
        throw new Error('Premium subscription product not found');
      }
      
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Requesting purchase for product:', premiumProduct.productId);
      }
      
      // Request the purchase
      await IAP.requestPurchase({
        sku: PREMIUM_SUBSCRIPTION_ID,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      
      // The purchase will be processed in the purchaseUpdatedListener
      return true;
    } catch (err) {
      setError('Failed to purchase subscription');
      console.error('[DEBUG-SUBSCRIPTION-CONTEXT] Error purchasing subscription:', err);
      return false;
    }
  };

  // Restore purchases
  const restorePurchases = async (): Promise<boolean> => {
    try {
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Restoring purchases');
      }
      
      // Get available purchases
      const availablePurchases = await IAP.getAvailablePurchases();
      
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Available purchases:', availablePurchases);
      }
      
      // Find the most recent premium subscription purchase
      const premiumSubscription = availablePurchases.find(
        (purchase) => purchase.productId === PREMIUM_SUBSCRIPTION_ID
      );
      
      if (premiumSubscription) {
        // Process the purchase
        await handlePurchase(premiumSubscription);
        return true;
      }
      
      return false;
    } catch (err) {
      setError('Failed to restore purchases');
      console.error('[DEBUG-SUBSCRIPTION-CONTEXT] Error restoring purchases:', err);
      return false;
    }
  };

  // Validate subscription
  const validateSubscription = async (): Promise<boolean> => {
    try {
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Validating subscription');
      }
      
      // Check if subscription is active
      if (!subscriptionInfo.isActive) {
        if (DEBUG_SUBSCRIPTION_CONTEXT) {
          console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Subscription is not active');
        }
        return false;
      }
      
      // Check if subscription has expired
      if (subscriptionInfo.expirationDate) {
        const expirationDate = new Date(subscriptionInfo.expirationDate);
        const now = new Date();
        
        if (expirationDate < now) {
          if (DEBUG_SUBSCRIPTION_CONTEXT) {
            console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Subscription has expired');
          }
          
          // Update subscription info
          const updatedSubscription: SubscriptionInfo = {
            ...subscriptionInfo,
            isActive: false,
          };
          
          await saveSubscriptionInfo(updatedSubscription);
          return false;
        }
      }
      
      // In a real implementation, you would validate the receipt with Apple/Google
      // For this local implementation, we'll assume the subscription is valid
      
      if (DEBUG_SUBSCRIPTION_CONTEXT) {
        console.log('[DEBUG-SUBSCRIPTION-CONTEXT] Subscription is valid');
      }
      
      return true;
    } catch (err) {
      setError('Failed to validate subscription');
      console.error('[DEBUG-SUBSCRIPTION-CONTEXT] Error validating subscription:', err);
      return false;
    }
  };

  // Check if a workout is accessible based on premium status
  const isPremiumWorkout = (premium: boolean): boolean => {
    // If the workout is not premium, it's always accessible
    if (!premium) return true;
    
    // If the workout is premium, check if the user has an active subscription
    return subscriptionInfo.isActive;
  };

  // Context value
  const value = {
    subscriptionInfo,
    isLoading,
    error,
    products,
    initializeIAP,
    purchaseSubscription,
    restorePurchases,
    validateSubscription,
    isPremiumWorkout,
    setSubscriptionInfo,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook for using the subscription context
export const useSubscription = () => {
  const context = React.useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
