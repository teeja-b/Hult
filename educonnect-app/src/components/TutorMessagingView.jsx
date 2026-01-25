import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Send, ArrowLeft, CheckCheck, Clock, Search, Paperclip, Mic, X, FileText, Image as ImageIcon, Check } from 'lucide-react';
import io from 'socket.io-client';
import { Video, PhoneOff } from 'lucide-react';
import DailyVideoCall from './JitsiVideoCall';
const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';

const TutorMessagingView = ({ 
  currentTutorUserId,  
  tutorProfileId,
  tutorName = 'Dr. Sarah Johnson',
  openConversationId = null,
  onConversationOpened = null,
  autoJoinMeetingId = null,
  autoJoinUrl = null,
  callerStudentId = null,
  onCallEnded = null
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

 const selectedTutorForJitsi = selectedConversation ? {

  user_id: selectedConversation.studentId || selectedConversation.partnerId,
  name: selectedConversation.studentName || selectedConversation.partnerName || 'Student'
} : null;
// Incoming call states

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const fileInputRef = useRef(null);

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

 // Replace the sendMessage function in TutorMessagingView.jsx (around line 150)

// Replace the sendMessage function in TutorMessagingView.jsx (around line 150)

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

  // Handle file upload FIRST if there's a file
  if (attachmentFile) {
    try {
      console.log('📤 Uploading file...', attachmentFile.name);
      
      const conversationKey = selectedConversation.id;
      
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
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('Failed to upload attachment. Please try again.');
      return;
    }
  }

  // Create message object
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
    // Send via Socket.IO which will save to database
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

      // Wait for delivery confirmation
      try {
        const dbMessageId = await messageDeliveryPromise;
        console.log(`✅ [TUTOR] Message saved to database with ID: ${dbMessageId}`);
        
        // Update message status to 'sent' with database ID
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, id: dbMessageId, status: 'sent' } : m
        ));
      } catch (err) {
        console.warn('⚠️ [TUTOR] Message delivery timeout, but message may have been sent');
        // Mark as sent anyway since socket is connected
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, status: 'sent' } : m
        ));
      }
    } else {
      console.error('❌ [TUTOR] Socket not connected!');
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));
      return;
    }

    // Save to storage as backup
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

    // Update conversations list
    setConversations(prevConvs =>
      prevConvs.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: msg.text, lastMessageTime: msg.timestamp }
          : conv
      ).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0))
    );

  } catch (err) {
    console.error('[TUTOR] Failed to send message:', err);
    setMessages(prev => prev.map(m => 
      m.id === tempId ? { ...m, status: 'failed' } : m
    ));
  }
};

const handleTyping = () => {
  if (!socketRef.current || !socketRef.current.connected || !selectedConversation) {
    console.log('⌨️ [TUTOR] Cannot emit typing - socket not ready');
    return;
  }
  
  const studentId = selectedConversation.studentId || selectedConversation.partnerId;
  
  console.log('⌨️ [TUTOR] ===== EMITTING TYPING =====');
  console.log('⌨️ [TUTOR] Conversation ID:', selectedConversation.id);
  console.log('⌨️ [TUTOR] Tutor ID:', currentTutorUserId);
  console.log('⌨️ [TUTOR] Student ID:', studentId);
  console.log('⌨️ [TUTOR] Socket connected:', socketRef.current.connected);
  
  socketRef.current.emit('typing', {
    conversationId: selectedConversation.id,
    userId: currentTutorUserId
  });

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  typingTimeoutRef.current = setTimeout(() => {
    console.log('⌨️ [TUTOR] Emitting stop_typing');
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stop_typing', {
        conversationId: selectedConversation.id,
        userId: currentTutorUserId
      });
    }
  }, 2000);
};

  const getMessageStatus = (msg) => {
    if (!msg.isOwn) return null;
    
    switch (msg.status) {
      case 'sending':
        return <Clock size={14} className="text-gray-400" />;
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-blue-400" />;
      case 'failed':
        return <span className="text-red-400 text-xs">Failed</span>;
      default:
        return <CheckCheck size={14} className="text-gray-400" />;
    }
  };
// Auto-open conversation from notification
useEffect(() => {
  if (openConversationId && conversations.length > 0 && !selectedConversation) {
    console.log('📨 [TUTOR] Auto-opening conversation:', openConversationId);
    
    // Find the conversation by ID
    const conversation = conversations.find(conv => conv.id === openConversationId);
    
    if (conversation) {
      console.log('✅ [TUTOR] Found conversation, opening:', conversation.studentName);
      openConversation(conversation);
      
      if (onConversationOpened) {
        onConversationOpened();
      }
    } else {
      // Try parsing the ID if it's in format conversation:studentId:tutorProfileId
      const parts = openConversationId.split(':');
      if (parts.length === 3) {
        const studentId = parts[1];
        const conv = conversations.find(c => 
          String(c.studentId || c.partnerId) === String(studentId)
        );
        
        if (conv) {
          console.log('✅ [TUTOR] Found conversation by student ID, opening:', conv.studentName);
          openConversation(conv);
          
          if (onConversationOpened) {
            onConversationOpened();
          }
        }
      }
    }
  }
}, [openConversationId, conversations, selectedConversation, onConversationOpened]);
// Auto-open conversation when auto-joining video call - PRODUCTION VERSION
useEffect(() => {
  if (autoJoinMeetingId && autoJoinUrl && conversations.length > 0 && !selectedConversation) {
    console.log('📞 [TUTOR] Auto-join detected');
    console.log('📞 [TUTOR] Looking for student with ID:', callerStudentId);
    
    let targetConversation = null;
    
    // Try to find the specific student who's calling
    if (callerStudentId) {
      targetConversation = conversations.find(conv => 
        String(conv.studentId || conv.partnerId) === String(callerStudentId)
      );
      
      if (targetConversation) {
        console.log('✅ [TUTOR] Found exact caller student:', targetConversation.studentName);
      } else {
        console.warn('⚠️ [TUTOR] Caller student not found in conversations');
      }
    }
    
    // Fallback: open the most recent conversation
    if (!targetConversation && conversations.length > 0) {
      targetConversation = conversations[0];
      console.log('⚠️ [TUTOR] Using fallback (most recent) conversation:', targetConversation.studentName);
    }
    
    if (targetConversation) {
      console.log('📞 [TUTOR] Auto-opening conversation with:', targetConversation.studentName);
      openConversation(targetConversation);
    } else {
      console.error('❌ [TUTOR] No conversations available');
      alert('Unable to start video call - no conversations available');
    }
  }
}, [autoJoinMeetingId, autoJoinUrl, conversations, selectedConversation, callerStudentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

useEffect(() => {
  console.log('🔌 [TUTOR] Connecting to Socket.IO server...');
  console.log('🔌 [TUTOR] Current tutor user ID:', currentTutorUserId);
  
  socketRef.current = io(API_URL, {
    auth: { userId: currentTutorUserId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });

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
    console.log('📩 [TUTOR] ===== RECEIVED MESSAGE =====');
    console.log('📩 [TUTOR] Full data:', JSON.stringify(data, null, 2));
    console.log('📩 [TUTOR] Sender ID:', data.sender_id);
    console.log('📩 [TUTOR] Receiver ID:', data.receiver_id);
    console.log('📩 [TUTOR] Current tutor ID:', currentTutorUserId);
    console.log('📩 [TUTOR] Conversation ID:', data.conversationId);
    
    // ✅ CRITICAL FIX: Use callback form to access latest state
    setMessages(prev => {
      console.log('📩 [TUTOR] Current messages count:', prev.length);
      
      // Check for duplicates
      const isDuplicate = prev.some(m => m.id === data.id);
      
      if (isDuplicate) {
        console.log('📩 [TUTOR] ⚠️ Duplicate message detected, skipping');
        return prev;
      }
      
      console.log('📩 [TUTOR] ✅ Adding new message to chat');
      
      const newMessage = {
        ...data,
        isOwn: String(data.sender_id) === String(currentTutorUserId)
      };
      
      console.log('📩 [TUTOR] New message:', newMessage);
      
      return [...prev, newMessage];
    });

    // Update conversations list
    setConversations(prev => prev.map(conv => {
      const convStudentId = conv.studentId || conv.partnerId;
      if (String(convStudentId) === String(data.sender_id) || conv.id === data.conversationId) {
        return {
          ...conv,
          lastMessage: data.text,
          lastMessageTime: data.timestamp,
          unreadCount: 0 // Reset unread since message is being displayed
        };
      }
      return conv;
    }).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)));
  });

  socket.on('message_delivered', ({ messageId, dbMessageId, status }) => {
    console.log('✅ [TUTOR] Message delivered:', { messageId, dbMessageId, status });
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, id: dbMessageId || msg.id, status } : msg
    ));
  });

  socket.on('user_typing', ({ userId, conversationId }) => {
    console.log('⌨️ [TUTOR] ===== TYPING EVENT =====');
    console.log('⌨️ [TUTOR] Typing user ID:', userId);
    console.log('⌨️ [TUTOR] Conversation ID:', conversationId);
    console.log('⌨️ [TUTOR] Current tutor ID:', currentTutorUserId);
    
    // ✅ CRITICAL FIX: Don't check selectedConversation here - just show typing
    const isNotSelf = String(userId) !== String(currentTutorUserId);
    
    console.log('⌨️ [TUTOR] Is not self?', isNotSelf);
    
    if (isNotSelf) {
      console.log('⌨️ [TUTOR] ✅ Showing typing indicator');
      setIsTyping(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        console.log('⌨️ [TUTOR] Auto-hiding typing indicator');
        setIsTyping(false);
      }, 3000);
    }
  });

  socket.on('user_stop_typing', ({ userId }) => {
    console.log('⌨️ [TUTOR] Stop typing event:', userId);
    const isNotSelf = String(userId) !== String(currentTutorUserId);
    
    if (isNotSelf) {
      console.log('⌨️ [TUTOR] ✅ Hiding typing indicator');
      setIsTyping(false);
    }
  });

  socket.on('users_online', (userIds) => {
    console.log('👥 [TUTOR] Online users:', userIds);
    setOnlineUsers(new Set(userIds));
  });

  socket.on('user_status', ({ userId, status }) => {
    console.log('👤 [TUTOR] User status update:', userId, status);
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
    console.log('🔌 [TUTOR] Cleaning up socket connection');
    if (socket) {
      socket.disconnect();
    }
  };
}, [currentTutorUserId]); 

useEffect(() => {
  if (socketRef.current && socketRef.current.connected && selectedConversation) {
    const studentId = selectedConversation.studentId || selectedConversation.partnerId;
    
    console.log('🚪 [TUTOR] Joining conversation room:', {
      conversationId: selectedConversation.id,
      studentId: studentId,
      tutorId: currentTutorUserId
    });
    
    socketRef.current.emit('join_conversation', {
      conversationId: selectedConversation.id,
      userId: currentTutorUserId,
      partnerId: studentId
    });
  }
}, [selectedConversation, currentTutorUserId]);

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

    const studentId = conversation.studentId || conversation.partnerId;
    
    if (!studentId) {
      console.error('[TUTOR] ERROR: No student ID found in conversation object!');
      setLoading(false);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', {
        conversationId: conversation.id,
        userId: currentTutorUserId,
        partnerId: studentId
      });
      
      console.log(`[TUTOR] Joined conversation ${conversation.id} with student ${studentId}`);
    }

    setConversations(prev => prev.map(conv =>
      conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
    ));

    try {
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
          if (processedMessages.length > 0) {
            console.log('[TUTOR] Last message data:', processedMessages[processedMessages.length - 1]);
          }
          setMessages(processedMessages);
          setLoading(false);
          return;
        }
      }

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


  return (
    <div className="bg-gray-50 min-h-screen">
          {/* 🟡 DEBUG: Check if auto-join props are received */}
    {autoJoinMeetingId && (
      <div className="fixed top-0 left-0 right-0 bg-purple-500 text-white p-3 text-center text-sm z-50">
        📞 [TUTOR] Props received: {autoJoinMeetingId}
      </div>
    )}
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

      {!showingChat && (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Messages</h1>
          
          {/* Search Bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Students will appear here when they message you
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="flex items-center gap-3 p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center relative">
                    <User size={24} className="text-blue-600" />
                    {onlineUsers.has(conv.studentId || conv.partnerId) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {conv.studentName || conv.partnerName || 'Student'}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showingChat && (
        <>
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
              <div className="flex-1">
                <h2 className="font-semibold">{selectedConversation?.studentName || selectedConversation?.partnerName || 'Student'}</h2>
                <p className="text-xs text-blue-100">
                  {onlineUsers.has(selectedConversation?.studentId || selectedConversation?.partnerId) ? '● Online' : 'Offline'}
                </p>
              </div>


<DailyVideoCall
  currentUserId={currentTutorUserId}
  selectedTutor={selectedTutorForJitsi}
  currentUserName={tutorName}
  autoJoinMeetingId={autoJoinMeetingId}
  autoJoinUrl={autoJoinUrl}
  onCallEnded={onCallEnded}
/>
 
            </div>
          </div>

          <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
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

            <div className="bg-white border-t border-gray-200 p-3">
              {attachmentFile && (
                <div className="mb-2 flex items-center gap-2 bg-gray-100 p-2 rounded">
                  {attachmentFile.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                  <span className="text-sm flex-1 truncate">{attachmentFile.name}</span>
                  <button onClick={removeAttachment} className="flex-shrink-0 text-red-600 hover:text-red-800">
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 max-w-4xl mx-auto items-center">
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
                  className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-6 py-2 rounded-full hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 min-w-[44px]"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default TutorMessagingView;