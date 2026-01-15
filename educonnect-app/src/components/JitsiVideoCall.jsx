import React, { useState, useEffect, useRef } from 'react';
import { Video, PhoneOff, Phone, X, Users } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

// Daily.co Video Call Component
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

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io(API_URL, {
      auth: { userId: currentUserId },
      reconnection: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ [SOCKET] Connected!');
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
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

  // Load Daily.co script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.DailyIframe) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        console.log('✅ Daily.co loaded');
      };
    }
  }, []);

  const startVideoCall = async () => {
    if (!selectedTutor) return;
    if (connectionStatus !== 'connected') {
      alert('Socket connection not established. Please wait...');
      return;
    }

    console.log('📞 [VIDEO] Starting Daily.co call...');
    setIsCreatingCall(true);

    try {
      const token = localStorage.getItem('token');
      
      // Call backend to create Daily room
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
          maxParticipants: 15 // Support 13 students + 2 tutors
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      console.log('✅ [VIDEO] Daily room created:', data);

      setCurrentMeetingUrl(data.roomUrl);
      setCurrentMeetingId(data.roomName);
      setIsVideoCallOpen(true);

      // Initialize Daily.co call frame
      initializeDailyCall(data.roomUrl);

      // Notify tutor via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('initiate_video_call', {
          meetingId: data.roomName,
          callerId: currentUserId,
          receiverId: selectedTutor.user_id,
          callerName: currentUserName,
          joinUrl: data.roomUrl,
        });
      }
    } catch (error) {
      console.error('❌ [VIDEO] Failed to start call:', error);
      alert(`Failed to start video call: ${error.message}`);
    } finally {
      setIsCreatingCall(false);
    }
  };

  const initializeDailyCall = (roomUrl) => {
    if (!window.DailyIframe) {
      console.error('Daily.co not loaded yet');
      return;
    }

    // Create Daily call frame
    const callFrame = window.DailyIframe.createFrame('daily-call-container', {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
      },
      showLeaveButton: true,
      showFullscreenButton: true,
    });

    callFrameRef.current = callFrame;

    // Event listeners
    callFrame.on('joined-meeting', () => {
      console.log('✅ Joined Daily meeting');
    });

    callFrame.on('participant-joined', () => {
      updateParticipantCount();
    });

    callFrame.on('participant-left', () => {
      updateParticipantCount();
    });

    callFrame.on('left-meeting', () => {
      endVideoCall();
    });

    // Join the room
    callFrame.join({ 
      url: roomUrl,
      userName: currentUserName 
    });
  };

  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      const participants = callFrameRef.current.participants();
      setParticipantCount(Object.keys(participants).length);
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    
    console.log('✅ [VIDEO] Accepting call');
    
    setCurrentMeetingUrl(incomingCall.joinUrl);
    setCurrentMeetingId(incomingCall.meetingId);
    setIsVideoCallOpen(true);
    setCallRinging(false);

    // Initialize Daily call
    initializeDailyCall(incomingCall.joinUrl);

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
    
    // Leave Daily call
    if (callFrameRef.current) {
      callFrameRef.current.leave();
      callFrameRef.current.destroy();
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
           connectionStatus !== 'connected' ? 'Connecting...' : 'Start Video Call'}
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
            
            <button 
              onClick={endVideoCall} 
              className="p-2 hover:bg-gray-800 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Daily.co Video Container */}
          <div id="daily-call-container" className="flex-1 bg-gray-900" />

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