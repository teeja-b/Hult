// src/components/FCMInitializer.js
import { useEffect, useState } from 'react';
import { initializeFCM } from '../firebaseConfig';
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * FCM Auto-Initializer - Shows a prompt to enable notifications
 * Add this component to App.js to automatically prompt users
 */
export const FCMInitializer = ({ onNotification }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fcmToken = localStorage.getItem('fcm_token');
    const promptDismissed = sessionStorage.getItem('fcm_prompt_dismissed');
    
    // Only show prompt if:
    // 1. User is logged in
    // 2. No FCM token exists
    // 3. User hasn't dismissed the prompt this session
    // 4. Browser supports notifications
    if (token && !fcmToken && !promptDismissed && 'Notification' in window) {
      // Show prompt after 2 seconds (give user time to see the dashboard)
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      console.log('🔔 [FCM] User clicked "Enable Notifications"');
      
      const success = await initializeFCM((payload) => {
        console.log('📨 Notification received:', payload);
        
        // Show a toast notification
        if (payload.notification?.title) {
          showToast(payload.notification.title, payload.notification.body);
        }
        
        // Call parent callback if provided
        if (onNotification) {
          onNotification(payload);
        }
      });
      
      if (success) {
        console.log('✅ [FCM] Notifications enabled successfully');
        setInitialized(true);
        setShowPrompt(false);
        
        // Show success toast
        showToast('✅ Notifications Enabled', 'You will now receive notifications!');
      } else {
        throw new Error('Failed to initialize FCM');
      }
    } catch (err) {
      console.error('❌ [FCM] Initialization error:', err);
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('fcm_prompt_dismissed', 'true');
    console.log('⚠️ [FCM] User dismissed notification prompt');
  };

  const showToast = (title, message) => {
    // Simple toast notification (you can replace with a proper toast library)
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 max-w-sm animate-slide-in';
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="bg-green-100 p-2 rounded-lg">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800">${title}</h4>
          <p class="text-sm text-gray-600">${message}</p>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Don't render anything if not showing prompt
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell size={32} className="text-white" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Enable Notifications
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Get instant alerts when tutors message you or accept your booking requests.
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-gray-800">Never Miss a Message</p>
              <p className="text-sm text-gray-600">Get notified when tutors reply to you</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-gray-800">Instant Video Calls</p>
              <p className="text-sm text-gray-600">Receive call notifications even when app is closed</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-gray-800">Course Updates</p>
              <p className="text-sm text-gray-600">Stay updated on new materials and announcements</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-semibold text-red-800">Failed to enable notifications</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-700 mt-2">
                  Please check your browser settings and allow notifications for this site.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleEnableNotifications}
            disabled={isInitializing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isInitializing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enabling...
              </>
            ) : (
              <>
                <Bell size={20} />
                Enable Notifications
              </>
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            disabled={isInitializing}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-50"
          >
            Maybe Later
          </button>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can change notification settings anytime in your profile
        </p>
      </div>
    </div>
  );
};

// Optional: Simple notification badge component
export const NotificationBadge = () => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      if ('Notification' in window) {
        setHasPermission(Notification.permission === 'granted');
      }
    };

    checkPermission();
    
    // Check every 2 seconds in case user changes permission
    const interval = setInterval(checkPermission, 2000);
    
    return () => clearInterval(interval);
  }, []);

  if (hasPermission) {
    return null; // Don't show anything if notifications are enabled
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
      <div className="flex items-center gap-2">
        <Bell className="text-yellow-600" size={20} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-800">
            Enable notifications to never miss a message
          </p>
        </div>
        <button
          onClick={async () => {
            await initializeFCM();
            setHasPermission(true);
          }}
          className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition"
        >
          Enable
        </button>
      </div>
    </div>
  );
};

export default FCMInitializer;