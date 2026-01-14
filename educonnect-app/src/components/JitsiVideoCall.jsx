import React, { useState, useEffect, useRef } from 'react';
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
  
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO
    socketRef.current = io(API_URL, {
      auth: { userId: currentUserId },
      reconnection: true
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
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      socket?.disconnect();
    };
  }, [currentUserId, currentMeetingId]);

  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const initJitsi = async (meetingUrl, displayName) => {
    try {
      await loadJitsiScript();

      // Extract room name from URL
      const url = new URL(meetingUrl);
      const roomName = url.pathname.substring(1);
      const domain = url.hostname;

      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          hideConferenceSubject: false,
          hideConferenceTimer: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_VIDEO_BACKGROUND: false,
        },
        userInfo: {
          displayName: displayName
        }
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // Event listeners
      api.addEventListener('videoConferenceJoined', () => {
        console.log('✅ Joined video conference');
      });

      api.addEventListener('readyToClose', () => {
        console.log('🔴 Conference closed');
        endVideoCall();
      });

      api.addEventListener('participantLeft', (participant) => {
        console.log('👋 Participant left:', participant);
      });

      api.addEventListener('audioMuteStatusChanged', ({ muted }) => {
        setIsMuted(muted);
      });

      api.addEventListener('videoMuteStatusChanged', ({ muted }) => {
        setIsVideoOff(muted);
      });

    } catch (error) {
      console.error('❌ Failed to initialize Jitsi:', error);
      alert('Failed to initialize video call. Please try again.');
    }
  };

  const startVideoCall = async () => {
    if (!selectedTutor) return;
    
    setIsCreatingCall(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/video/create-meeting`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          callerId: currentUserId,
          callerRole: 'student',
          receiverId: selectedTutor.user_id,
          callerName: 'Student',
          receiverName: selectedTutor.name,
          meetingName: `Session with ${selectedTutor.name}`
        })
      });
      
      if (!response.ok) throw new Error('Failed to create meeting');
      
      const data = await response.json();
      
      setCurrentMeetingUrl(data.studentJoinUrl);
      setCurrentMeetingId(data.meeting_id);
      setIsVideoCallOpen(true);
      
      // Initialize Jitsi
      setTimeout(() => {
        initJitsi(data.studentJoinUrl, 'Student');
      }, 100);
      
      // Notify tutor via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('initiate_video_call', {
          meetingId: data.meeting_id,
          callerId: currentUserId,
          receiverId: selectedTutor.user_id,
          callerName: 'Student',
          joinUrl: data.tutorJoinUrl
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
    
    // Initialize Jitsi
    setTimeout(() => {
      initJitsi(incomingCall.joinUrl, 'Student');
    }, 100);
    
    if (socketRef.current?.connected) {
      socketRef.current.emit('call_accepted', {
        meetingId: incomingCall.meetingId,
        acceptedBy: currentUserId
      });
    }
    
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;
    
    if (socketRef.current?.connected) {
      socketRef.current.emit('call_declined', {
        meetingId: incomingCall.meetingId,
        declinedBy: currentUserId
      });
    }
    
    setCallRinging(false);
    setIncomingCall(null);
  };

  const endVideoCall = async () => {
    if (!currentMeetingId) return;
    
    try {
      // Dispose Jitsi
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
      
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/video/end-meeting`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meetingId: currentMeetingId })
      });
      
      if (socketRef.current?.connected) {
        socketRef.current.emit('end_video_call', {
          meetingId: currentMeetingId,
          endedBy: currentUserId
        });
      }
      
    } catch (error) {
      console.error('Failed to end video call:', error);
    } finally {
      setIsVideoCallOpen(false);
      setCurrentMeetingUrl('');
      setCurrentMeetingId('');
      setIsMuted(false);
      setIsVideoOff(false);
    }
  };

  const toggleMute = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Incoming Video Call
              </h2>
              <p className="text-gray-600">
                {incomingCall.callerName} is calling...
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={declineCall}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
              >
                <PhoneOff size={20} />
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition animate-bounce"
              >
                <Phone size={20} />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="text-green-500" size={24} />
              <h2 className="text-lg font-semibold">
                Video Call with {selectedTutor?.name || 'Tutor'}
              </h2>
            </div>
            <button
              onClick={endVideoCall}
              className="p-2 hover:bg-gray-800 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Jitsi Container */}
          <div className="flex-1 bg-black" ref={jitsiContainerRef} />

          {/* Controls */}
          <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition ${
                isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${
                isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            
            <button
              onClick={endVideoCall}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-4 rounded-full hover:bg-red-700 transition"
            >
              <PhoneOff size={24} />
              End Call
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default JitsiVideoCall;