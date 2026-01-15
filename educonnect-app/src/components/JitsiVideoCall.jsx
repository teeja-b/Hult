import React, { useState, useEffect, useRef } from 'react';
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

  const socketRef = useRef(null);
  const callFrameRef = useRef(null);
  const dailyContainerRef = useRef(null);
  const joinAttempts = useRef(0);

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

    socket.on('incoming_video_call', (callData) => {
      console.log('📞 [VIDEO] Incoming call:', callData);
      setIncomingCall(callData);
      setCallRinging(true);
    });

    socket.on('call_ended', ({ meetingId }) => {
      console.log(`🔴 [VIDEO] Call ended: ${meetingId}`);
      if (currentMeetingId === meetingId) {
        endVideoCall();
      }
    });

    socket.on('call_declined', () => {
      console.log('❌ [VIDEO] Call declined');
      setIsCreatingCall(false);
      alert('Call was declined');
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentUserId]);

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

    console.log('\n' + '='.repeat(70));
    console.log('📞 [VIDEO] Starting video call');
    console.log('='.repeat(70));

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

      // Wait for container to mount before initializing
      setTimeout(() => {
        initializeDailyCall(data.roomUrl);
      }, 100);

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
    if (callFrameRef.current) {
  console.log('[DAILY] Frame already exists, skipping creation');
  return;
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

    // Destroy existing frame if any
    if (callFrameRef.current) {
      try {
        callFrameRef.current.destroy();
      } catch (e) {
        console.log('Old frame cleanup:', e);
      }
      callFrameRef.current = null;
    }

    if (dailyContainerRef.current) {
  dailyContainerRef.current.innerHTML = '';
}

    console.log('🎥 [DAILY] Creating call frame...');
    console.log('🎥 [DAILY] Room URL:', roomUrl);

    setIsJoining(true);
    joinAttempts.current += 1;

    try {
      const callFrame = window.DailyIframe.createFrame(dailyContainerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '0'
        },
        showLeaveButton: true,
        showFullscreenButton: true,
        showLocalVideo: true,
        showParticipantsBar: true
      });

      callFrameRef.current = callFrame;

      // Set up event listeners BEFORE joining
      callFrame.on('loaded', () => {
        console.log('✅ [DAILY] Frame loaded');
      });

      callFrame.on('joining-meeting', () => {
        console.log('🔄 [DAILY] Joining meeting...');
      });

      callFrame.on('joined-meeting', (event) => {
        console.log('✅ [DAILY] Successfully joined meeting!');
        console.log('👤 [DAILY] Participants:', event.participants);
        setIsJoining(false);
        setCallError(null);
        updateParticipantCount();
      });

      callFrame.on('participant-joined', (event) => {
        console.log('👤 [DAILY] Participant joined:', event.participant.user_name);
        updateParticipantCount();
      });

      callFrame.on('participant-left', (event) => {
        console.log('👋 [DAILY] Participant left:', event.participant.user_name);
        updateParticipantCount();
      });

      callFrame.on('left-meeting', () => {
        console.log('🔴 [DAILY] Left meeting');
        setIsJoining(false);
      });

      callFrame.on('error', (error) => {
        console.error('❌ [DAILY] Error:', error);
        setCallError(`Call error: ${error.errorMsg || 'Unknown error'}`);
        setIsJoining(false);
      });

      // Join the call
      console.log('🎥 [DAILY] Attempting to join...');
      console.log('🎥 [DAILY] User name:', currentUserName);

      await callFrame.join({
        url: roomUrl,
        userName: currentUserName || 'User',
        showLeaveButton: true,
        showFullscreenButton: true
      });

      console.log('✅ [DAILY] Join request sent');

    } catch (error) {
      console.error('❌ [DAILY] Failed to initialize:', error);
      setCallError(`Failed to join call: ${error.message}`);
      setIsJoining(false);
      
      // Retry once
      if (joinAttempts.current === 1) {
        console.log('🔄 [DAILY] Retrying...');
        setTimeout(() => initializeDailyCall(roomUrl), 1000);
      }
    }
  };

  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      try {
        const participants = callFrameRef.current.participants();
        const count = Object.keys(participants).length;
        setParticipantCount(count);
        console.log(`👥 [DAILY] Participant count: ${count}`);
      } catch (e) {
        console.error('Error getting participants:', e);
      }
    }
  };

  const acceptCall = () => {
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
      initializeDailyCall(incomingCall.joinUrl);
    }, 100);

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_accepted', {
        meetingId: incomingCall.meetingId,
        acceptedBy: currentUserId,
        callerId: incomingCall.callerId,
      });
    }

    setIncomingCall(null);
  };

  const declineCall = () => {
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
  };

  const endVideoCall = () => {
    console.log('🔴 [VIDEO] Ending call');

    if (callFrameRef.current) {
      try {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
      } catch (e) {
        console.error('Error cleaning up:', e);
      }
      callFrameRef.current = null;
    }

    const meetingId = currentMeetingId;
    const otherUserId = selectedTutor?.user_id || incomingCall?.callerId;

    setIsVideoCallOpen(false);
    setCurrentMeetingUrl('');
    setCurrentMeetingId('');
    setParticipantCount(0);
    setCallError(null);
    setIsJoining(false);
    joinAttempts.current = 0;

    if (socketRef.current?.connected && meetingId) {
      socketRef.current.emit('end_video_call', {
        meetingId,
        endedBy: currentUserId,
        otherUserId,
      });
    }
  };

  return (
    <>
      {/* Call Button */}
      {selectedTutor && !isVideoCallOpen && (
        <div>
          <button
            onClick={startVideoCall}
            disabled={isCreatingCall || connectionStatus !== 'connected' || !dailyLoaded}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Video className="text-blue-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Incoming Video Call</h2>
              <p className="text-gray-600">{incomingCall.callerName} is calling...</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={declineCall}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
              >
                <PhoneOff size={20} /> Decline
              </button>
              <button
                onClick={acceptCall}
                disabled={!dailyLoaded}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <Phone size={20} /> {dailyLoaded ? 'Accept' : 'Loading...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Window */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Video className="text-green-500" size={24} />
                <h2 className="text-lg font-semibold">
                  {selectedTutor?.name || incomingCall?.callerName || 'Video Call'}
                </h2>
              </div>

              <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full">
                <Users size={16} />
                <span className="text-sm">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
              </div>

              {isJoining && (
                <span className="text-sm text-yellow-400">Connecting...</span>
              )}
            </div>

            <button 
              onClick={endVideoCall} 
              className="p-2 hover:bg-gray-700 rounded-full transition"
              title="End call"
            >
              <X size={24} />
            </button>
          </div>

          {/* Video Container */}
          <div className="flex-1 relative bg-gray-900">
            <div ref={dailyContainerRef} className="w-full h-full" />
            
            {/* Loading Overlay */}
            {isJoining && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white text-lg">Joining call...</p>
                  <p className="text-gray-400 text-sm mt-2">Please wait</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {callError && !isJoining && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
                <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-6 max-w-md">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="text-red-400" size={24} />
                    <h3 className="text-white font-semibold">Call Error</h3>
                  </div>
                  <p className="text-red-200 mb-4">{callError}</p>
                  <button
                    onClick={endVideoCall}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="bg-gray-800 p-4 flex items-center justify-center gap-4">
            <button
              onClick={endVideoCall}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition"
            >
              <PhoneOff size={20} /> Leave Call
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyVideoCall;