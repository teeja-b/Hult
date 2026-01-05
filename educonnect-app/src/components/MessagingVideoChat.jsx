import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, CheckCheck, Check, User, Search } from 'lucide-react';
import io from 'socket.io-client';
import { Paperclip, Mic, FileText, Image as ImageIcon } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const MessagingVideoChat = ({ currentUserId = 'user123' }) => {
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [conversationId, setConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
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

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('🔌 [STUDENT] Connecting to Socket.IO server...');
    
    socketRef.current = io(API_URL, {
      auth: { userId: currentUserId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ [STUDENT] Socket connected:', socket.id);
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ [STUDENT] Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[STUDENT] Socket connection error:', error);
      setConnectionStatus('error');
    });

    socket.on('receive_message', (data) => {
      console.log('📩 [STUDENT] Received message:', data);
      
      if (selectedTutor) {
        const isRelevant = data.sender_id === selectedTutor.user_id || 
                          data.sender_id === currentUserId;
        
        if (isRelevant) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.id)) {
              console.log('📩 [STUDENT] ⚠️ Duplicate message detected, skipping');
              return prev;
            }
            console.log('📩 [STUDENT] ✅ Adding new message to chat');
            return [...prev, {
              ...data,
              isOwn: data.sender_id === currentUserId
            }];
          });
        }
      }
    });

    socket.on('message_delivered', ({ messageId, dbMessageId, status }) => {
      console.log('✅ [STUDENT] Message delivered:', messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, id: dbMessageId, status } : msg
      ));
    });

    socket.on('user_typing', ({ userId, conversationId }) => {
      if (selectedTutor && userId === selectedTutor.user_id) {
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
  }, [currentUserId, selectedTutor]);

  // Fetch tutors
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tutors`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setTutors(data);
        } else if (data.tutors && Array.isArray(data.tutors)) {
          setTutors(data.tutors);
        } else {
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
      
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', {
          conversationId: conversationKey,
          userId: currentUserId,
          partnerId: tutor.user_id
        });
        
        console.log(`[STUDENT] Joined conversation ${conversationKey} with tutor ${tutor.user_id}`);
      }

      try {
        const convsRes = await fetch(`${API_URL}/api/students/${currentUserId}/conversations`);
        if (convsRes.ok) {
          const conversations = await convsRes.json();
          const conv = conversations.find(c => c.partnerId === tutor.user_id);
          
          if (conv && conv.id) {
            setConversationId(conv.id);
            
            const messagesRes = await fetch(`${API_URL}/api/conversations/${conv.id}/messages`);
            if (messagesRes.ok) {
              const messagesData = await messagesRes.json();
              const processedMessages = (messagesData.messages || []).map(m => ({
                ...m,
                isOwn: String(m.sender_id) === String(currentUserId)
              }));
              console.log('[STUDENT] Loaded messages from database:', processedMessages.length);
              if (processedMessages.length > 0) {
                console.log('[STUDENT] Last message data:', processedMessages[processedMessages.length - 1]);
              }
              setMessages(processedMessages);
              setLoading(false);
              return;
            }
          }
        }
      } catch (dbError) {
        console.log('[STUDENT] Database load failed, falling back to storage:', dbError);
      }

      let result;
      if (window.storage && window.storage.get) {
        try {
          result = await window.storage.get(conversationKey);
          if (result) {
            const conversationData = JSON.parse(result.value);
            const processedMessages = (conversationData.messages || []).map(m => ({
              ...m,
              isOwn: String(m.sender_id) === String(currentUserId)
            }));
            setMessages(processedMessages);
          } else {
            setMessages([]);
          }
        } catch (storageErr) {
          setMessages([]);
        }
      } else {
        const data = localStorage.getItem(conversationKey);
        if (data) {
          const conversationData = JSON.parse(data);
          const processedMessages = (conversationData.messages || []).map(m => ({
            ...m,
            isOwn: String(m.sender_id) === String(currentUserId)
          }));
          setMessages(processedMessages);
        } else {
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('[STUDENT] Failed to load messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
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

 const sendMessage = async () => {
  if ((!newMessage.trim() && !attachmentFile) || !selectedTutor) return;

  const tempId = Date.now();
  let fileUrl = null;
  let fileType = null;
  let fileName = null;

  // Handle file upload FIRST if there's a file
  if (attachmentFile) {
    try {
      console.log('📤 Uploading file...', attachmentFile.name);
      
      // Show uploading indicator
      setMessages(prev => [...prev, {
        id: tempId,
        sender_id: currentUserId,
        text: '📤 Uploading file...',
        timestamp: new Date().toISOString(),
        isOwn: true,
        status: 'uploading'
      }]);
      
      const conversationKey = `conversation:${currentUserId}:${selectedTutor.tutor_profile_id || selectedTutor.id}`;
      
      const formData = new FormData();
      formData.append('file', attachmentFile);
      formData.append('conversation_id', conversationKey);
      
      const token = localStorage.getItem('token');
      
      const uploadResponse = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadData = await uploadResponse.json();
      fileUrl = uploadData.file_url;
      
      if (!fileUrl || fileUrl.startsWith('blob:')) {
        throw new Error('Upload returned invalid URL');
      }
      
      fileType = attachmentFile.type.startsWith('image/') ? 'image' : 
                 attachmentFile.type.startsWith('audio/') ? 'voice' : 'file';
      fileName = attachmentFile.name;
      
      console.log('✅ File uploaded successfully:', fileUrl);
      
      // Remove uploading message
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Failed to upload attachment. Please try again.');
      return;
    }
  }

  // Create message object
  const msg = {
    id: tempId,
    sender_id: currentUserId,
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
    const tutorProfileId = selectedTutor.tutor_profile_id || selectedTutor.id;
    const conversationKey = `conversation:${currentUserId}:${tutorProfileId}`;

    // 🔥 CRITICAL FIX: Send via Socket.IO which will save to database
    if (socketRef.current && socketRef.current.connected) {
      // Create a promise to wait for message delivery confirmation
      const messageDeliveryPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message delivery timeout'));
        }, 10000); // 10 second timeout

        // Listen for delivery confirmation
        socketRef.current.once('message_delivered', (data) => {
          clearTimeout(timeout);
          if (data.messageId === tempId) {
            resolve(data.dbMessageId);
          }
        });
      });
      console.log('📤 About to emit to socket:', {
  fileUrl: fileUrl,
  fileType: fileType,
  fileName: fileName,
  text: msg.text
});

      // Emit the message
      socketRef.current.emit('send_message', {
        conversationId: conversationKey,
        sender_id: currentUserId,
        receiver_id: selectedTutor.user_id,
        text: msg.text,
        timestamp: msg.timestamp,
        messageId: tempId,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName
      });

      console.log(`[STUDENT] Sent message to tutor ${selectedTutor.user_id}`);

      // Wait for delivery confirmation
      try {
        const dbMessageId = await messageDeliveryPromise;
        console.log(`✅ [STUDENT] Message saved to database with ID: ${dbMessageId}`);
        
        // Update message status to 'sent' with database ID
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, id: dbMessageId, status: 'sent' } : m
        ));
      } catch (err) {
        console.warn('⚠️ [STUDENT] Message delivery timeout, but message may have been sent');
        // Mark as sent anyway since socket is connected
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, status: 'sent' } : m
        ));
      }
    } else {
      console.error('❌ [STUDENT] Socket not connected!');
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));
      return;
    }

    // Save to storage as backup
    const conversationData = {
      tutorUserId: selectedTutor.user_id,
      tutorProfileId: tutorProfileId,
      tutorName: selectedTutor.name,
      studentId: currentUserId,
      studentName: 'Student Name',
      lastMessage: msg.text,
      lastMessageTime: msg.timestamp,
      messages: updatedMessages
    };

    if (window.storage && window.storage.set) {
      await window.storage.set(conversationKey, JSON.stringify(conversationData));
    } else {
      localStorage.setItem(conversationKey, JSON.stringify(conversationData));
    }

  } catch (err) {
    console.error('[STUDENT] Failed to send message:', err);
    setMessages(prev => prev.map(m => 
      m.id === tempId ? { ...m, status: 'failed' } : m
    ));
  }
};

  const handleTyping = () => {
    if (socketRef.current && selectedTutor) {
      const tutorProfileId = selectedTutor.tutor_profile_id || selectedTutor.id;
      const conversationKey = `conversation:${currentUserId}:${tutorProfileId}`;
      
      socketRef.current.emit('typing', {
        conversationId: conversationKey,
        userId: currentUserId
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', {
          conversationId: conversationKey,
          userId: currentUserId
        });
      }, 2000);
    }
  };

  const getMessageStatus = (msg) => {
    if (!msg.isOwn) return null;
    
    switch (msg.status) {
      case 'sending':
        return <Check size={14} className="text-gray-400" />;
      case 'sent':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-blue-400" />;
      case 'failed':
        return <span className="text-red-400 text-xs">Failed</span>;
      default:
        return <CheckCheck size={14} className="text-gray-400" />;
    }
  };

  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tutor.expertise && tutor.expertise.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Registered Tutors</h1>

      {/* Connection Status Indicator */}
      <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
        connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
        connectionStatus === 'disconnected' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        <span className="font-semibold">
          {connectionStatus === 'connected' ? '🟢 Connected - Messages saved to database' :
           connectionStatus === 'disconnected' ? '🟡 Connecting...' :
           '🔴 Connection Error'}
        </span>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search tutors by name or expertise..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tutor List */}
      <div className="space-y-3 bg-white rounded-lg shadow p-4">
        {filteredTutors.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {searchQuery ? 'No tutors found matching your search' : 'No tutors available'}
          </p>
        ) : (
          filteredTutors.map(tutor => (
            <div key={tutor.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative">
                  {tutor.avatar ? (
                    <div className="text-3xl flex-shrink-0">{tutor.avatar}</div>
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-blue-600" />
                    </div>
                  )}
                  {onlineUsers.has(tutor.user_id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 truncate flex items-center gap-2">
                    {tutor.name}
                    {onlineUsers.has(tutor.user_id) && (
                      <span className="text-xs text-green-600 font-normal">● Online</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{tutor.expertise}</div>
                </div>
              </div>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors whitespace-nowrap"
                onClick={() => openConversation(tutor)}
              >
                <MessageSquare size={16} /> Message
              </button>
            </div>
          ))
        )}
      </div>

      {/* Messages Panel */}
      {showMessages && selectedTutor && (
        <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white z-50 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              {selectedTutor.avatar ? (
                <span className="text-2xl">{selectedTutor.avatar}</span>
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
              )}
              <div>
                <h2 className="font-semibold">{selectedTutor.name}</h2>
                <p className="text-xs text-blue-100">
                  {onlineUsers.has(selectedTutor.user_id) ? '● Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  console.log('=== ALL MESSAGES DEBUG ===');
                  messages.forEach((msg, i) => {
                    console.log(`Message ${i}:`, {
                      id: msg.id,
                      text: msg.text,
                      file_url: msg.file_url,
                      file_type: msg.file_type,
                      file_name: msg.file_name,
                      timestamp: msg.timestamp
                    });
                  });
                }}
                className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
              >
                Debug
              </button>
              <button 
                onClick={() => setShowMessages(false)}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>
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
                {messages.map((msg) => {
                  // Debug log
                  console.log('Rendering message:', {
                    id: msg.id,
                    text: msg.text,
                    file_url: msg.file_url,
                    file_type: msg.file_type,
                    file_name: msg.file_name
                  });
                  
                  return (
                    <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                        msg.isOwn 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                      }`}>
                        {/* File Display */}
                        {msg.file_url && (
                          <div className="mb-2">
                            {msg.file_type === 'image' ? (
                              <img 
                                src={msg.file_url} 
                                alt="attachment" 
                                className="rounded max-w-full h-auto max-h-64 cursor-pointer"
                                onClick={() => window.open(msg.file_url, '_blank')}
                              />
                            ) : msg.file_type === 'voice' ? (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Mic size={16} className={msg.isOwn ? 'text-blue-100' : 'text-blue-600'} />
                                  <span className="text-sm">Voice message</span>
                                </div>
                                <audio controls className="w-full" style={{ maxWidth: '250px' }}>
                                  <source src={msg.file_url} type="audio/webm" />
                                  <source src={msg.file_url} type="audio/mp4" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            ) : (
                              <a 
                                href={msg.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`flex items-center gap-2 ${msg.isOwn ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                              >
                                <FileText size={16} />
                                <span className="text-sm underline">{msg.file_name || 'Download file'}</span>
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* Text Content - show actual message text */}
                        {msg.text && !msg.text.startsWith('🎤') && !msg.text.startsWith('📎') && !msg.text.startsWith('📤') ? (
                          <p className="break-words">{msg.text}</p>
                        ) : !msg.file_url && msg.text ? (
                          <p className="break-words">{msg.text}</p>
                        ) : null}
                        
                        {/* Timestamp */}
                        <div className={`flex items-center justify-between gap-2 mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                          <span className="text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {getMessageStatus(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
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
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 bg-white">
            {attachmentFile && (
              <div className="mb-2 flex items-center gap-2 bg-gray-100 p-2 rounded">
                {attachmentFile.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                <span className="text-sm flex-1 truncate">{attachmentFile.name}</span>
                <button onClick={removeAttachment} className="flex-shrink-0 text-red-600 hover:text-red-800">
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                <Paperclip size={20} />
              </button>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-shrink-0 p-2 rounded-full transition ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Mic size={20} />
              </button>
              
              <input
                type="text"
                placeholder={isRecording ? 'Recording...' : "Type a message..."}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newMessage}
                onChange={e => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                disabled={isRecording}
              />
              <button 
                onClick={sendMessage} 
                className="flex-shrink-0 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={(!newMessage.trim() && !attachmentFile) || connectionStatus !== 'connected'}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingVideoChat;