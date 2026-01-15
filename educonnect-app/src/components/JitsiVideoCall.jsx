import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, PhoneOff, Phone, X, Users, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const DailyVideoCall = ({ currentUserId, selectedTutor, currentUserName = 'Student' }) => {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [currentMeetingUrl, setCurrentMeetingUrl] = useState('');
  const [currentMeetingId, setCurrentMeetingId] = useState('');
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callRinging, setCallRinging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [participantCount, setParticipantCount] = useState(0);
  const [callError, setCallError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [dailyLoaded, setDailyLoaded] = useState(false);
  const [containerReady, setContainerReady] = useState(false);

  const socketRef = useRef(null);
  const callFrameRef = useRef(null);
  const dailyContainerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const participantUpdateTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Detect if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check if Daily.co is loaded
  useEffect(() => {
    const checkDailyLoaded = () => {
      if (window.DailyIframe) {
        console.log('✅ [DAILY] Daily.co is available');
        setDailyLoaded(true);
        return true;
      }
      return false;
    };

    if (!checkDailyLoaded()) {
      const interval = setInterval(() => {
        if (checkDailyLoaded()) {
          clearInterval(interval);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, []);

  // Monitor container readiness
  useEffect(() => {
    if (isVideoCallOpen && dailyContainerRef.current) {
      setContainerReady(true);
      console.log('✅ [DAILY] Container is ready');
    } else {
      setContainerReady(false);
    }
  }, [isVideoCallOpen]);

  // Memoized socket event handlers
  const handleIncomingCall = useCallback((callData) => {
    console.log('📞 [VIDEO] Incoming call:', callData);
    setIncomingCall(callData);
    setCallRinging(true);
  }, []);

  const handleCallEnded = useCallback(({ meetingId }) => {
    console.log(`🔴 [VIDEO] Call ended: ${meetingId}`);
    if (currentMeetingId === meetingId) {
      endVideoCall();
    }
  }, [currentMeetingId]);

  const handleCallDeclined = useCallback(() => {
    console.log('❌ [VIDEO] Call declined');
    setIsCreatingCall(false);
    alert('Call was declined');
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    if (!currentUserId) {
      console.error('❌ [SOCKET] No currentUserId provided');
      return;
    }

    console.log(`🔌 [SOCKET] Initializing connection for user ${currentUserId}`);
    
    const socket = io(API_URL, {
      auth: { userId: currentUserId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`✅ [SOCKET] Connected! Socket ID: ${socket.id}`);
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ [SOCKET] Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });

    socket.on('incoming_video_call', handleIncomingCall);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_declined', handleCallDeclined);

    return () => {
      socket.off('incoming_video_call', handleIncomingCall);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_declined', handleCallDeclined);
      if (socket) socket.disconnect();
    };
  }, [currentUserId, handleIncomingCall, handleCallEnded, handleCallDeclined]);

  // Load Daily.co script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.DailyIframe) {
      console.log('📦 [DAILY] Loading Daily.co script...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        console.log('✅ [DAILY] Script loaded successfully');
        setDailyLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ [DAILY] Failed to load script');
        setCallError('Failed to load video library');
      };
    } else if (window.DailyIframe) {
      setDailyLoaded(true);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (participantUpdateTimeoutRef.current) {
        clearTimeout(participantUpdateTimeoutRef.current);
      }
      if (callFrameRef.current) {
        try {
          callFrameRef.current.destroy();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, []);

  const startVideoCall = async () => {
    if (!selectedTutor) {
      alert('Please select a tutor first');
      return;
    }

    if (!dailyLoaded) {
      alert('Video system is still loading. Please wait a moment...');
      return;
    }

    if (connectionStatus !== 'connected') {
      alert('Connection not ready. Please wait...');
      return;
    }

    console.log('📞 [VIDEO] Starting video call');
    setIsCreatingCall(true);
    setCallError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      console.log('🔐 [VIDEO] Creating Daily.co room...');

      const response = await fetch(`${API_URL}/api/video/create-daily-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callerId: currentUserId,
          receiverId: selectedTutor.user_id,
          callerName: currentUserName,
          receiverName: selectedTutor.name,
          maxParticipants: 15,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create room (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ [VIDEO] Room created:', data);

      if (!data.roomUrl || !data.roomName) {
        throw new Error('Invalid room data received');
      }

      setCurrentMeetingUrl(data.roomUrl);
      setCurrentMeetingId(data.roomName);
      setIsVideoCallOpen(true);

      // Wait longer for container to mount and stabilize
      setTimeout(() => {
        if (isMountedRef.current) {
          initializeDailyCall(data.roomUrl);
        }
      }, 300);

      // Notify tutor
      if (socketRef.current?.connected) {
        console.log('📡 [VIDEO] Notifying receiver...');
        socketRef.current.emit('initiate_video_call', {
          meetingId: data.roomName,
          callerId: currentUserId,
          receiverId: selectedTutor.user_id,
          callerName: currentUserName,
          joinUrl: data.roomUrl,
        });
      }

    } catch (error) {
      console.error('❌ [VIDEO] Call failed:', error);
      setCallError(error.message);
      setIsVideoCallOpen(false);
      alert(`Failed to start call: ${error.message}`);
    } finally {
      setIsCreatingCall(false);
    }
  };

  const initializeDailyCall = async (roomUrl) => {
    console.log('🎥 [DAILY] initializeDailyCall called');
    
    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('⏸️ [DAILY] Component unmounted, skipping initialization');
      return;
    }

    // Prevent duplicate initialization
    if (isInitializingRef.current) {
      console.log('⏸️ [DAILY] Already initializing, skipping...');
      return;
    }

    // Destroy existing frame if any
    if (callFrameRef.current) {
      console.log('🗑️ [DAILY] Destroying existing frame...');
      try {
        await callFrameRef.current.destroy();
        callFrameRef.current = null;
        console.log('✅ [DAILY] Old frame destroyed');
      } catch (e) {
        console.log('Warning: Error destroying old frame:', e);
        callFrameRef.current = null;
      }
      // Wait a bit after destroying
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!window.DailyIframe) {
      console.error('❌ [DAILY] Daily.co not available');
      setCallError('Video library not loaded');
      return;
    }

    if (!dailyContainerRef.current) {
      console.error('❌ [DAILY] Container not ready');
      setCallError('Video container not ready');
      return;
    }

    isInitializingRef.current = true;
    console.log('🎥 [DAILY] Creating call frame...');
    setIsJoining(true);

    try {
      // Verify container is still valid
      if (!dailyContainerRef.current || !isMountedRef.current) {
        throw new Error('Container became invalid');
      }

      console.log('📦 [DAILY] Container element:', dailyContainerRef.current);
      console.log('📦 [DAILY] Container parent:', dailyContainerRef.current.parentElement);

      // Mobile-optimized settings
      const callFrame = window.DailyIframe.createFrame(dailyContainerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '0'
        },
        showLeaveButton: true,
        showFullscreenButton: !isMobile,
        showLocalVideo: true,
        showParticipantsBar: !isMobile
      });

      console.log('✅ [DAILY] Frame created successfully');
      callFrameRef.current = callFrame;

      // Set up event listeners
      callFrame.on('loaded', () => {
        console.log('✅ [DAILY] Frame loaded');
      });

      callFrame.on('joining-meeting', () => {
        console.log('🔄 [DAILY] Joining meeting...');
      });

      callFrame.on('joined-meeting', () => {
        console.log('✅ [DAILY] Successfully joined meeting!');
        if (isMountedRef.current) {
          setIsJoining(false);
          setCallError(null);
          isInitializingRef.current = false;
          updateParticipantCount();
        }
      });

      callFrame.on('participant-joined', () => {
        updateParticipantCount();
      });

      callFrame.on('participant-left', () => {
        updateParticipantCount();
      });

      callFrame.on('left-meeting', () => {
        console.log('🔴 [DAILY] Left meeting');
        if (isMountedRef.current) {
          setIsJoining(false);
          isInitializingRef.current = false;
        }
      });

      callFrame.on('error', (error) => {
        console.error('❌ [DAILY] Error:', error);
        isInitializingRef.current = false;
        
        if (isMountedRef.current) {
          if (error.errorMsg === 'account-missing-payment-method') {
            setCallError('Daily.co account requires payment method setup. Please contact your administrator.');
          } else {
            setCallError(`Call error: ${error.errorMsg || 'Unknown error'}`);
          }
          setIsJoining(false);
        }
      });

      // Join with mobile-optimized settings
      console.log('🎥 [DAILY] Attempting to join room:', roomUrl);
      await callFrame.join({
        url: roomUrl,
        userName: currentUserName || 'User',
        showLeaveButton: true,
        showFullscreenButton: !isMobile
      });

      console.log('✅ [DAILY] Join request sent successfully');

    } catch (error) {
      console.error('❌ [DAILY] Failed to initialize:', error);
      console.error('❌ [DAILY] Error stack:', error.stack);
      isInitializingRef.current = false;
      
      if (isMountedRef.current) {
        let errorMessage = 'Failed to join call';
        
        if (error.message && error.message.includes('Duplicate DailyIframe')) {
          errorMessage = 'Video call already in progress. Please refresh the page.';
        } else if (error.message && error.message.includes('postMessage')) {
          errorMessage = 'Video initialization failed. Please try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setCallError(errorMessage);
        setIsJoining(false);
      }
    }
  };

  // Debounced participant count update
  const updateParticipantCount = useCallback(() => {
    if (participantUpdateTimeoutRef.current) {
      clearTimeout(participantUpdateTimeoutRef.current);
    }

    participantUpdateTimeoutRef.current = setTimeout(() => {
      if (callFrameRef.current && isMountedRef.current) {
        try {
          const participants = callFrameRef.current.participants();
          const count = Object.keys(participants).length;
          setParticipantCount(count);
        } catch (e) {
          console.error('Error getting participants:', e);
        }
      }
    }, 300);
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    if (!dailyLoaded) {
      alert('Video system not ready yet');
      return;
    }

    console.log('✅ [VIDEO] Accepting call');

    setCurrentMeetingUrl(incomingCall.joinUrl);
    setCurrentMeetingId(incomingCall.meetingId);
    setIsVideoCallOpen(true);
    setCallRinging(false);

    setTimeout(() => {
      if (isMountedRef.current) {
        initializeDailyCall(incomingCall.joinUrl);
      }
    }, 300);

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_accepted', {
        meetingId: incomingCall.meetingId,
        acceptedBy: currentUserId,
        callerId: incomingCall.callerId,
      });
    }

    setIncomingCall(null);
  }, [incomingCall, dailyLoaded, currentUserId]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;

    console.log('❌ [VIDEO] Declining call');

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_declined', {
        meetingId: incomingCall.meetingId,
        declinedBy: currentUserId,
        callerId: incomingCall.callerId,
      });
    }

    setCallRinging(false);
    setIncomingCall(null);
  }, [incomingCall, currentUserId]);

  const endVideoCall = useCallback(async () => {
    console.log('🔴 [VIDEO] Ending call');

    if (callFrameRef.current) {
      try {
        await callFrameRef.current.leave();
        await callFrameRef.current.destroy();
        console.log('✅ [VIDEO] Frame destroyed successfully');
      } catch (e) {
        console.error('Error cleaning up:', e);
      }
      callFrameRef.current = null;
    }

    // Reset initialization flag
    isInitializingRef.current = false;

    const meetingId = currentMeetingId;
    const otherUserId = selectedTutor?.user_id || incomingCall?.callerId;

    // Clear container for next call
    if (dailyContainerRef.current) {
      dailyContainerRef.current.innerHTML = '';
    }

    // Reset all state
    setIsVideoCallOpen(false);
    setCurrentMeetingUrl('');
    setCurrentMeetingId('');
    setParticipantCount(0);
    setCallError(null);
    setIsJoining(false);
    setContainerReady(false);

    if (socketRef.current?.connected && meetingId) {
      socketRef.current.emit('end_video_call', {
        meetingId,
        endedBy: currentUserId,
        otherUserId,
      });
    }
  }, [currentMeetingId, selectedTutor, incomingCall, currentUserId]);

  return (
    <>
      {/* Call Button */}
      {selectedTutor && !isVideoCallOpen && (
        <div>
          <button
            onClick={startVideoCall}
            disabled={isCreatingCall || connectionStatus !== 'connected' || !dailyLoaded}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Video size={20} />
            {isCreatingCall ? 'Starting...' : 
             !dailyLoaded ? 'Loading...' :
             connectionStatus !== 'connected' ? 'Connecting...' : 
             'Start Video Call'}
          </button>
          {!dailyLoaded && (
            <p className="text-xs text-gray-500 mt-1">Loading video system...</p>
          )}
        </div>
      )}

      {/* Incoming Call Modal */}
      {callRinging && incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Video className="text-blue-600" size={isMobile ? 40 : 48} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Incoming Video Call</h2>
              <p className="text-gray-600">{incomingCall.callerName} is calling...</p>
            </div>

            <div className="flex gap-3 sm:gap-4 justify-center">
              <button
                onClick={declineCall}
                className="flex items-center gap-2 bg-red-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-red-700 active:bg-red-800 transition touch-manipulation"
              >
                <PhoneOff size={18} /> Decline
              </button>
              <button
                onClick={acceptCall}
                disabled={!dailyLoaded}
                className="flex items-center gap-2 bg-green-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-green-700 active:bg-green-800 transition disabled:opacity-50 touch-manipulation"
              >
                <Phone size={18} /> {dailyLoaded ? 'Accept' : 'Loading...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Window */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          {/* Header - Compact on mobile */}
          <div className="bg-gray-800 text-white p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <Video className="text-green-500 flex-shrink-0" size={isMobile ? 20 : 24} />
                <h2 className="text-sm sm:text-lg font-semibold truncate">
                  {selectedTutor?.name || incomingCall?.callerName || 'Video Call'}
                </h2>
              </div>

              {!isMobile && (
                <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full">
                  <Users size={16} />
                  <span className="text-sm">{participantCount}</span>
                </div>
              )}

              {isJoining && (
                <span className="text-xs sm:text-sm text-yellow-400">Connecting...</span>
              )}
            </div>

            <button 
              onClick={endVideoCall} 
              className="p-2 hover:bg-gray-700 active:bg-gray-600 rounded-full transition touch-manipulation flex-shrink-0"
              title="End call"
            >
              <X size={isMobile ? 20 : 24} />
            </button>
          </div>

          {/* Video Container */}
          <div className="flex-1 relative bg-gray-900 overflow-hidden">
            <div 
              ref={dailyContainerRef} 
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            />

            {/* Error Display */}
            {callError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 p-4">
                <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 sm:p-6 max-w-md w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
                    <h3 className="text-white font-semibold">Call Error</h3>
                  </div>
                  <p className="text-red-200 text-sm sm:text-base mb-4">{callError}</p>
                  <button
                    onClick={endVideoCall}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 active:bg-red-800 transition w-full touch-manipulation"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls - Compact on mobile */}
          <div className="bg-gray-800 p-3 sm:p-4 flex items-center justify-center">
            <button
              onClick={endVideoCall}
              className="flex items-center gap-2 bg-red-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full hover:bg-red-700 active:bg-red-800 transition touch-manipulation"
            >
              <PhoneOff size={18} /> Leave Call
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyVideoCall;