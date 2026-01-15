import React, { useState, useEffect } from 'react';
import { Video, PhoneOff, Mic, MicOff, VideoOff, Phone, X } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const JitsiVideoCall = ({ currentUserId, selectedTutor, currentUserName = 'Student' }) => {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [currentMeetingUrl, setCurrentMeetingUrl] = useState('');
  const [currentMeetingId, setCurrentMeetingId] = useState('');
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callRinging, setCallRinging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const socketRef = React.useRef(null);

  // Initialize Socket.IO with better error handling
  useEffect(() => {
    console.log('🔌 [SOCKET] Initializing socket connection...');
    console.log('🔌 [SOCKET] Current User ID:', currentUserId);
    
    const socket = io(API_URL, {
      auth: { userId: currentUserId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ [SOCKET] Connected successfully!');
      console.log('✅ [SOCKET] Socket ID:', socket.id);
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ [SOCKET] Disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Connection error:', error);
      setConnectionStatus('error');
    });

    // Listen for test notifications (for debugging)
    socket.on('test_notification', (data) => {
      console.log('🔔 [TEST] Received test notification:', data);
    });

    socket.on('incoming_video_call', (callData) => {
      console.log('📞 [VIDEO] Incoming video call received!');
      console.log('📞 [VIDEO] Call data:', callData);
      setIncomingCall(callData);
      setCallRinging(true);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Could not play sound:', e));
      } catch (e) {
        console.log('Audio notification failed:', e);
      }
    });

    socket.on('call_ended', ({ meetingId }) => {
      console.log('🔴 [VIDEO] Call ended:', meetingId);
      if (currentMeetingId === meetingId) {
        endVideoCall();
      }
    });

    socket.on('call_declined', ({ meetingId }) => {
      console.log('❌ [VIDEO] Call declined:', meetingId);
      setIsCreatingCall(false);
      alert('Call was declined');
    });

    socket.on('call_failed', (data) => {
      console.error('❌ [VIDEO] Call failed:', data);
      setIsCreatingCall(false);
      alert(data.error || 'Call failed');
    });

    return () => {
      console.log('🔌 [SOCKET] Cleaning up socket connection');
      socket?.disconnect();
    };
  }, [currentUserId]);

  // Generate unique meeting URL
  const generateMeetingUrl = () => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const uniqueName = `EduConnect-${selectedTutor.name.replace(/\s+/g, '-')}-${timestamp}-${randomId}`;
    return `https://meet.jit.si/${uniqueName}`;
  };

  const startVideoCall = async () => {
    if (!selectedTutor) {
      console.error('❌ [VIDEO] No tutor selected');
      return;
    }

    if (connectionStatus !== 'connected') {
      alert('Socket connection not established. Please wait...');
      return;
    }

    console.log('\n' + '='.repeat(70));
    console.log('📞 [VIDEO] Starting video call...');
    console.log('📞 [VIDEO] Selected tutor:', selectedTutor);
    console.log('📞 [VIDEO] Tutor user_id:', selectedTutor.user_id);
    console.log('='.repeat(70));

    setIsCreatingCall(true);

    try {
      const meetingUrl = generateMeetingUrl();
      const token = localStorage.getItem('token');

      console.log('📞 [VIDEO] Creating meeting...');
      console.log('📞 [VIDEO] Meeting URL:', meetingUrl);

      const response = await fetch(`${API_URL}/api/video/create-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callerId: currentUserId,
          callerRole: 'student',
          receiverId: selectedTutor.user_id, // 🔥 CRITICAL: Use user_id not tutor_id
          callerName: currentUserName,
          receiverName: selectedTutor.name,
          meetingName: meetingUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      const data = await response.json();
      console.log('✅ [VIDEO] Meeting created:', data);

      setCurrentMeetingUrl(meetingUrl);
      setCurrentMeetingId(data.meeting_id);
      setIsVideoCallOpen(true);

      // Notify tutor via socket
      if (socketRef.current?.connected) {
        console.log('📡 [VIDEO] Emitting call notification to tutor...');
        console.log('📡 [VIDEO] Receiver ID:', selectedTutor.user_id);
        
        socketRef.current.emit('initiate_video_call', {
          meetingId: data.meeting_id,
          callerId: currentUserId,
          receiverId: selectedTutor.user_id, // 🔥 CRITICAL: Use user_id
          callerName: currentUserName,
          joinUrl: meetingUrl,
        });
        
        console.log('✅ [VIDEO] Call notification sent!');
      } else {
        console.error('❌ [VIDEO] Socket not connected, cannot send notification');
        throw new Error('Socket connection lost');
      }
    } catch (error) {
      console.error('❌ [VIDEO] Failed to start video call:', error);
      alert(`Failed to start video call: ${error.message}`);
      setIsVideoCallOpen(false);
      setCurrentMeetingUrl('');
      setCurrentMeetingId('');
    } finally {
      setIsCreatingCall(false);
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    
    console.log('✅ [VIDEO] Accepting call:', incomingCall);
    
    setCurrentMeetingUrl(incomingCall.joinUrl);
    setCurrentMeetingId(incomingCall.meetingId);
    setIsVideoCallOpen(true);
    setCallRinging(false);

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_accepted', {
        meetingId: incomingCall.meetingId,
        acceptedBy: currentUserId,
        callerId: incomingCall.callerId, // 🔥 ADD: So backend knows who to notify
      });
    }
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;

    console.log('❌ [VIDEO] Declining call:', incomingCall);

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_declined', {
        meetingId: incomingCall.meetingId,
        declinedBy: currentUserId,
        callerId: incomingCall.callerId, // 🔥 ADD: So backend knows who to notify
      });
    }

    setCallRinging(false);
    setIncomingCall(null);
  };

  const endVideoCall = () => {
    console.log('🔴 [VIDEO] Ending call');
    
    const meetingId = currentMeetingId;
    const otherUserId = selectedTutor?.user_id || incomingCall?.callerId;
    
    setIsVideoCallOpen(false);
    setCurrentMeetingUrl('');
    setCurrentMeetingId('');
    setIsMuted(false);
    setIsVideoOff(false);

    if (socketRef.current?.connected && meetingId) {
      socketRef.current.emit('end_video_call', {
        meetingId: meetingId,
        endedBy: currentUserId,
        otherUserId: otherUserId, // 🔥 ADD: So backend knows who to notify
      });
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);

  return (
    <>
      {/* Connection Status Indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 text-sm z-50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="font-medium">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            User ID: {currentUserId}
          </div>
        </div>
      )}

      {/* Call Button */}
      {selectedTutor && !isVideoCallOpen && (
        <button
          onClick={startVideoCall}
          disabled={isCreatingCall || connectionStatus !== 'connected'}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={connectionStatus !== 'connected' ? 'Waiting for connection...' : 'Start video call'}
        >
          <Video size={20} />
          {isCreatingCall ? 'Starting...' : 
           connectionStatus !== 'connected' ? 'Connecting...' : 'Video Call'}
        </button>
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
      {isVideoCallOpen && currentMeetingUrl && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="text-green-500" size={24} />
              <h2 className="text-lg font-semibold">
                Video Call with {selectedTutor?.name || incomingCall?.callerName || 'User'}
              </h2>
            </div>
            <button onClick={endVideoCall} className="p-2 hover:bg-gray-800 rounded-full transition">
              <X size={24} />
            </button>
          </div>

          {/* Jitsi Meet Iframe */}
          <div className="flex-1 relative">
            <iframe
              src={currentMeetingUrl}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-full"
              title="Video Call"
            />
          </div>

          {/* Call Controls */}
          <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>

            <button
              onClick={endVideoCall}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-4 rounded-full hover:bg-red-700 transition"
            >
              <PhoneOff size={24} /> End Call
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default JitsiVideoCall;