import React, { useState, useEffect } from 'react';
import { Video, PhoneOff, Mic, MicOff, VideoOff, Phone, X } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const JitsiVideoCall = ({ currentUserId, selectedTutor }) => {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [currentMeetingUrl, setCurrentMeetingUrl] = useState('');
  const [currentMeetingId, setCurrentMeetingId] = useState('');
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callRinging, setCallRinging] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const socketRef = React.useRef(null);

  // Initialize Socket.IO
  useEffect(() => {
    socketRef.current = io(API_URL, {
      auth: { userId: currentUserId },
      reconnection: true,
    });

    const socket = socketRef.current;

    socket.on('incoming_video_call', (callData) => {
      console.log('📞 Incoming video call:', callData);
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
  }, [currentUserId, currentMeetingId]);

  // Generate unique meeting URL
  const generateMeetingUrl = () => {
    const uniqueName = `EduConnect-${selectedTutor.name}-${Date.now()}`;
    return `https://meet.jit.si/${uniqueName}`;
  };

  const startVideoCall = async () => {
    if (!selectedTutor) return;
    setIsCreatingCall(true);

    try {
      const meetingUrl = generateMeetingUrl();
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/video/create-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callerId: currentUserId,
          callerRole: 'student',
          receiverId: selectedTutor.user_id,
          callerName: 'Student',
          receiverName: selectedTutor.name,
          meetingName: meetingUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to create meeting');
      const data = await response.json();

      setCurrentMeetingUrl(meetingUrl); // set unique URL
      setCurrentMeetingId(data.meeting_id);
      setIsVideoCallOpen(true);

      // Notify tutor via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('initiate_video_call', {
          meetingId: data.meeting_id,
          callerId: currentUserId,
          receiverId: selectedTutor.user_id,
          callerName: 'Student',
          joinUrl: meetingUrl,
        });
      }
    } catch (error) {
      console.error('Failed to start video call:', error);
      alert('Failed to start video call. Please try again.');
    } finally {
      setIsCreatingCall(false);
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    setCurrentMeetingUrl(incomingCall.joinUrl);
    setCurrentMeetingId(incomingCall.meetingId);
    setIsVideoCallOpen(true);
    setCallRinging(false);

    if (socketRef.current?.connected) {
      socketRef.current.emit('call_accepted', {
        meetingId: incomingCall.meetingId,
        acceptedBy: currentUserId,
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
      });
    }

    setCallRinging(false);
    setIncomingCall(null);
  };

  const endVideoCall = () => {
    setIsVideoCallOpen(false);
    setCurrentMeetingUrl('');
    setCurrentMeetingId('');
    setIsMuted(false);
    setIsVideoOff(false);

    if (socketRef.current?.connected) {
      socketRef.current.emit('end_video_call', {
        meetingId: currentMeetingId,
        endedBy: currentUserId,
      });
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);

  return (
    <>
      {/* Call Button */}
      {selectedTutor && !isVideoCallOpen && (
        <button
          onClick={startVideoCall}
          disabled={isCreatingCall}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Video size={20} />
          {isCreatingCall ? 'Starting...' : 'Video Call'}
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

      {/* Video Call Controls Modal */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="text-green-500" size={24} />
              <h2 className="text-lg font-semibold">
                Video Call with {selectedTutor?.name || 'Tutor'}
              </h2>
            </div>
            <button onClick={endVideoCall} className="p-2 hover:bg-gray-800 rounded-full transition">
              <X size={24} />
            </button>
          </div>

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
