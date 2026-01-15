import React, { useState, useEffect, useRef } from 'react';
import { Video, PhoneOff, Phone, X, Users } from 'lucide-react';
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

  const socketRef = useRef(null);
  const callFrameRef = useRef(null);
  const dailyContainerRef = useRef(null);

  // Initialize Socket.IO with proper authentication
  useEffect(() => {
    if (!currentUserId) {
      console.error('❌ [SOCKET] No currentUserId provided');
      return;
    }

    console.log(`🔌 [SOCKET] Initializing connection for user ${currentUserId}`);
    
    const socket = io(API_URL, {
      auth: { 
        userId: currentUserId 
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`✅ [SOCKET] Connected! Socket ID: ${socket.id}, User ID: ${currentUserId}`);
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ [SOCKET] Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Connection error:', error);
      setConnectionStatus('error');
    });

    socket.on('incoming_video_call', (callData) => {
      console.log('📞 [VIDEO] Incoming call received:', callData);
      setIncomingCall(callData);
      setCallRinging(true);
      
      // Play notification sound if available
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Could not play sound:', e));
      } catch (e) {
        console.log('No notification sound available');
      }
    });

    socket.on('call_ended', ({ meetingId }) => {
      console.log(`🔴 [VIDEO] Call ended: ${meetingId}`);
      if (currentMeetingId === meetingId) {
        endVideoCall();
      }
    });

    socket.on('call_declined', () => {
      console.log('❌ [VIDEO] Call was declined');
      setIsCreatingCall(false);
      alert('Call was declined');
    });

    socket.on('call_failed', (data) => {
      console.error('❌ [VIDEO] Call failed:', data);
      setIsCreatingCall(false);
      alert(data.error || 'Call failed');
    });

    socket.on('test_notification', (data) => {
      console.log('🧪 [TEST] Received test notification:', data);
    });

    return () => {
      console.log('🔌 [SOCKET] Cleaning up socket connection');
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUserId]);

  // Load Daily.co script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.DailyIframe) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => console.log('✅ [DAILY] Daily.co library loaded');
      script.onerror = () => console.error('❌ [DAILY] Failed to load Daily.co library');
    }
  }, []);

  const startVideoCall = async () => {
    if (!selectedTutor) {
      alert('Please select a tutor first');
      return;
    }

    if (connectionStatus !== 'connected') {
      alert('Socket connection not established. Please wait...');
      return;
    }

    console.log('\n' + '='.repeat(70));
    console.log('📞 [VIDEO] Starting video call...');
    console.log(`📞 [VIDEO] Caller: ${currentUserId} (${currentUserName})`);
    console.log(`📞 [VIDEO] Receiver: ${selectedTutor.user_id} (${selectedTutor.name})`);
    console.log('='.repeat(70));

    setIsCreatingCall(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

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
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create room`);
      }

      const data = await response.json();
      console.log('✅ [VIDEO] Daily.co room created:', data);

      setCurrentMeetingUrl(data.roomUrl);
      setCurrentMeetingId(data.roomName);
      setIsVideoCallOpen(true);

      // Initialize Daily.co frame
      initializeDailyCall(data.roomUrl);

      // Notify tutor via socket
      if (socketRef.current?.connected) {
        console.log('📡 [VIDEO] Sending call notification via socket...');
        
        socketRef.current.emit('initiate_video_call', {
          meetingId: data.roomName,
          callerId: currentUserId,
          receiverId: selectedTutor.user_id,
          callerName: currentUserName,
          joinUrl: data.roomUrl,
        });

        console.log('✅ [VIDEO] Call notification sent');
      } else {
        console.error('❌ [VIDEO] Socket not connected, cannot notify receiver');
        throw new Error('Socket connection lost');
      }

    } catch (error) {
      console.error('❌ [VIDEO] Failed to start call:', error);
      alert(`Failed to start video call: ${error.message}`);
      setIsVideoCallOpen(false);
    } finally {
      setIsCreatingCall(false);
    }
  };

  const initializeDailyCall = (roomUrl) => {
    if (!window.DailyIframe) {
      console.error('❌ [DAILY] Daily.co not loaded yet');
      return;
    }

    if (!dailyContainerRef.current) {
      console.error('❌ [DAILY] Container not mounted yet');
      return;
    }

    console.log('🎥 [DAILY] Initializing call frame...');

    const callFrame = window.DailyIframe.createFrame(dailyContainerRef.current, {
      iframeStyle: { width: '100%', height: '100%', border: '0' },
      showLeaveButton: true,
      showFullscreenButton: true,
    });

    callFrameRef.current = callFrame;

    callFrame.on('joined-meeting', () => {
      console.log('✅ [DAILY] Joined Daily meeting');
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
      endVideoCall();
    });

    callFrame.on('error', (error) => {
      console.error('❌ [DAILY] Error:', error);
    });

    console.log('🎥 [DAILY] Joining room:', roomUrl);
    callFrame.join({ url: roomUrl, userName: currentUserName });
  };

  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      const participants = callFrameRef.current.participants();
      const count = Object.keys(participants).length;
      setParticipantCount(count);
      console.log(`👥 [DAILY] Participants: ${count}`);
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;

    console.log('✅ [VIDEO] Accepting call:', incomingCall.meetingId);

    setCurrentMeetingUrl(incomingCall.joinUrl);
    setCurrentMeetingId(incomingCall.meetingId);
    setIsVideoCallOpen(true);
    setCallRinging(false);

    initializeDailyCall(incomingCall.joinUrl);

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_accepted', {
        meetingId: incomingCall.meetingId,
        acceptedBy: currentUserId,
        callerId: incomingCall.callerId,
      });
      console.log('📡 [VIDEO] Sent call_accepted notification');
    }

    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;

    console.log('❌ [VIDEO] Declining call:', incomingCall.meetingId);

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_declined', {
        meetingId: incomingCall.meetingId,
        declinedBy: currentUserId,
        callerId: incomingCall.callerId,
      });
      console.log('📡 [VIDEO] Sent call_declined notification');
    }

    setCallRinging(false);
    setIncomingCall(null);
  };

  const endVideoCall = () => {
    console.log('🔴 [VIDEO] Ending video call');

    if (callFrameRef.current) {
      try {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
      } catch (e) {
        console.error('Error destroying call frame:', e);
      }
      callFrameRef.current = null;
    }

    const meetingId = currentMeetingId;
    const otherUserId = selectedTutor?.user_id || incomingCall?.callerId;

    setIsVideoCallOpen(false);
    setCurrentMeetingUrl('');
    setCurrentMeetingId('');
    setParticipantCount(0);

    if (socketRef.current?.connected && meetingId) {
      socketRef.current.emit('end_video_call', {
        meetingId,
        endedBy: currentUserId,
        otherUserId,
      });
      console.log('📡 [VIDEO] Sent end_video_call notification');
    }
  };

  return (
    <>
      {/* Call Button */}
      {selectedTutor && !isVideoCallOpen && (
        <button
          onClick={startVideoCall}
          disabled={isCreatingCall || connectionStatus !== 'connected'}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Video size={20} />
          {isCreatingCall ? 'Starting...' : connectionStatus !== 'connected' ? 'Connecting...' : 'Start Video Call'}
        </button>
      )}

      {/* Connection Status Indicator */}
      {connectionStatus !== 'connected' && (
        <div className="text-sm text-gray-500 mt-2">
          Status: {connectionStatus}
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
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition animate-bounce"
              >
                <Phone size={20} /> Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Window */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Video className="text-green-500" size={24} />
                <h2 className="text-lg font-semibold">
                  Video Call with {selectedTutor?.name || incomingCall?.callerName || 'User'}
                </h2>
              </div>

              {/* Participant Counter */}
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
                <Users size={16} />
                <span className="text-sm">{participantCount} participants</span>
              </div>
            </div>

            <button onClick={endVideoCall} className="p-2 hover:bg-gray-800 rounded-full transition">
              <X size={24} />
            </button>
          </div>

          {/* Daily.co Video Container */}
          <div ref={dailyContainerRef} className="flex-1 bg-gray-900" />

          {/* Call Controls */}
          <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
            <button
              onClick={endVideoCall}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-4 rounded-full hover:bg-red-700 transition"
            >
              <PhoneOff size={24} /> Leave Call
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyVideoCall;