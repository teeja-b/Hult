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

  const socketRef = React.useRef(null);

  // Initialize Socket.IO
  useEffect(() => {
    console.log('🔌 [SOCKET] Initializing socket connection...');
    
    const socket = io(API_URL, {
      auth: { userId: currentUserId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ [SOCKET] Connected!');
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ [SOCKET] Disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    socket.on('incoming_video_call', (callData) => {
      console.log('📞 [VIDEO] Incoming call:', callData);
      setIncomingCall(callData);
      setCallRinging(true);
    });

    socket.on('call_ended', ({ meetingId }) => {
      if (currentMeetingId === meetingId) {
        endVideoCall();
      }
    });

    socket.on('call_declined', () => {
      setIsCreatingCall(false);
      alert('Call was declined');
    });

    return () => {
      socket?.disconnect();
    };
  }, [currentUserId]);

  // 🔥 FIX: Generate Jitsi URL without JWT (no moderator required)
  const generateJitsiUrl = () => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const roomName = `EduConnect-${timestamp}-${randomId}`;
    
    // Build URL with config to disable moderator requirement
    const baseUrl = `https://meet.jit.si/${roomName}`;
    const config = {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      prejoinPageEnabled: false, // Skip pre-join page
      requireDisplayName: false,
      disableModeratorIndicator: true,
      enableWelcomePage: false,
    };
    
    // Encode config as URL hash
    const configString = encodeURIComponent(JSON.stringify(config));
    const displayName = encodeURIComponent(currentUserName);
    
    return `${baseUrl}?displayName=${displayName}#config=${configString}`;
  };

  const startVideoCall = async () => {
    if (!selectedTutor) return;
    if (connectionStatus !== 'connected') {
      alert('Socket connection not established. Please wait...');
      return;
    }

    console.log('📞 [VIDEO] Starting video call...');
    setIsCreatingCall(true);

    try {
      // 🔥 FIX: Use simple Jitsi URL (no backend needed)
      const meetingUrl = generateJitsiUrl();
      const meetingId = `meeting-${Date.now()}`;

      console.log('✅ [VIDEO] Meeting URL:', meetingUrl);

      setCurrentMeetingUrl(meetingUrl);
      setCurrentMeetingId(meetingId);
      setIsVideoCallOpen(true);

      // Notify tutor via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('initiate_video_call', {
          meetingId: meetingId,
          callerId: currentUserId,
          receiverId: selectedTutor.user_id,
          callerName: currentUserName,
          joinUrl: meetingUrl,
        });
        console.log('✅ [VIDEO] Call notification sent!');
      }
    } catch (error) {
      console.error('❌ [VIDEO] Failed to start call:', error);
      alert(`Failed to start video call: ${error.message}`);
    } finally {
      setIsCreatingCall(false);
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    
    console.log('✅ [VIDEO] Accepting call');
    
    setCurrentMeetingUrl(incomingCall.joinUrl);
    setCurrentMeetingId(incomingCall.meetingId);
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
  };

  const declineCall = () => {
    if (!incomingCall) return;

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
    
    const meetingId = currentMeetingId;
    const otherUserId = selectedTutor?.user_id || incomingCall?.callerId;
    
    setIsVideoCallOpen(false);
    setCurrentMeetingUrl('');
    setCurrentMeetingId('');

    if (socketRef.current?.connected && meetingId) {
      socketRef.current.emit('end_video_call', {
        meetingId: meetingId,
        endedBy: currentUserId,
        otherUserId: otherUserId,
      });
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

          {/* Jitsi Meet Iframe - NO MODERATOR REQUIRED */}
          <div className="flex-1 relative">
            <iframe
              src={currentMeetingUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full"
              title="Video Call"
            />
          </div>

          {/* Call Controls */}
          <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
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