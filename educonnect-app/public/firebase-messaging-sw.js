// public/firebase-messaging-sw.js
// This handles FCM notifications when your PWA is in the background

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// ============================================================================
// BACKGROUND MESSAGE HANDLER
// ============================================================================

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'EduConnect';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo192.png',
    badge: payload.notification?.badge || '/logo192.png',
    tag: payload.data?.type || 'general',
    requireInteraction: payload.data?.type === 'call',
    vibrate: payload.data?.type === 'call' ? [200, 100, 200, 100, 200] : [100, 50, 100],
    data: payload.data,
    
    // ✅ ACTION BUTTONS - Different for each notification type
    actions: getActionsForType(payload.data?.type, payload.data)
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});


// ============================================================================
// HELPER: GET ACTIONS BASED ON NOTIFICATION TYPE
// ============================================================================

function getActionsForType(type, data) {
  switch (type) {
    case 'call':
      return [
        { action: 'answer', title: '✅ Answer', icon: '/icons/answer.png' },
        { action: 'decline', title: '❌ Decline', icon: '/icons/decline.png' }
      ];
      
    case 'message':
      return [
        { action: 'view', title: '👁️ View', icon: '/icons/view.png' },
        { action: 'reply', title: '📝 Reply', icon: '/icons/reply.png' }
      ];
      
    case 'test':
      return [
        { action: 'open', title: '🚀 Open App', icon: '/icons/open.png' }
      ];
      
    default:
      return [
        { action: 'open', title: '📱 Open', icon: '/icons/open.png' }
      ];
  }
}


// ============================================================================
// NOTIFICATION CLICK HANDLER - HANDLES ACTIONS
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  console.log('[Service Worker] Action clicked:', action);
  console.log('[Service Worker] Notification data:', data);
  
  // ✅ DETERMINE WHERE TO REDIRECT
  let urlToOpen = '/';
  
  // Handle different actions
  switch (action) {
    case 'answer':
      // ✅ ANSWER CALL - Redirect to video call with meeting ID
      const meetingId = data.meeting_id || data.meetingId;
      if (meetingId) {
        urlToOpen = `/video-call?meetingId=${meetingId}`;
      }
      console.log('[Service Worker] Opening video call:', urlToOpen);
      break;
      
    case 'decline':
      // ✅ DECLINE CALL - Just close notification, optionally send decline signal
      console.log('[Service Worker] Call declined');
      // Optional: Send API request to notify caller
      // fetch('/api/video/decline-call', { method: 'POST', body: JSON.stringify({ meetingId: data.meeting_id }) });
      return; // Don't open any window
      
    case 'view':
    case 'reply':
      // ✅ VIEW/REPLY MESSAGE - Open messages
      const conversationId = data.conversation_id || data.conversationId;
      if (conversationId) {
        urlToOpen = `/messages/${conversationId}`;
      } else {
        urlToOpen = '/messages';
      }
      console.log('[Service Worker] Opening messages:', urlToOpen);
      break;
      
    case 'open':
    default:
      // ✅ DEFAULT - Use the URL from notification data or click_action
      urlToOpen = data.url || data.click_action || '/';
      console.log('[Service Worker] Opening default URL:', urlToOpen);
      break;
  }
  
  // ✅ OPEN URL IN PWA
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if PWA is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          
          // If PWA is already open, navigate it and focus
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            console.log('[Service Worker] PWA already open, navigating to:', urlToOpen);
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // If PWA is not open, open new window
        console.log('[Service Worker] Opening new PWA window:', urlToOpen);
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});


// ============================================================================
// NOTIFICATION CLOSE HANDLER (Optional)
// ============================================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
  
  // Optional: Track notification dismissals
  const data = event.notification.data || {};
  
  if (data.type === 'call') {
    console.log('[Service Worker] Call notification dismissed');
    // Optional: Send API request to notify caller
    // fetch('/api/video/missed-call', { method: 'POST', body: JSON.stringify({ meetingId: data.meeting_id }) });
  }
});


// ============================================================================
// PUSH EVENT HANDLER (Alternative to onBackgroundMessage)
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }
  
  try {
    const payload = event.data.json();
    console.log('[Service Worker] Push payload:', payload);
    
    // This is handled by onBackgroundMessage above
    // But you can add custom logic here if needed
    
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
  }
});


// ============================================================================
// INSTALL & ACTIVATE HANDLERS (Optional - for PWA caching)
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});