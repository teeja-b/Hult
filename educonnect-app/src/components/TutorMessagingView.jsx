import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Send, X, Clock, Search, ArrowLeft } from 'lucide-react';

const API_URL = 'https://hult-ten.vercel.appapi';

// ✅ IMPORTANT: Pass the tutor's USER ID, not profile ID
const TutorMessagingView = ({ 
  currentTutorUserId,  
  tutorProfileId,// This should be the USER ID (e.g., 6, 7)
  tutorName = 'Dr. Sarah Johnson' 
}) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load all conversations for this tutor
  useEffect(() => {
    loadConversations();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [tutorProfileId]);

 const loadConversations = async () => {
  console.log(`[TUTOR LOAD] Starting loadConversations for profile ID: ${tutorProfileId}`);
  
  try {
    // Try API first
    const res = await fetch(`${API_URL}/tutors/${tutorProfileId}/conversations`);
    const data = await res.json();
    console.log(`[TUTOR LOAD] API returned:`, data);
    
    if (res.ok && Array.isArray(data) && data.length > 0) {
      console.log(`[TUTOR LOAD] API returned ${data.length} conversations`);
      setConversations(data);
      return;
    }
    
    console.log(`[TUTOR LOAD] API returned 0 conversations, checking storage...`);
  } catch (err) {
    console.log('[TUTOR LOAD] API not available, using storage');
  }

  // Fallback to storage
  try {
    const allConversations = [];
    
    if (window.storage && window.storage.list) {
      console.log('[TUTOR] Using window.storage');
      const result = await window.storage.list('conversation:');
      
      if (result && result.keys) {
        console.log(`[TUTOR] Found ${result.keys.length} conversation keys`);
        
        for (const key of result.keys) {
          try {
            const convResult = await window.storage.get(key);
            if (convResult && convResult.value) {
              const convData = JSON.parse(convResult.value);
              
              // Check if this conversation involves this tutor (by profile ID)
              if (String(convData.tutorProfileId) === String(tutorProfileId)) {
                allConversations.push({
                  id: key,
                  studentId: convData.studentId,
                  studentName: convData.studentName || 'Unknown Student',
                  lastMessage: convData.lastMessage || 'No messages',
                  lastMessageTime: convData.lastMessageTime || new Date().toISOString(),
                  unreadCount: 0
                });
              }
            }
          } catch (err) {
            console.log(`[TUTOR] Error processing key ${key}:`, err);
          }
        }
      }
    } else {
      console.log('[TUTOR] Using localStorage fallback');
      // Fallback to localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('conversation:')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const convData = JSON.parse(data);
              
              // Check if this conversation involves this tutor (by profile ID)
              if (String(convData.tutorProfileId) === String(tutorProfileId)) {
                allConversations.push({
                  id: key,
                  studentId: convData.studentId,
                  studentName: convData.studentName || 'Unknown Student',
                  lastMessage: convData.lastMessage || 'No messages',
                  lastMessageTime: convData.lastMessageTime || new Date().toISOString(),
                  unreadCount: 0
                });
              }
            }
          } catch (err) {
            console.log(`[TUTOR] Error processing localStorage key ${key}:`, err);
          }
        }
      }
      console.log(`[TUTOR] Found ${allConversations.length} conversations in localStorage`);
    }

    // Sort by most recent
    allConversations.sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
    
    console.log(`[TUTOR] Loaded ${allConversations.length} conversations`);
    setConversations(allConversations);
  } catch (err) {
    console.error('[TUTOR] Failed to load conversations:', err);
    setConversations([]);
  }
};


  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setLoading(true);

    console.log(`[TUTOR] Opening conversation: ${conversation.id}`);

    try {
      // Try API first
      const res = await fetch(`${API_URL}/conversations/${conversation.studentId}/${currentTutorUserId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data.map(m => ({
          ...m,
          isOwn: String(m.sender_id) === String(currentTutorUserId)
        })) : []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log('API not available, using storage');
    }

    // Fallback to storage
    try {
      if (window.storage && window.storage.get) {
        try {
          const result = await window.storage.get(conversation.id);
          console.log(`[TUTOR] Storage result for ${conversation.id}:`, result);
          if (result && result.value) {
            const convData = JSON.parse(result.value);
            console.log(`[TUTOR] Parsed conversation data:`, convData);
            console.log(`[TUTOR] Number of messages:`, convData.messages?.length || 0);
            console.log(`[TUTOR] Current tutor user ID:`, currentTutorUserId);
            
            const processedMessages = (convData.messages || []).map(m => {
              const isOwn = String(m.sender_id) === String(currentTutorUserId);
              console.log(`[TUTOR] Message sender_id: ${m.sender_id}, isOwn: ${isOwn}`);
              return {
                ...m,
                isOwn
              };
            });
            
            console.log(`[TUTOR] Setting ${processedMessages.length} messages`);
            setMessages(processedMessages);
          } else {
            console.log(`[TUTOR] No data found for conversation`);
            setMessages([]);
          }
        } catch (storageErr) {
          console.log(`[TUTOR] Storage key not found or error:`, storageErr);
          setMessages([]);
        }
      } else {
        // Fallback to localStorage
        console.log('[TUTOR] Using localStorage');
        const data = localStorage.getItem(conversation.id);
        console.log(`[TUTOR] LocalStorage data exists:`, !!data);
        if (data) {
          const convData = JSON.parse(data);
          console.log(`[TUTOR] Messages from localStorage:`, convData.messages?.length || 0);
          setMessages((convData.messages || []).map(m => ({
            ...m,
            isOwn: String(m.sender_id) === String(currentTutorUserId)
          })));
        } else {
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('[TUTOR] Failed to load messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const msg = {
      id: Date.now(),
      sender_id: currentTutorUserId,  // ✅ Use tutor USER ID
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true
    };

    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    setNewMessage('');

    console.log(`[TUTOR] Sending message to conversation: ${selectedConversation.id}`);

    try {
      // Try API first
      await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          sender_id: currentTutorUserId,
          text: msg.text,
          timestamp: msg.timestamp
        })
      });
    } catch (err) {
      console.log('API not available, using storage');
    }

    // Update storage
    try {
      const conversationData = {
        tutorUserId: currentTutorUserId, 
        tutorProfileId: tutorProfileId, // ✅ Store tutor USER ID
        studentId: selectedConversation.studentId,
        studentName: selectedConversation.studentName,
        tutorName: tutorName,
        lastMessage: msg.text,
        lastMessageTime: msg.timestamp,
        messages: updatedMessages
      };

      console.log(`[TUTOR] Saving to storage with key: ${selectedConversation.id}`);

      if (window.storage && window.storage.set) {
        await window.storage.set(selectedConversation.id, JSON.stringify(conversationData));
      } else {
        localStorage.setItem(selectedConversation.id, JSON.stringify(conversationData));
      }

      // Update conversation list
      setConversations(prevConvs =>
        prevConvs.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: msg.text, lastMessageTime: msg.timestamp }
            : conv
        ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
      );

      console.log('[TUTOR] Message saved successfully');
    } catch (err) {
      console.error('Failed to save message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile: Show conversations list OR chat
  // Desktop: Show both side by side
  const showingChat = selectedConversation !== null;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Debug Info */}
{/* Debug Info */}
<div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 text-sm">
  <p className="font-semibold">🔍 Debug Info:</p>
  <p>Current Tutor User ID: <strong>{currentTutorUserId}</strong></p>
  <p>Tutor Profile ID: <strong>{tutorProfileId}</strong></p>
  <p>Tutor Name: <strong>{tutorName}</strong></p>
  <p>Conversations Found: <strong>{conversations.length}</strong></p>
</div>

      {/* Only show header when chat is open (mobile) */}
      {showingChat && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-semibold">{selectedConversation.studentName}</h2>
              <p className="text-xs text-blue-100">Student ID: {selectedConversation.studentId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      {!showingChat && (
        <div className="p-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-lg shadow p-3 border-l-4 border-blue-500">
              <p className="text-2xl font-bold text-gray-800">{conversations.length}</p>
              <p className="text-sm text-gray-600">Total Chats</p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 border-l-4 border-green-500">
              <p className="text-2xl font-bold text-gray-800">
                {conversations.filter(c => c.unreadCount > 0).length}
              </p>
              <p className="text-sm text-gray-600">Unread</p>
            </div>
          </div>

          {/* Conversations List */}
          {filteredConversations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Students will appear here when they message you
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all border-l-4 border-blue-500 hover:border-purple-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conv.studentName}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        {formatTime(conv.lastMessageTime)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat View */}
      {showingChat && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 240px)' }}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                      msg.isOwn
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm'
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

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-3">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorMessagingView;