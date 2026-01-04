import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Send, ArrowLeft, CheckCheck, Clock, Search } from 'lucide-react';
import io from 'socket.io-client';
import { Paperclip, Mic, X, FileText, Image as ImageIcon } from 'lucide-react';
const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const TutorMessagingView = ({ 
  currentTutorUserId,  
  tutorProfileId,
  tutorName = 'Dr. Sarah Johnson' 
}) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

const [attachmentFile, setAttachmentFile] = useState(null);
const [isRecording, setIsRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState(null);
const [audioChunks, setAudioChunks] = useState([]);
const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO
  useEffect(() => {
    console.log('🔌 [TUTOR] Connecting to Socket.IO server...');
    
    socketRef.current = io(API_URL, {
      auth: { userId: currentTutorUserId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB');
      return;
    }
    setAttachmentFile(file);
  }
};

const removeAttachment = () => {
  setAttachmentFile(null);
  if (fileInputRef.current) fileInputRef.current.value = '';
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      setAttachmentFile(file);
      stream.getTracks().forEach(track => track.stop());
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setAudioChunks(chunks);
  } catch (err) {
    console.error('Microphone access denied:', err);
    alert('Please allow microphone access to record voice messages');
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  }
};

const uploadAttachment = async (file, conversationId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversation_id', conversationId);
  
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/messages/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (!response.ok) throw new Error('Upload failed');
  
  const data = await response.json();
  return data.file_url;
};

// Replace the existing sendMessage function with this updated version:

const sendMessage = async () => {
  if ((!newMessage.trim() && !attachmentFile) || !selectedConversation) return;

  const studentId = selectedConversation.studentId || selectedConversation.partnerId;
  
  if (!studentId) {
    console.error('[TUTOR] ERROR: Cannot send message - no student ID!');
    return;
  }

  const tempId = Date.now();
  let fileUrl = null;
  let fileType = null;
  let fileName = null;

  // Upload attachment if present
  if (attachmentFile) {
    try {
      fileUrl = await uploadAttachment(attachmentFile, selectedConversation.id);
      fileType = attachmentFile.type.startsWith('image/') ? 'image' : 
                 attachmentFile.type.startsWith('audio/') ? 'voice' : 'file';
      fileName = attachmentFile.name;
      console.log('[TUTOR] Attachment uploaded:', fileUrl);
    } catch (err) {
      console.error('[TUTOR] Upload failed:', err);
      alert('Failed to upload attachment');
      return;
    }
  }

  const msg = {
    id: tempId,
    sender_id: currentTutorUserId,
    text: newMessage.trim() || (fileType === 'voice' ? '🎤 Voice message' : '📎 File attachment'),
    timestamp: new Date().toISOString(),
    isOwn: true,
    status: 'sending',
    file_url: fileUrl,
    file_type: fileType,
    file_name: fileName
  };

  const updatedMessages = [...messages, msg];
  setMessages(updatedMessages);
  setNewMessage('');
  setAttachmentFile(null);
  if (fileInputRef.current) fileInputRef.current.value = '';

  try {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', {
        conversationId: selectedConversation.id,
        sender_id: currentTutorUserId,
        receiver_id: studentId,
        text: msg.text,
        timestamp: msg.timestamp,
        messageId: tempId,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName
      });
      
      console.log(`[TUTOR] Sent message to student ${studentId}`);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    }

    const studentName = selectedConversation.studentName || selectedConversation.partnerName || 'Student';
    
    const conversationData = {
      tutorUserId: currentTutorUserId,
      tutorProfileId: tutorProfileId,
      studentId: studentId,
      studentName: studentName,
      tutorName: tutorName,
      lastMessage: msg.text,
      lastMessageTime: msg.timestamp,
      messages: updatedMessages
    };

    if (window.storage && window.storage.set) {
      await window.storage.set(selectedConversation.id, JSON.stringify(conversationData));
    } else {
      localStorage.setItem(selectedConversation.id, JSON.stringify(conversationData));
    }

    setConversations(prevConvs =>
      prevConvs.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: msg.text, lastMessageTime: msg.timestamp }
          : conv
      ).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0))
    );

  } catch (err) {
    console.error('Failed to send message:', err);
    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
  }
};

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ [TUTOR] Socket connected:', socket.id);
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ [TUTOR] Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socket.on('receive_message', (data) => {
      console.log('📩 [TUTOR] Received message:', data);
      console.log('📩 [TUTOR] Sender:', data.sender_id, 'Receiver:', data.receiver_id);
      console.log('📩 [TUTOR] Current tutor ID:', currentTutorUserId);
      
      // Update messages if this conversation is open
      if (selectedConversation) {
        const studentId = selectedConversation.studentId || selectedConversation.partnerId;
        const isRelevant = data.sender_id === studentId || 
                          data.sender_id === currentTutorUserId;
        
        console.log('📩 [TUTOR] Selected student ID:', studentId);
        console.log('📩 [TUTOR] Is relevant to current chat?', isRelevant);
        
        if (isRelevant) {
          setMessages(prev => {
            // 🔥 Check for duplicate by ID
            if (prev.some(m => m.id === data.id)) {
              console.log('📩 [TUTOR] ⚠️ Duplicate message detected, skipping');
              return prev;
            }
            console.log('📩 [TUTOR] ✅ Adding new message to chat');
            return [...prev, {
              ...data,
              isOwn: data.sender_id === currentTutorUserId
            }];
          });
        }
      } else {
        console.log('📩 [TUTOR] No conversation selected, updating conversation list only');
      }

      // Always update conversation list (but avoid duplicates)
      setConversations(prev => prev.map(conv => {
        const convStudentId = conv.studentId || conv.partnerId;
        if (convStudentId === data.sender_id || conv.id === data.conversationId) {
          return {
            ...conv,
            lastMessage: data.text,
            lastMessageTime: data.timestamp,
            unreadCount: selectedConversation?.id === conv.id ? 0 : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)));
    });

    socket.on('message_delivered', ({ messageId, dbMessageId, status }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, id: dbMessageId || msg.id, status } : msg
      ));
    });

    socket.on('user_typing', ({ userId, conversationId }) => {
      if (selectedConversation && userId !== currentTutorUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket.on('users_online', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('user_status', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentTutorUserId]); // 🔥 REMOVED selectedConversation from dependencies

  // Load conversations
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [tutorProfileId]);

  // Auto-join all conversation rooms when conversations load
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && conversations.length > 0) {
      console.log('[TUTOR] Auto-joining all conversation rooms...');
      
      conversations.forEach(conv => {
        const studentId = conv.studentId || conv.partnerId;
        
        if (studentId) {
          socketRef.current.emit('join_conversation', {
            conversationId: conv.id,
            userId: currentTutorUserId,
            partnerId: studentId
          });
          
          const studentName = conv.studentName || conv.partnerName || 'Student';
          console.log(`[TUTOR] Joined room for conversation with ${studentName} (student ID: ${studentId})`);
        } else {
          console.warn('[TUTOR] WARNING: Conversation missing student ID:', conv);
        }
      });
    }
  }, [conversations, currentTutorUserId]);

  const loadConversations = async () => {
    try {
      console.log('[TUTOR] Loading conversations from database...');
      const res = await fetch(`${API_URL}/api/tutors/${tutorProfileId}/conversations`);
      const data = await res.json();
      
      if (res.ok && Array.isArray(data) && data.length > 0) {
        console.log('[TUTOR] Loaded conversations from database:', data.length);
        setConversations(data);
        return;
      }
    } catch (err) {
      console.log('[TUTOR] Database not available, using storage:', err);
    }

    // Fallback to storage
    try {
      const allConversations = [];
      
      if (window.storage && window.storage.list) {
        const result = await window.storage.list('conversation:');
        
        if (result && result.keys) {
          for (const key of result.keys) {
            try {
              const convResult = await window.storage.get(key);
              if (convResult && convResult.value) {
                const convData = JSON.parse(convResult.value);
                
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
              console.log(`Error processing key ${key}:`, err);
            }
          }
        }
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('conversation:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const convData = JSON.parse(data);
                
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
              console.log(`Error processing key ${key}:`, err);
            }
          }
        }
      }

      allConversations.sort((a, b) => 
        new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
      );
      
      console.log('[TUTOR] Loaded conversations from storage:', allConversations.length);
      setConversations(allConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    }
  };

  const openConversation = async (conversation) => {
    console.log('[TUTOR] Opening conversation:', conversation);
    console.log('[TUTOR] Student ID from conversation:', conversation.studentId || conversation.partnerId);
    
    setSelectedConversation(conversation);
    setLoading(true);

    // 🔥 FIX: Get studentId from either field
    const studentId = conversation.studentId || conversation.partnerId;
    
    if (!studentId) {
      console.error('[TUTOR] ERROR: No student ID found in conversation object!');
      setLoading(false);
      return;
    }

    // 🔥 FIX: Join socket room with partnerId
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', {
        conversationId: conversation.id,
        userId: currentTutorUserId,
        partnerId: studentId  // ✅ Use the extracted studentId
      });
      
      console.log(`[TUTOR] Joined conversation ${conversation.id} with student ${studentId}`);
    }

    // Mark as read
    setConversations(prev => prev.map(conv =>
      conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
    ));

    try {
      // Try to load from database first
      if (typeof conversation.id === 'number') {
        console.log('[TUTOR] Loading messages from database...');
        const messagesRes = await fetch(`${API_URL}/api/conversations/${conversation.id}/messages`);
        
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          const processedMessages = (messagesData.messages || []).map(m => ({
            ...m,
            isOwn: String(m.sender_id) === String(currentTutorUserId)
          }));
          console.log('[TUTOR] Loaded messages from database:', processedMessages.length);
          setMessages(processedMessages);
          setLoading(false);
          return;
        }
      }

      // Fallback to storage
      console.log('[TUTOR] Loading messages from storage...');
      if (window.storage && window.storage.get) {
        try {
          const result = await window.storage.get(conversation.id);
          if (result && result.value) {
            const convData = JSON.parse(result.value);
            const processedMessages = (convData.messages || []).map(m => ({
              ...m,
              isOwn: String(m.sender_id) === String(currentTutorUserId)
            }));
            console.log('[TUTOR] Loaded messages from storage:', processedMessages.length);
            setMessages(processedMessages);
          } else {
            setMessages([]);
          }
        } catch (storageErr) {
          console.log('[TUTOR] Storage error:', storageErr);
          setMessages([]);
        }
      } else {
        const data = localStorage.getItem(conversation.id);
        if (data) {
          const convData = JSON.parse(data);
          setMessages((convData.messages || []).map(m => ({
            ...m,
            isOwn: String(m.sender_id) === String(currentTutorUserId)
          })));
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



  const handleTyping = () => {
    if (socketRef.current && selectedConversation) {
      socketRef.current.emit('typing', {
        conversationId: selectedConversation.id,
        userId: currentTutorUserId
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', {
          conversationId: selectedConversation.id,
          userId: currentTutorUserId
        });
      }, 2000);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
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
    (conv.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showingChat = selectedConversation !== null;
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Connection Status */}
      <div className={`px-4 py-2 text-sm ${
        connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
        connectionStatus === 'disconnected' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {connectionStatus === 'connected' ? '🟢 Connected - Messages saved to database' :
         connectionStatus === 'disconnected' ? '🟡 Connecting...' :
         '🔴 Connection error'}
      </div>

      {showingChat && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
              <User size={20} />
              {onlineUsers.has(selectedConversation?.studentId || selectedConversation?.partnerId) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold">{selectedConversation?.studentName || selectedConversation?.partnerName || 'Student'}</h2>
              <p className="text-xs text-blue-100">
                {onlineUsers.has(selectedConversation?.studentId || selectedConversation?.partnerId) ? '● Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      )}
{showingChat && (
  <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
    {/* Messages Container */}
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
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
          {/* Message Bubbles */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                msg.isOwn
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
              }`}>
                {/* File attachment */}
                {msg.file_url && (
                  <div className="mb-2">
                    {msg.file_type === 'image' ? (
                      <img src={msg.file_url} alt="attachment" className="rounded max-w-full h-auto" />
                    ) : msg.file_type === 'voice' ? (
                      <audio controls className="w-full">
                        <source src={msg.file_url} type="audio/webm" />
                      </audio>
                    ) : (
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" 
                         className={`flex items-center gap-2 ${msg.isOwn ? 'text-blue-100' : 'text-blue-600'}`}>
                        <FileText size={16} />
                        <span className="text-sm underline">{msg.file_name || 'Download file'}</span>
                      </a>
                    )}
                  </div>
                )}
                
                <p className="break-words">{msg.text}</p>
                <div className={`flex items-center justify-between gap-2 mt-1 text-xs ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.isOwn && msg.status === 'delivered' && <CheckCheck size={14} />}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>

    {/* Input Area - OUTSIDE the messages container */}
    <div className="bg-white border-t border-gray-200 p-3">
      {/* Attachment preview */}
      {attachmentFile && (
        <div className="mb-2 flex items-center gap-2 bg-gray-100 p-2 rounded">
          {attachmentFile.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
          <span className="text-sm flex-1 truncate">{attachmentFile.name}</span>
          <button onClick={removeAttachment} className="text-red-600 hover:text-red-800">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex gap-2 max-w-4xl mx-auto items-center">
        {/* File attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
        >
          <Paperclip size={20} />
        </button>
        
        {/* Voice recording button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full transition ${
            isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Mic size={20} />
        </button>
        
        <input
          type="text"
          placeholder={isRecording ? 'Recording...' : 'Type your message...'}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isRecording}
        />
        <button
          onClick={sendMessage}
          disabled={(!newMessage.trim() && !attachmentFile) || connectionStatus !== 'connected'}
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