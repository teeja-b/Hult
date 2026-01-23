// public/firebase-messaging-sw.js
// COMPLETE FIXED VERSION - Handles video call notifications properly

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ⚠️ YOUR FIREBASE CONFIG
firebase.initializeApp({
  apiKey: "AIzaSyCyRnk60Muh93DtWVbrmO3jn8WsVKZDSas",
  authDomain: "educonnect-821e7.firebaseapp.com",
  projectId: "educonnect-821e7",
  storageBucket: "educonnect-821e7.firebasestorage.app",
  messagingSenderId: "1004307512502",
  appId: "1:1004307512502:web:ff5eaae9f3a01eb5ff3a17",
});

const messaging = firebase.messaging();

// ============================================================================
// BACKGROUND MESSAGE HANDLER
// ============================================================================

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📨 Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || '🔔 EduConnect';
  const notificationBody = payload.notification?.body || '';
  const data = payload.data || {};
  
  const notificationOptions = {
    body: notificationBody,
    icon: payload.notification?.icon || '/logo192.png',
    badge: '/logo192.png',
    image: payload.notification?.image || null,
    tag: data.type || 'general',
    renotify: true,
    requireInteraction: data.type === 'call',
    silent: false,
    vibrate: data.type === 'call' 
      ? [200, 100, 200, 100, 200]
      : [100, 50, 100],
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'en',
    data: {
      url: data.url || data.click_action || '/',
      meeting_id: data.meeting_id || data.meetingId || '',
      join_url: data.join_url || data.joinUrl || '',  // ✅ Critical for video calls
      conversation_id: data.conversation_id || data.conversationId || '',
      type: data.type || 'general',
      timestamp: data.timestamp || new Date().toISOString()
    },
    actions: getActionsForType(data.type, data)
  };

  console.log('[SW] 📱 Showing notification with options:', notificationOptions);
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================================================
// ACTION BUTTONS BASED ON TYPE
// ============================================================================

function getActionsForType(type, data) {
  console.log('[SW] 🎯 Getting actions for type:', type);
  
  switch (type) {
    case 'call':
      return [
        { 
          action: 'answer', 
          title: '✅ Answer Call',
          icon: '/icons/answer.png'
        },
        { 
          action: 'decline', 
          title: '❌ Decline',
          icon: '/icons/decline.png'
        }
      ];
      
    case 'message':
      return [
        { 
          action: 'open', 
          title: '👁️ View Message',
          icon: '/icons/view.png'
        }
      ];
      
    case 'test':
      return [
        { 
          action: 'open', 
          title: '🚀 Open App',
          icon: '/icons/open.png'
        }
      ];
      
    default:
      return [
        { 
          action: 'open', 
          title: '📱 Open',
          icon: '/icons/open.png'
        }
      ];
  }
}

// ============================================================================
// NOTIFICATION CLICK HANDLER - CRITICAL FOR VIDEO CALLS
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️ Notification clicked!');
  console.log('[SW] Action:', event.action);
  console.log('[SW] Data:', event.notification.data);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  let urlToOpen = '/';
  
  // ✅ DETERMINE URL BASED ON ACTION
  if (action === 'answer') {
    // ✅ ANSWER CALL - GO TO VIDEO CALL WITH BOTH PARAMS
    console.log('[SW] 📞 Answer clicked!');
    const meetingId = data.meeting_id || data.meetingId;
    const joinUrl = data.join_url || data.joinUrl;
    
    if (meetingId && joinUrl) {
      // ✅ PASS BOTH PARAMETERS - This is critical!
      urlToOpen = `/?meetingId=${meetingId}&joinUrl=${encodeURIComponent(joinUrl)}`;
      console.log('[SW] 🎥 Opening video call:', urlToOpen);
    } else {
      console.error('[SW] ❌ Missing meeting ID or join URL!', { meetingId, joinUrl });
      urlToOpen = '/';
    }
    
  } else if (action === 'decline') {
    // ✅ DECLINE CALL - JUST CLOSE
    console.log('[SW] ❌ Call declined');
    
    const meetingId = data.meeting_id || data.meetingId;
    if (meetingId) {
      fetch('https://hult.onrender.com/api/video/decline-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId })
      }).catch(err => console.error('[SW] Failed to send decline:', err));
    }
    
    return; // Don't open any window
    
  } else if (action === 'open' || action === 'view') {
    // ✅ OPEN MESSAGE OR APP
    console.log('[SW] 📱 Open clicked!');
    
    if (data.type === 'call') {
      const meetingId = data.meeting_id || data.meetingId;
      const joinUrl = data.join_url || data.joinUrl;
      urlToOpen = (meetingId && joinUrl) 
        ? `/?meetingId=${meetingId}&joinUrl=${encodeURIComponent(joinUrl)}` 
        : '/';
    } else if (data.type === 'message') {
      const conversationId = data.conversation_id || data.conversationId;
      urlToOpen = conversationId ? `/messages/${conversationId}` : '/messages';
    } else {
      urlToOpen = data.url || data.click_action || '/';
    }
    
  } else {
    // ✅ DEFAULT CLICK (notification body)
    console.log('[SW] 📲 Notification body clicked');
    
    if (data.type === 'call') {
      const meetingId = data.meeting_id || data.meetingId;
      const joinUrl = data.join_url || data.joinUrl;
      urlToOpen = (meetingId && joinUrl) 
        ? `/?meetingId=${meetingId}&joinUrl=${encodeURIComponent(joinUrl)}` 
        : '/';
    } else if (data.type === 'message') {
      const conversationId = data.conversation_id || data.conversationId;
      urlToOpen = conversationId ? `/messages/${conversationId}` : '/messages';
    } else {
      urlToOpen = data.url || data.click_action || '/';
    }
  }
  
  console.log('[SW] 🌐 Final URL to open:', urlToOpen);
  
  // ✅ OPEN THE URL IN PWA
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((clientList) => {
      console.log('[SW] 📋 Found', clientList.length, 'windows');
      
      // Check if PWA is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        
        console.log('[SW] Checking client:', clientUrl.href);
        
        // If same origin, navigate existing window
        if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
          console.log('[SW] ✅ Navigating existing window to:', urlToOpen);
          return client.navigate(urlToOpen).then(client => client.focus());
        }
      }
      
      // No existing window found, open new one
      if (clients.openWindow) {
        console.log('[SW] 🪟 Opening new window:', urlToOpen);
        
        const fullUrl = urlToOpen.startsWith('http') 
          ? urlToOpen 
          : self.location.origin + urlToOpen;
        
        return clients.openWindow(fullUrl);
      }
    })
    .then(windowClient => {
      console.log('[SW] ✅ Window opened successfully:', windowClient);
    })
    .catch(error => {
      console.error('[SW] ❌ Error opening window:', error);
    })
  );
});

// ============================================================================
// NOTIFICATION CLOSE HANDLER
// ============================================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 🚫 Notification closed');
  
  const data = event.notification.data || {};
  
  if (data.type === 'call') {
    console.log('[SW] 📞 Call notification dismissed');
    
    const meetingId = data.meeting_id || data.meetingId;
    if (meetingId) {
      fetch('https://hult.onrender.com/api/video/missed-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId })
      }).catch(err => console.error('[SW] Failed to log missed call:', err));
    }
  }
});

// ============================================================================
// SERVICE WORKER LIFECYCLE
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Installing service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service worker activated');
  event.waitUntil(clients.claim());
});

// ============================================================================
// PUSH EVENT (backup handler)
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Push event received');
  
  if (!event.data) {
    console.log('[SW] No data in push');
    return;
  }
  
  try {
    const payload = event.data.json();
    console.log('[SW] Push payload:', payload);
  } catch (e) {
    console.error('[SW] Error parsing push:', e);
  }
});