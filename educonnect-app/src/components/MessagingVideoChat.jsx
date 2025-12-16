import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Video, X } from 'lucide-react';

const API_URL = 'https://hult.onrender.com/api';

const MessagingVideoChat = ({ currentUserId = 'user123' }) => {
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [loading, setLoading] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch tutors from database
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch(`${API_URL}/tutors`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('Fetched tutors:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setTutors(data);
        } else if (data.tutors && Array.isArray(data.tutors)) {
          setTutors(data.tutors);
        } else if (data.data && Array.isArray(data.data)) {
          setTutors(data.data);
        } else {
          console.error('Unexpected response format:', data);
          setTutors([]);
        }
      } catch (err) {
        console.error('Failed to fetch tutors:', err);
        setTutors([]);
      }
    };
    fetchTutors();
  }, []);

const openConversation = async (tutor) => {
  setSelectedTutor(tutor);
  setShowMessages(true);
  setLoading(true);

  try {
    const tutorProfileId = tutor.tutor_profile_id || tutor.id;
    const conversationKey = `conversation:${currentUserId}:${tutorProfileId}`;
    
    console.log(`Opening conversation with key: ${conversationKey}`);
    console.log(`Student ID: ${currentUserId}, Tutor Profile ID: ${tutorProfileId}`);
    console.log(`Tutor User ID: ${tutor.user_id}`);

    // Try window.storage first, fallback to localStorage
    let result;
    if (window.storage && window.storage.get) {
      result = await window.storage.get(conversationKey);
      if (result) {
        const conversationData = JSON.parse(result.value);
        // ✅ FIX: Properly mark messages based on sender_id
        const processedMessages = (conversationData.messages || []).map(m => {
          const isOwn = String(m.sender_id) === String(currentUserId);
          console.log(`[STUDENT] Message from ${m.sender_id}, isOwn: ${isOwn}`);
          return {
            ...m,
            isOwn: isOwn
          };
        });
        console.log(`[STUDENT] Loaded ${processedMessages.length} messages`);
        setMessages(processedMessages);
      } else {
        setMessages([]);
      }
    } else {
      const data = localStorage.getItem(conversationKey);
      if (data) {
        const conversationData = JSON.parse(data);
        // ✅ FIX: Properly mark messages based on sender_id
        const processedMessages = (conversationData.messages || []).map(m => {
          const isOwn = String(m.sender_id) === String(currentUserId);
          console.log(`[STUDENT] Message from ${m.sender_id}, isOwn: ${isOwn}`);
          return {
            ...m,
            isOwn: isOwn
          };
        });
        console.log(`[STUDENT] Loaded ${processedMessages.length} messages from localStorage`);
        setMessages(processedMessages);
      } else {
        setMessages([]);
      }
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
    setMessages([]);
  } finally {
    setLoading(false);
  }
};

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTutor) return;

    const msg = {
      id: Date.now(),
      sender_id: currentUserId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true
    };
     console.log(`[TUTOR SEND] Message sender_id: ${msg.sender_id}, isOwn: ${msg.isOwn}`);
console.log(`[TUTOR SEND] Current tutor user ID: ${currentUserId}`);
    try {
    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    setNewMessage('');

      // ✅ FIX: Use tutor.id (tutor_profile_id) for consistency with TutorMessagingView
      const tutorProfileId = selectedTutor.tutor_profile_id || selectedTutor.id;
      const conversationKey = `conversation:${currentUserId}:${tutorProfileId}`;

      const conversationData = {
        tutorUserId: selectedTutor.user_id,          // user ID (for sender identification)
        tutorProfileId: tutorProfileId,               // profile ID (for conversation key)
        tutorName: selectedTutor.name,
        studentId: currentUserId,
        studentName: 'Student Name', // Replace with auth name if available
        lastMessage: msg.text,
        lastMessageTime: msg.timestamp,
        messages: updatedMessages
      };

      console.log(`💾 Saving message with key: ${conversationKey}`);
      console.log(`💾 Tutor User ID: ${selectedTutor.user_id}, Profile ID: ${tutorProfileId}`);

      // Save to storage
      if (window.storage && window.storage.set) {
        await window.storage.set(conversationKey, JSON.stringify(conversationData));
      } else {
        localStorage.setItem(conversationKey, JSON.stringify(conversationData));
      }

      // Simulate tutor response
      const currentTutor = selectedTutor;
      const currentConversationData = conversationData;

      setTimeout(async () => {
        const responses = [
          "That's a great question! Let me explain...",
          "I'd be happy to help you with that.",
          "Good observation! Here's what you need to know:",
          "Let me break this down for you step by step.",
          "That's an interesting topic. Let's explore it together.",
          "I understand what you're asking. Here's my take:",
        ];

        const tutorMsg = {
          id: Date.now() + 1,
          sender_id: currentTutor.user_id,
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          isOwn: false
        };

        setMessages(prevMessages => {
          if (selectedTutor?.user_id === currentTutor.user_id) {
            return [...prevMessages, tutorMsg];
          }
          return prevMessages;
        });

        // Update storage
        currentConversationData.messages = [...updatedMessages, tutorMsg];
        currentConversationData.lastMessage = tutorMsg.text;
        currentConversationData.lastMessageTime = tutorMsg.timestamp;

        if (window.storage && window.storage.set) {
          await window.storage.set(conversationKey, JSON.stringify(currentConversationData));
        } else {
          localStorage.setItem(conversationKey, JSON.stringify(currentConversationData));
        }
      }, 1000 + Math.random() * 1000);

    } catch (err) {
      console.error('Failed to save message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const startVideoCall = async (tutor) => {
    setShowVideoCall(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Video call failed:', err);
      alert('Cannot access camera/microphone. Please check permissions.');
      setShowVideoCall(false);
    }
  };

  const endVideoCall = () => {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setLocalStream(null);
    setShowVideoCall(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Registered Tutors</h1>

      {/* Debug Info */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-3 text-sm mb-4">
        <p className="font-semibold">🔍 Student Debug Info:</p>
        <p>Current Student ID: <strong>{currentUserId}</strong></p>
        <p className="text-xs mt-1 text-gray-600">
          Conversation keys format: conversation:{currentUserId}:tutorProfileId
        </p>
      </div>

      {/* Tutor List */}
      <div className="space-y-3 bg-white rounded-lg shadow p-4">
        {tutors.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tutors available</p>
        ) : (
          tutors.map(tutor => (
            <div key={tutor.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {tutor.avatar && <div className="text-3xl flex-shrink-0">{tutor.avatar}</div>}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 truncate">{tutor.name}</div>
                  <div className="text-sm text-gray-600 truncate">{tutor.expertise}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Profile ID: <strong>{tutor.tutor_profile_id || tutor.id}</strong> | 
                    User ID: {tutor.user_id}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors whitespace-nowrap"
                  onClick={() => openConversation(tutor)}
                >
                  <MessageSquare size={16} /> Message
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors whitespace-nowrap"
                  onClick={() => startVideoCall(tutor)}
                >
                  <Video size={16} /> Call
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Messages Side Panel */}
      {showMessages && selectedTutor && (
        <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white z-50 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedTutor.avatar}</span>
              <div>
                <h2 className="font-semibold">{selectedTutor.name}</h2>
                <p className="text-xs text-blue-100">{selectedTutor.expertise}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowMessages(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                      msg.isOwn 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                    }`}>
                      <p className="break-words">{msg.text}</p>
                      <span className={`text-xs block mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button 
                onClick={sendMessage} 
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* Remote Video */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 md:w-40 md:h-30 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
              <button
                onClick={endVideoCall}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg transition-colors font-medium"
              >
                <X size={20} /> End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingVideoChat;