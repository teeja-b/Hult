import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, PhoneOff, Phone, X, Users, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const DailyVideoCall = ({ 
  currentUserId, 
  selectedTutor, 
  currentUserName = 'Student',
  autoJoinMeetingId = null,
  autoJoinUrl = null,
  onCallEnded = null
 }) => {
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
  const [containerMounted, setContainerMounted] = useState(false);

  const socketRef = useRef(null);
  const callFrameRef = useRef(null);
  const dailyContainerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const participantUpdateTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const autoJoinAttemptedRef = useRef(false);
  const pendingJoinUrl = useRef(null);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Track component mount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Track container mount
  useEffect(() => {
    if (isVideoCallOpen && dailyContainerRef.current) {
      console.log('✅ [DAILY] Container mounted');
      setContainerMounted(true);
    } else {
      setContainerMounted(false);
    }
  }, [isVideoCallOpen]);

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

  // Memoized socket event handlers
  const handleIncomingCall = useCallback((callData) => {
    console.log('📞 [VIDEO] Incoming call:', callData);
    setIncomingCall(callData);
    setCallRinging(true);
  }, []);

  const handleCallEnded = useCallback(({ meetingId }) => {
    console.log(`🔴 [VIDEO] Call ended: ${meetingId}`);
    if (currentMeetingId === meetingId) {
      setIsVideoCallOpen(false);
      setCurrentMeetingUrl('');
      setCurrentMeetingId('');
      setCallError(null);
      
      if (onCallEnded) {
        onCallEnded();
      }
    }
  }, [currentMeetingId, onCallEnded]);

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

  // Auto-join call from notification
  useEffect(() => {
    if (!autoJoinMeetingId || !autoJoinUrl) {
      autoJoinAttemptedRef.current = false;
      pendingJoinUrl.current = null;
      return;
    }

    if (autoJoinAttemptedRef.current) {
      console.log('⏸️ [VIDEO] Auto-join already attempted');
      return;
    }

    if (!dailyLoaded) {
      console.log('⏳ [VIDEO] Waiting for Daily.co to load...');
      return;
    }

    console.log('🔄 [VIDEO] Auto-join effect triggered');
    console.log('📞 [VIDEO] Meeting ID:', autoJoinMeetingId);
    console.log('📞 [VIDEO] Join URL:', autoJoinUrl);
    
    if (!autoJoinUrl.startsWith('http')) {
      console.error('❌ [VIDEO] Invalid join URL:', autoJoinUrl);
      setCallError('Invalid video call link');
      autoJoinAttemptedRef.current = true;
      return;
    }

    autoJoinAttemptedRef.current = true;
    pendingJoinUrl.current = autoJoinUrl;

    console.log('🎬 [VIDEO] Opening video call window');
    setCurrentMeetingId(autoJoinMeetingId);
    setCurrentMeetingUrl(autoJoinUrl);
    setIsVideoCallOpen(true);
  }, [autoJoinMeetingId, autoJoinUrl, dailyLoaded]);

  // Initialize call when container is ready
  useEffect(() => {
    if (containerMounted && pendingJoinUrl.current && !isInitializingRef.current) {
      console.log('✅ [VIDEO] Container ready, initializing call');
      const url = pendingJoinUrl.current;
      pendingJoinUrl.current = null;
      
      // Small delay to ensure DOM is stable
      const timer = setTimeout(() => {
        if (isMountedRef.current && dailyContainerRef.current) {
          initializeDailyCall(url);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [containerMounted]);

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
      pendingJoinUrl.current = data.roomUrl;
      setIsVideoCallOpen(true);

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
    console.log('🎥 [DAILY] Room URL:', roomUrl);
    
    if (!isMountedRef.current) {
      console.log('⏸️ [DAILY] Component unmounted, skipping');
      return;
    }

    if (isInitializingRef.current) {
      console.log('⏸️ [DAILY] Already initializing, skipping...');
      return;
    }

    if (!dailyContainerRef.current) {
      console.error('❌ [DAILY] Container ref is null');
      setCallError('Video container not ready');
      return;
    }

    if (!document.body.contains(dailyContainerRef.current)) {
      console.error('❌ [DAILY] Container not in DOM');
      setCallError('Video container not attached');
      return;
    }

    // Destroy existing frame
    if (callFrameRef.current) {
      console.log('🗑️ [DAILY] Destroying existing frame...');
      try {
        await callFrameRef.current.destroy();
        callFrameRef.current = null;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log('Warning: Error destroying old frame:', e);
        callFrameRef.current = null;
      }
    }

    if (!window.DailyIframe) {
      console.error('❌ [DAILY] Daily.co not available');
      setCallError('Video library not loaded');
      return;
    }

    isInitializingRef.current = true;
    setIsJoining(true);
    console.log('🎥 [DAILY] Creating call frame...');

    try {
      // Final check before creating frame
      if (!dailyContainerRef.current || !isMountedRef.current) {
        throw new Error('Container no longer available');
      }

      // Clear container content
      dailyContainerRef.current.innerHTML = '';

      console.log('📦 [DAILY] Creating Daily frame in container');
      
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

      // Verify frame was created
      if (!callFrame) {
        throw new Error('Failed to create Daily frame');
      }

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
          setCallError(`Call error: ${error.errorMsg || 'Unknown error'}`);
          setIsJoining(false);
        }
      });

      // Join the room
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
      console.error('❌ [DAILY] Error details:', error.message);
      isInitializingRef.current = false;
      
      if (isMountedRef.current) {
        setCallError(error.message || 'Failed to join call');
        setIsJoining(false);
      }
    }
  };

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
    }, 100);
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
    pendingJoinUrl.current = incomingCall.joinUrl;
    setIsVideoCallOpen(true);
    setCallRinging(false);

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

    isInitializingRef.current = false;
    autoJoinAttemptedRef.current = false;
    pendingJoinUrl.current = null;

    const meetingId = currentMeetingId;
    const otherUserId = selectedTutor?.user_id || incomingCall?.callerId;

    if (dailyContainerRef.current) {
      dailyContainerRef.current.innerHTML = '';
    }

    setIsVideoCallOpen(false);
    setCurrentMeetingUrl('');
    setCurrentMeetingId('');
    setParticipantCount(0);
    setCallError(null);
    setIsJoining(false);
    setContainerMounted(false);

    if (socketRef.current?.connected && meetingId) {
      socketRef.current.emit('end_video_call', {
        meetingId,
        endedBy: currentUserId,
        otherUserId,
      });
    }

    if (onCallEnded) {
      onCallEnded();
    }
  }, [currentMeetingId, selectedTutor, incomingCall, currentUserId, onCallEnded]);

  return (
    <>
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

      {isVideoCallOpen && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
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

          <div className="flex-1 relative bg-gray-900 overflow-hidden">
            <div 
              ref={dailyContainerRef} 
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            />

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