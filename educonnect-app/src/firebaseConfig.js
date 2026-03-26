// src/firebaseConfig.js - FIXED VERSION
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCyRnk60Muh93DtWVbrmO3jn8WsVKZDSas",
  authDomain: "educonnect-821e7.firebaseapp.com",
  projectId: "educonnect-821e7",
  storageBucket: "educonnect-821e7.firebasestorage.app",
  messagingSenderId: "1004307512502",
  appId: "1:1004307512502:web:ff5eaae9f3a01eb5ff3a17",
  measurementId: "G-4CSVJ017JB"
};

function triggerVibration(pattern = [200, 100, 200]) {
  try {
    if ('vibrate' in navigator) {
      const success = navigator.vibrate(pattern);
      console.log('📳 [VIBRATE] Triggered:', pattern, 'Success:', success);
      return success;
    } else {
      console.warn('⚠️ [VIBRATE] API not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ [VIBRATE] Error:', error);
    return false;
  }
}
// 🔥 CRITICAL: Make sure this VAPID key matches your Firebase Console
const VAPID_KEY = 'BFQpL8IdUKwyIhGevetM_Ayo7gZPDmHsm4UyHq0DVpuxr9K9lViXsp6eYCAgsL8pSfR-DoP9feY3fDB_Lfo6S-Y';
// 🎵 RINGTONE MANAGER
let ringtoneAudio = null;

function playRingtone() {
  try {
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }
    
    // Put your ringtone file in public/sounds/ringtone.mp3
    ringtoneAudio = new Audio('/sounds/ringtone.mp3');
    ringtoneAudio.loop = true; // Keep ringing until answered/declined
    ringtoneAudio.volume = 1.0;
    
    ringtoneAudio.play().catch(err => {
      console.error('❌ [RINGTONE] Failed to play:', err);
    });
    
    console.log('🎵 [RINGTONE] Playing...');
  } catch (error) {
    console.error('❌ [RINGTONE] Error:', error);
  }
}

function stopRingtone() {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
    console.log('🎵 [RINGTONE] Stopped');
  }
}



const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Request notification permission and get FCM token - FIXED
 */
export async function requestNotificationPermission() {
  try {
    console.log('🔔 [FCM] Requesting notification permission...');
    
    // Check browser support
    if (!('Notification' in window)) {
      console.error('❌ [FCM] Browser does not support notifications');
      alert('Your browser does not support notifications');
      return null;
    }
    
    if (!('serviceWorker' in navigator)) {
      console.error('❌ [FCM] Service Worker not supported');
      alert('Your browser does not support service workers');
      return null;
    }
    
    // 🔥 FIX 1: Check current permission state
    console.log('🔔 [FCM] Current permission state:', Notification.permission);
    
    if (Notification.permission === 'denied') {
      console.error('❌ [FCM] Notifications are blocked. Please enable them in browser settings.');
      alert('Notifications are blocked. Please enable them in your browser settings:\n\n' +
            '1. Click the lock icon in the address bar\n' +
            '2. Find "Notifications"\n' +
            '3. Change to "Allow"');
      return null;
    }
    
    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      console.log('🔔 [FCM] Permission response:', permission);
      
      if (permission !== 'granted') {
        console.warn('⚠️ [FCM] Permission denied by user');
        return null;
      }
    }
    
    console.log('✅ [FCM] Notification permission granted');
    
    // 🔥 FIX 2: Register service worker with better error handling
    try {
      console.log('🔔 [FCM] Registering service worker...');
      
      // Unregister any existing service workers first (clean start)
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of existingRegistrations) {
        console.log('🔔 [FCM] Unregistering existing SW:', registration.scope);
        await registration.unregister();
      }
      
      // Register new service worker
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { 
          scope: '/',
          updateViaCache: 'none' // Force fresh download
        }
      );
      
      console.log('✅ [FCM] Service Worker registered:', registration.scope);
      console.log('🔔 [FCM] SW state:', registration.active?.state);
      
      // 🔥 FIX 3: Wait for service worker to be ACTIVE
      await navigator.serviceWorker.ready;
      console.log('✅ [FCM] Service Worker is ready');
      
      // Small delay to ensure SW is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 🔥 FIX 4: Get FCM token with better error handling
      console.log('🔔 [FCM] Getting FCM token...');
      console.log('🔔 [FCM] Using VAPID key:', VAPID_KEY.substring(0, 20) + '...');
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (token) {
        console.log('✅ [FCM] Token obtained:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.error('❌ [FCM] No token returned');
        return null;
      }
      
    } catch (swError) {
      console.error('❌ [FCM] Service Worker/Token error:', swError);
      console.error('Error details:', {
        code: swError.code,
        message: swError.message,
        stack: swError.stack
      });
      
      // Show user-friendly error
      if (swError.code === 'messaging/permission-blocked') {
        alert('Notifications are blocked. Please enable them in browser settings.');
      } else if (swError.code === 'messaging/failed-service-worker-registration') {
        alert('Failed to register notification service. Please refresh the page.');
      } else {
        alert('Failed to enable notifications. Please try again or refresh the page.');
      }
      
      return null;
    }
    
  } catch (error) {
    console.error('❌ [FCM] Permission request error:', error);
    return null;
  }
}

/**
 * Register FCM token with backend - FIXED
 */
export async function registerFCMToken(token) {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://educonnect-92gb.onrender.com';
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      console.error('❌ [FCM] No auth token found');
      return false;
    }
    
    console.log('🔔 [FCM] Registering token with backend...');
    console.log('🔔 [FCM] API URL:', apiUrl);
    
    const response = await fetch(`${apiUrl}/api/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ 
        token,
        device_type: 'web'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ [FCM] Token registered with backend:', data);
      localStorage.setItem('fcm_token', token);
      return true;
    } else {
      console.error('❌ [FCM] Backend registration failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ [FCM] Backend registration error:', error);
    return false;
  }
}

/**
 * Unregister FCM token
 */
export async function unregisterFCMToken() {
  try {
    const token = localStorage.getItem('fcm_token');
    
    if (!token) {
      console.log('⚠️ [FCM] No token to unregister');
      return true;
    }
    
    const apiUrl = process.env.REACT_APP_API_URL || 'https://educonnect-92gb.onrender.com';
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      localStorage.removeItem('fcm_token');
      return true;
    }
    
    const response = await fetch(`${apiUrl}/api/notifications/unregister-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      console.log('✅ [FCM] Token unregistered');
      localStorage.removeItem('fcm_token');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ [FCM] Unregister error:', error);
    return false;
  }
}

/**
 * Setup foreground message listener - ENHANCED
 */
export function setupForegroundMessageListener(callback) {
  console.log('🔔 [FCM] Setting up foreground message listener');
  
  onMessage(messaging, (payload) => {
    console.log('📨 [FCM] Foreground message received:', payload);
    
    const notification = payload.notification || {};
    const data = payload.data || {};
    
    // 🎵 PLAY RINGTONE FOR CALLS
    if (data.type === 'call') {
      playRingtone();
      // ✅ VIBRATE FOR CALLS - Long pattern
      triggerVibration([500, 250, 500, 250, 500, 250, 500]);
    } else {
      // ✅ VIBRATE FOR OTHER NOTIFICATIONS - Short pattern
      triggerVibration([200, 100, 200]);
    }
    
    if (Notification.permission === 'granted') {
      const title = notification.title || data.title || 'New notification';
      const options = {
        body: notification.body || data.body || '',
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: data.type || 'general',
        requireInteraction: data.type === 'call',
        vibrate: data.type === 'call' 
          ? [500, 250, 500, 250, 500, 250, 500] 
          : [200, 100, 200],
        data: data,
        silent: false // ✅ IMPORTANT: Set to false
      };
      
      console.log('🔔 [FCM] Showing notification:', title);
      
      const notif = new Notification(title, options);
      
      notif.onclick = function(event) {
        event.preventDefault();
        console.log('🔔 [FCM] Notification clicked');
        
        // Stop ringtone when notification is clicked
        if (data.type === 'call') {
          stopRingtone();
        }
        
        const url = data.url || '/';
        window.focus();
        window.location.href = url;
        
        notif.close();
      };
      
      notif.onclose = function() {
        // Stop ringtone when notification is closed
        if (data.type === 'call') {
          stopRingtone();
        }
      };
    }
    
    if (callback) {
      callback(payload);
    }
  });
}

/**
 * Initialize FCM - ENHANCED WITH DEBUGGING
 */
export async function initializeFCM(onMessageCallback) {
  try {
    console.log('\n' + '🔔'.repeat(35));
    console.log('🚀 [FCM] Initializing FCM...');
    console.log('🔔'.repeat(35));
    
    // Check if user is logged in
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      console.log('⚠️ [FCM] User not logged in, skipping');
      return false;
    }
    
    // Check browser support
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.error('❌ [FCM] Browser not supported');
      return false;
    }
    
    // Check if already initialized
    const existingToken = localStorage.getItem('fcm_token');
    if (existingToken) {
      console.log('✅ [FCM] Already initialized with token:', existingToken.substring(0, 20) + '...');
      setupForegroundMessageListener(onMessageCallback);
      return true;
    }
    
    // Request permission and get token
    const token = await requestNotificationPermission();
    
    if (!token) {
      console.error('❌ [FCM] Failed to get token');
      return false;
    }
    
    // Register with backend
    const registered = await registerFCMToken(token);
    
    if (!registered) {
      console.warn('⚠️ [FCM] Token not registered with backend, but continuing...');
    }
    
    // Setup message listener
    setupForegroundMessageListener(onMessageCallback);
    
    console.log('✅ [FCM] Initialization complete!');
    console.log('🔔'.repeat(35) + '\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ [FCM] Initialization error:', error);
    console.error('Error stack:', error.stack);
    return false;
  }
}

/**
 * Test notification function
 */
export async function sendTestNotification() {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://educonnect-92gb.onrender.com';
    const authToken = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!authToken || !userId) {
      console.error('❌ [TEST] Not logged in');
      alert('Please log in first');
      return false;
    }
    
    console.log('🔔 [TEST] Sending test notification...');
    
    // Send test notification to yourself
    const response = await fetch(`${apiUrl}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        title: 'Test Notification',
        body: 'This is a test notification from EduConnect',
        type: 'test'
      })
    });
    
    const data = await response.json();
    console.log('🔔 [TEST] Response:', data);
    
    if (response.ok) {
      alert('Test notification sent! Check if you received it.');
      return true;
    } else {
      alert('Failed to send test notification: ' + (data.error || 'Unknown error'));
      return false;
    }
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    alert('Error sending test notification');
    return false;
  }
}

export { messaging, getToken, onMessage, playRingtone, stopRingtone };