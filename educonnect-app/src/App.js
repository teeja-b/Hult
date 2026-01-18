// educonnect-app/src/App.js
import React, { useState, useEffect } from 'react';
import StudentSurvey from './components/StudentSurvey';
import TutorOnboarding from './components/TutorOnboarding';
import StudentProfile from './components/StudentProfile';
import TutorProfile from './components/TutorProfile';
import AssignmentsScreen from './components/AssignmentsScreen'; // NEW IMPORT
import { 
  BookOpen, Users, Award, Heart, Download, Menu, X, Search, 
  Upload, MessageSquare, BarChart3, Globe, DollarSign, GraduationCap, 
  Video, FileText, CheckCircle, MapPin, Shield, AlertCircle, Lock, LogOut 
} from 'lucide-react';
import TutorCourseManager from './components/TutorCourseManager';
import MessagingVideoChat from './components/MessagingVideoChat';
import TutorMessagingView from './components/TutorMessagingView';
import { 
  EnhancedRegisterModal, 
  EnhancedLoginModal, 
  ForgotPasswordModal,
  EmailVerificationBanner 
} from './components/AuthModals';
import PasswordResetPage from './components/PasswordResetPage';
import ProfileCompletionPrompt from './components/ProfileCompletionPrompt';
import { TutorFeedbackModal, TutorMatchCard } from './components/TutorFeedbackModal';
import FCMDebugPanel from './components/FCMDebugPanel';
import FCMInitializer from './components/FCMInitializer';

const EduConnectApp = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com';
  
  // ================ STATE DECLARATIONS ================
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [tutorStats, setTutorStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalMessages: 0,
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [showTutorProfile, setShowTutorProfile] = useState(false);
  const [showTutorOnboarding, setShowTutorOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [userType, setUserType] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseForAssignments, setSelectedCourseForAssignments] = useState(null); // NEW
  const [userRegion, setUserRegion] = useState(null);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [incomeLevel, setIncomeLevel] = useState(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [offlineCourses, setOfflineCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMatching, setAiMatching] = useState(false);
  const [matchedTutors, setMatchedTutors] = useState([]);
  const [showVerification, setShowVerification] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [showProfileCompletionPrompt, setShowProfileCompletionPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTutor, setFeedbackTutor] = useState(null);
  const [downloading, setDownloading] = useState(null);
  
  const [bookingData, setBookingData] = useState({
    subject: '',
    date: '',
    time: '',
    duration: '60',
    notes: ''
  });
  const [messageText, setMessageText] = useState('');

  // ================ HANDLER FUNCTIONS ================
  
  // AI Matching Handler
  const handleAIMatching = async () => {
    if (!isAuthenticated) {
      alert('Please log in first to use AI matching!');
      setShowLogin(true);
      return;
    }

    const surveyString = localStorage.getItem('studentSurvey');
    
    if (!surveyString) {
      alert('Please complete your survey first to enable AI matching!');
      setShowSurvey(true);
      return;
    }

    let survey;
    try {
      survey = JSON.parse(surveyString);
    } catch (error) {
      console.error('Failed to parse survey data:', error);
      alert('Survey data is corrupted. Please complete the survey again.');
      setShowSurvey(true);
      return;
    }

    console.log('📊 Survey data for AI matching:', survey);

    if (!survey.learningStyle || !survey.preferredSubjects || !survey.skillLevel || 
        !survey.availableTime || !survey.preferredLanguages || !survey.learningGoals) {
      console.warn('Missing survey fields');
      alert('Please complete all survey fields.');
      setShowSurvey(true);
      return;
    }

    setAiMatching(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const studentProfile = {
        learning_style: survey.learningStyle,
        preferred_subjects: survey.preferredSubjects,
        skill_level: survey.skillLevel,
        learning_goals: survey.learningGoals,
        available_time: survey.availableTime,
        preferred_languages: survey.preferredLanguages,
        math_score: survey.mathScore || 5,
        science_score: survey.scienceScore || 5,
        language_score: survey.languageScore || 5,
        tech_score: survey.techScore || 5,
        motivation_level: survey.motivationLevel || 7
      };

      console.log('🎯 Sending student profile to ML API:', studentProfile);

      const response = await fetch(`${API_URL}/api/match/tutors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_profile: studentProfile,
          use_rl: true
        })
      });

      console.log('📡 ML API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ ML API Response data:', data);
      
      if (data.success && data.matches && data.matches.length > 0) {
        console.log(`🎉 Found ${data.matches.length} matches!`);
        setMatchedTutors(data.matches);
        setCurrentView('matched-tutors');
      } else {
        console.warn('⚠️ No matches found');
        alert('No tutors found matching your criteria. Try updating your preferences or browse all tutors.');
        setCurrentView('tutors');
      }
      
    } catch (error) {
      console.error('❌ ML API Error:', error);
      
      if (error.message.includes('401')) {
        alert('Authentication failed. Please log in again.');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        setShowLogin(true);
      } else if (error.message.includes('422')) {
        alert('Invalid survey data. Please complete the survey again.');
        setShowSurvey(true);
      } else if (error.message.includes('fetch')) {
        alert('Cannot connect to matching server. Please check your connection and try again.');
      } else {
        alert(`Matching failed: ${error.message}`);
      }
    } finally {
      setAiMatching(false);
    }
  };

  // NEW: Course Selection Handler for Assignments
  const handleOpenAssignments = (course) => {
    console.log('📚 Opening assignments for course:', course?.title);
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('Please log in to view assignments');
      setShowLogin(true);
      return;
    }
    
    // Check if course is provided
    if (!course || !course.id) {
      console.error('No course provided for assignments');
      alert('Course information is missing');
      return;
    }
    
    // Store the selected course
    setSelectedCourseForAssignments(course);
    
    // Navigate to assignments screen
    setCurrentView('assignments');
    
    // Optional: Store in localStorage for persistence
    localStorage.setItem('selectedCourseForAssignments', JSON.stringify(course));
  };

  // Download Course Handler
  const downloadCourse = async (course) => {
    if (!isAuthenticated) {
      alert('Please log in to download courses!');
      setShowLogin(true);
      return;
    }

    if (offlineCourses.find(c => c.id === course.id)) {
      alert('Course already downloaded!');
      return;
    }

    setDownloading(course.id);

    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Record the download
      const response = await fetch(`${API_URL}/api/courses/${course.id}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const data = await response.json();
      
      // Step 2: Fetch all course materials
      const materialsResponse = await fetch(`${API_URL}/api/courses/${course.id}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const materialsData = await materialsResponse.json();
      
      // Step 3: Download each material file
      for (const material of materialsData.materials || []) {
        try {
          const fileResponse = await fetch(`${API_URL}/api/materials/${material.id}/stream`);
          const blob = await fileResponse.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${material.title}.${material.type}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (err) {
          console.error(`Failed to download ${material.title}:`, err);
        }
      }
      
      // Step 4: Store offline access info
      const offlineCourse = {
        ...course,
        downloadedAt: new Date().toISOString(),
        expiresAt: data.expires_at,
        materials: materialsData.materials || []
      };
      
      const updated = [...offlineCourses, offlineCourse];
      setOfflineCourses(updated);
      localStorage.setItem('offlineCourses', JSON.stringify(updated));

      alert(`✓ ${course.title} downloaded! ${materialsData.materials?.length || 0} files saved.`);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download course: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  // Fetch Tutor Stats
  const fetchTutorStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/tutor/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      
      setTutorStats({
        totalCourses: data.totalCourses || 0,
        totalStudents: data.totalStudents || 0,
        totalMessages: data.totalMessages || 0
      });
      
      console.log('✅ Tutor stats loaded:', data);
      
    } catch (error) {
      console.error('Error fetching tutor stats:', error);
      setTutorStats({
        totalCourses: 0,
        totalStudents: 0,
        totalMessages: 0
      });
    }
  };

  // ================ USE EFFECTS ================

  // Initial mount effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    const profileComplete = localStorage.getItem('profileComplete');
    
    console.log('🔍 App Mount - Checking stored data:');
    console.log('- token:', token ? 'exists' : 'missing');
    console.log('- userType:', storedUserType);
    console.log('- profileComplete:', profileComplete);
    
    if (token && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
      
      if (storedUserType === 'tutor') {
        const isComplete = profileComplete === 'true';
        console.log('📝 Tutor detected on mount, profileComplete =', isComplete);
      }
    }
  }, []);

  // Fetch home stats
  useEffect(() => {
    const fetchHomeStats = async () => {
      try {
        const coursesRes = await fetch(`${API_URL}/api/courses`);
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
        
        const tutorsRes = await fetch(`${API_URL}/api/tutors`);
        const tutorsData = await tutorsRes.json();
        setTutors(tutorsData.tutors || []);
      } catch (error) {
        console.error('Failed to fetch home stats:', error);
        setCourses([]);
        setTutors([]);
      }
    };
    
    fetchHomeStats();
  }, []);

  // Fetch tutor stats when authenticated
  useEffect(() => {
    if (isAuthenticated && userType === 'tutor') {
      fetchTutorStats();
    }
  }, [isAuthenticated, userType]);

  // Load offline courses
  useEffect(() => {
    const saved = localStorage.getItem('offlineCourses');
    if (saved) {
      try {
        setOfflineCourses(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading offline courses:', e);
      }
    }
  }, []);

  // Profile completion prompt
  useEffect(() => {
    if (isAuthenticated && userType === 'tutor') {
      const profileComplete = localStorage.getItem('profileComplete');
      const promptDismissed = sessionStorage.getItem('profilePromptDismissed');
      
      if (profileComplete !== 'true' && !promptDismissed) {
        setTimeout(() => {
          setShowProfileCompletionPrompt(true);
        }, 1000);
      }
    }
  }, [isAuthenticated, userType]);

  // ================ NAVBAR COMPONENT ================
  
  const NavBar = ({ 
    userType,
    isAuthenticated,
    menuOpen,
    setMenuOpen,
    setUserType, 
    setIsAuthenticated, 
    setCurrentView, 
    setShowLogin, 
    setShowRegister, 
    setShowStudentProfile, 
    setShowTutorProfile, 
    setShowCourseManager 
  }) => {
    const handleLogout = () => {
      if (window.confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        setIsAuthenticated(false);
        setUserType(null);
        setCurrentView('home');
        alert('You have been logged out successfully!');
      }
    };

    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="flex justify-between items-center p-4">
          {/* Logo Section */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <GraduationCap size={28} />
            <h1 className="text-xl font-bold">EduConnect</h1>
          </div>

          {/* Right Side - Auth Buttons & Menu */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <button 
                  onClick={() => setShowLogin(true)} 
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition"
                >
                  Login
                </button>
                <button 
                  onClick={() => setShowRegister(true)} 
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition shadow-sm"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium capitalize">{userType || 'User'}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 bg-red-500/90 hover:bg-red-600 px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                >
                  <LogOut size={16} />
                  Logout
                </button>
                {userType === 'tutor' && localStorage.getItem('profileComplete') === 'false' && (
                  <div className="hidden sm:flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-lg border border-yellow-300">
                    <AlertCircle size={16} className="text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-800">Profile Incomplete</span>
                  </div>
                )}
              </>
            )}
            
            {/* Hamburger Menu */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="border-t border-white/20 bg-white/10 backdrop-blur-md">
            <div className="p-2 space-y-1">
              
              {/* HOME - Always visible */}
              <button 
                onClick={() => { setCurrentView('home'); setMenuOpen(false); }} 
                className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
              >
                <BookOpen size={20} />
                <span className="font-medium">Home</span>
              </button>

              {/* STUDENT MENU ITEMS */}
              {isAuthenticated && userType === 'student' && (
                <>
                  <button 
                    onClick={() => { setCurrentView('courses'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <FileText size={20} />
                    <span className="font-medium">Courses</span>
                  </button>
                  
                  <button 
                    onClick={() => { setCurrentView('my-courses'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3 bg-white/10"
                  >
                    <BookOpen size={20} />
                    <span className="font-medium">📚 My Courses</span>
                  </button>
                  
                  {/* NEW: Assignments Menu Item */}
                  <button 
                    onClick={() => { 
                      setSelectedCourseForAssignments(null); // Show all assignments
                      setCurrentView('assignments'); 
                      setMenuOpen(false); 
                    }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <FileText size={20} />
                    <span className="font-medium">📝 My Assignments</span>
                  </button>
                  
                  <button 
                    onClick={() => { setCurrentView('tutors'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <Users size={20} />
                    <span className="font-medium">Find Tutors</span>
                  </button>
                  
                  <button 
                    onClick={() => { setCurrentView('offline'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <Download size={20} />
                    <span className="font-medium">Offline Library</span>
                  </button>
                </>
              )}

              {/* TUTOR MENU ITEMS */}
              {isAuthenticated && userType === 'tutor' && (
                <>
                  <button 
                    onClick={() => { 
                      console.log('🎯 Manage Courses Clicked!');
                      setShowCourseManager(true); 
                      setMenuOpen(false); 
                    }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3 bg-white/10 border-2 border-yellow-400"
                  >
                    <BookOpen size={20} />
                    <span className="font-medium">📚 Manage Courses</span>
                  </button>
                  
                  {/* NEW: Tutor Assignments Menu Item */}
                  <button 
                    onClick={() => { 
                      setSelectedCourseForAssignments(null); // Show all assignments
                      setCurrentView('assignments'); 
                      setMenuOpen(false); 
                    }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <FileText size={20} />
                    <span className="font-medium">📝 Grade Assignments</span>
                  </button>
                </>
              )}

              {/* COMMON AUTHENTICATED USER ITEMS */}
              {isAuthenticated && (
                <>
                  <button 
                    onClick={() => { setCurrentView('donate'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <Heart size={20} />
                    <span className="font-medium">Support Us</span>
                  </button>

                  <button 
                    onClick={() => { setCurrentView('certificates'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <Award size={20} />
                    <span className="font-medium">Certificates</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-white/20 my-2"></div>

                  {/* User Profile */}
                  <button 
                    onClick={() => { 
                      if (userType === 'student') {
                        setShowStudentProfile(true);
                      } else if (userType === 'tutor') {
                        setShowTutorProfile(true);
                      }
                      setMenuOpen(false); 
                    }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <Users size={20} />
                    <span className="font-medium">My Profile</span>
                  </button>

                  <button 
                    onClick={() => {
                      setShowPasswordReset(true);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
                  >
                    <Lock size={20} />
                    <span className="font-medium">Change Password</span>
                  </button>

                  {/* Logout for mobile */}
                  <div className="border-t border-white/20 my-2 sm:hidden"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-500/20 rounded-lg transition flex items-center gap-3 text-red-200 sm:hidden"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ================ VIEW COMPONENTS ================
  
  // Home View Component
  const HomeView = () => {
    // Student Landing Page
    const StudentLandingPage = () => (
      <div className="pb-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white p-6 rounded-xl mb-4 shadow-lg">
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Learn Without Limits</h1>
            <p className="text-blue-100 text-sm mb-4">
              AI-powered education tailored to your needs, accessible from anywhere
            </p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 text-center">Why Students Love EduConnect</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MessageSquare className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">AI-Powered Matching</h3>
                  <p className="text-sm text-gray-600">Get matched with tutors who perfectly fit your learning style and goals</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Download className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Learn Offline</h3>
                  <p className="text-sm text-gray-600">Download courses and access them anytime, even without internet</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-orange-500">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Award className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Earn Certificates</h3>
                  <p className="text-sm text-gray-600">Complete courses and receive verified certificates for your achievements</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-pink-500">
              <div className="flex items-start gap-3">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Globe className="text-pink-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Global Access</h3>
                  <p className="text-sm text-gray-600">Fair pricing based on your location - quality education for everyone</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowRegister(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition font-bold text-lg flex items-center justify-center gap-2"
          >
            <GraduationCap size={24} />
            Start Learning Now
          </button>
          <button 
            onClick={() => setShowLogin(true)}
            className="w-full bg-white text-gray-700 border-2 border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition font-semibold"
          >
            Already have an account? Log In
          </button>
          <button 
            onClick={() => setUserType(null)}
            className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );

    // Tutor Landing Page
    const TutorLandingPage = () => (
      <div className="pb-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 text-white p-6 rounded-xl mb-4 shadow-lg">
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Teach & Inspire</h1>
            <p className="text-green-100 text-sm mb-4">
              Share your knowledge with students worldwide and earn while you educate
            </p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 text-center">Why Tutors Choose EduConnect</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <BarChart3 className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">AI Student Matching</h3>
                  <p className="text-sm text-gray-600">Get matched with students who need your expertise most</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Easy Course Creation</h3>
                  <p className="text-sm text-gray-600">Upload videos, documents, and create comprehensive courses effortlessly</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <MessageSquare className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Built-in Messaging</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-orange-500">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <DollarSign className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Flexible Earnings</h3>
                  <p className="text-sm text-gray-600">Set your own rates and work on your schedule</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-pink-500">
              <div className="flex items-start gap-3">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Globe className="text-pink-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Make an Impact</h3>
                  <p className="text-sm text-gray-600">Help students in developing countries access quality education</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowRegister(true)}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition font-bold text-lg flex items-center justify-center gap-2"
          >
            <Users size={24} />
            Become a Tutor
          </button>
          <button 
            onClick={() => setShowLogin(true)}
            className="w-full bg-white text-gray-700 border-2 border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition font-semibold"
          >
            Already a tutor? Log In
          </button>
          <button 
            onClick={() => setUserType(null)}
            className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );

    // Logged-in Dashboard
    const LoggedInDashboard = () => (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Welcome back, {userType === 'student' ? 'Learner' : 'Educator'}!
          </h3>
        </div>

        <div className="mt-4">
          <details className="bg-white rounded-lg shadow-md">
            <summary className="p-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50">
              🔧 Notification Debug Tools (Click to expand)
            </summary>
            <div className="p-4 border-t">
              <FCMDebugPanel />
            </div>
          </details>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {userType === 'student' ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <BookOpen className="text-blue-500 mb-2" />
                <h4 className="font-semibold text-sm">Courses</h4>
                <p className="text-2xl font-bold text-gray-800">{courses.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <Users className="text-green-500 mb-2" />
                <h4 className="font-semibold text-sm">Tutors</h4>
                <p className="text-2xl font-bold text-gray-800">{tutors.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                <Download className="text-purple-500 mb-2" />
                <h4 className="font-semibold text-sm">Offline</h4>
                <p className="text-2xl font-bold text-gray-800">{offlineCourses.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                <FileText className="text-orange-500 mb-2" />
                <h4 className="font-semibold text-sm">Assignments</h4>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <BookOpen className="text-blue-500 mb-2" />
                <h4 className="font-semibold text-sm">My Courses</h4>
                <p className="text-2xl font-bold text-gray-800">{tutorStats.totalCourses}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <Users className="text-green-500 mb-2" />
                <h4 className="font-semibold text-sm">Students</h4>
                <p className="text-2xl font-bold text-gray-800">{tutorStats.totalStudents}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                <MessageSquare className="text-purple-500 mb-2" />
                <h4 className="font-semibold text-sm">Messages</h4>
                <p className="text-2xl font-bold text-gray-800">{tutorStats.totalMessages}</p>
              </div>
            </>
          )}
        </div>

        {userType === 'student' && (
          <div className="space-y-3">
            {/* Survey Button */}
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                📝 Learning Profile Survey
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Complete this survey to unlock AI-powered tutor matching!
              </p>
              <button 
                onClick={() => setShowSurvey(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded hover:shadow-lg transition"
              >
                Complete Survey
              </button>
            </div>

            {/* AI Matching */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare size={20} />
                AI Learning Assistant
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Get personalized course recommendations based on your learning style and goals.
              </p>
              <button 
                onClick={handleAIMatching}
                disabled={aiMatching}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {aiMatching ? 'Analyzing Your Profile...' : 'Find My Perfect Match'}
              </button>
            </div>
          </div>
        )}
      </div>
    );

    // Initial Welcome Screen (no userType selected)
    const WelcomeScreen = () => (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white p-6 rounded-xl text-center">
          <GraduationCap size={48} className="mx-auto mb-3" />
          <h2 className="text-3xl font-bold mb-2">Welcome to EduConnect</h2>
          <p className="text-blue-100">AI-powered personalized learning for everyone, everywhere.</p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => setUserType('student')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
          >
            <BookOpen size={28} />
            <div className="text-left">
              <div className="font-bold text-lg">I'm a Student</div>
              <div className="text-sm text-blue-100">Discover courses & tutors</div>
            </div>
          </button>
          <button 
            onClick={() => setUserType('tutor')}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
          >
            <Users size={28} />
            <div className="text-left">
              <div className="font-bold text-lg">I'm a Tutor</div>
              <div className="text-sm text-green-100">Share your expertise</div>
            </div>
          </button>
        </div>
      </div>
    );

    return (
      <div className="p-4">
        {showRegister && (
          <EnhancedRegisterModal 
            onClose={() => setShowRegister(false)}
            onSuccess={(data) => {
              setIsAuthenticated(true);
              setUserType(data.user.user_type);
              setShowRegister(false);
            }}
          />
        )}

        {showLogin && (
          <EnhancedLoginModal 
            onClose={() => setShowLogin(false)}
            onSuccess={(data) => {
              setIsAuthenticated(true);
              setUserType(data.user.user_type);
              setShowLogin(false);
            }}
          />
        )}

        {showSurvey && (
          <StudentSurvey
            onClose={() => setShowSurvey(false)}
            onComplete={() => {
              console.log('📋 Survey completed successfully');
              setShowSurvey(false);
              alert('✅ Survey completed! You can now use AI matching to find your perfect tutor.');
            }}
          />
        )}

        {isAuthenticated ? (
          <LoggedInDashboard />
        ) : (
          <>
            {!userType ? (
              <WelcomeScreen />
            ) : userType === 'student' ? (
              <StudentLandingPage />
            ) : (
              <TutorLandingPage />
            )}
          </>
        )}
      </div>
    );
  };

  // Courses View Component
  const CoursesView = () => {
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchAllCourses();
    }, []);

    const fetchAllCourses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses`);
        const data = await response.json();
        setAllCourses(data.courses || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setAllCourses(courses);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="p-4 text-center">
          <p>Loading courses...</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-3">
          {allCourses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(course => (
            <div key={course.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{course.title}</h3>
                  <p className="text-sm text-gray-600">by {course.tutor || course.tutor_name || 'Unknown'}</p>
                </div>
                {course.offline_available && (
                  <button 
                    onClick={() => downloadCourse(course)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <Download size={20} />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 text-xs text-gray-600 mb-2">
                <span className="bg-blue-100 px-2 py-1 rounded">{course.level}</span>
                <span className="bg-green-100 px-2 py-1 rounded">{course.duration || 'Self-paced'}</span>
                <span className="bg-yellow-100 px-2 py-1 rounded">⭐ {course.rating || 'New'}</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {course.description || `${course.total_students || 0} students enrolled`}
              </p>
              
              <div className="space-y-2">
                <button 
                  onClick={() => { setSelectedCourse(course); setCurrentView('course-detail'); }}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  View Course
                </button>
                
                {/* NEW: Assignments Button */}
                {isAuthenticated && (
                  <button 
                    onClick={() => handleOpenAssignments(course)}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    View Assignments
                  </button>
                )}
              </div>
            </div>
          ))}

          {allCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No courses available yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Course Detail View Component
  const CourseDetailView = () => (
    <div className="p-4">
      <button 
        onClick={() => setCurrentView('courses')}
        className="text-blue-600 mb-4"
      >
        ← Back to Courses
      </button>
      
      {selectedCourse && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
            <p className="text-blue-100">by {selectedCourse.tutor}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold mb-3">Course Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Level:</span>
                <span className="font-semibold">{selectedCourse.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{selectedCourse.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating:</span>
                <span className="font-semibold">⭐ {selectedCourse.rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Students:</span>
                <span className="font-semibold">{selectedCourse.students}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold mb-3">What You'll Learn</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Master fundamental concepts and principles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Apply knowledge through practical exercises</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Receive personalized AI-powered feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Earn a verified certificate upon completion</span>
              </li>
            </ul>
          </div>

          {selectedCourse.offline && (
            <button 
              onClick={() => downloadCourse(selectedCourse)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download for Offline Access
            </button>
          )}

          {/* NEW: Assignments Button in Course Detail */}
          {isAuthenticated && (
            <button 
              onClick={() => handleOpenAssignments(selectedCourse)}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              View Course Assignments
            </button>
          )}

          <button 
            onClick={async () => {
              if (!isAuthenticated) {
                alert('Please log in to enroll!');
                setShowLogin(true);
                return;
              }
              
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/courses/${selectedCourse.id}/enroll`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  alert('✅ Enrolled successfully! Check "My Courses" to start learning.');
                  setCurrentView('my-courses');
                } else {
                  alert(data.error || 'Enrollment failed');
                }
              } catch (error) {
                console.error('Enrollment error:', error);
                alert('Failed to enroll. Please try again.');
              }
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition"
          >
            Enroll Now
          </button>
        </div>
      )}
    </div>
  );

  // ================ MAIN RENDER ================
  
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <NavBar 
        userType={userType}
        isAuthenticated={isAuthenticated}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        setUserType={setUserType}
        setIsAuthenticated={setIsAuthenticated}
        setCurrentView={setCurrentView}
        setShowLogin={setShowLogin}
        setShowRegister={setShowRegister}
        setShowStudentProfile={setShowStudentProfile}
        setShowTutorProfile={setShowTutorProfile}
        setShowCourseManager={setShowCourseManager}
      />

      {/* Main Content Views */}
      {!isAuthenticated ? (
        <HomeView />
      ) : (
        <>
          {currentView === 'home' && <HomeView />}
          {currentView === 'courses' && <CoursesView />}
          {currentView === 'course-detail' && <CourseDetailView />}
          {currentView === 'assignments' && (
            <AssignmentsScreen 
              course={selectedCourseForAssignments}
              userType={userType}
              isAuthenticated={isAuthenticated}
              API_URL={API_URL}
              onBack={() => setCurrentView('courses')}
            />
          )}
          {/* Add other views here as needed */}
        </>
      )}

      <FCMInitializer 
        onNotification={(payload) => {
          console.log('📨 Received notification in App:', payload);
        }}
      />

      {/* Chat view */}
      {isAuthenticated && currentView === 'chat' && (
        (() => {
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          const userId = user?.id || Number(localStorage.getItem('userId'));
          const userName = user?.full_name || localStorage.getItem('userName') || 'User';
          const userType = user?.user_type || localStorage.getItem('userType');
          const tutorProfileId = user?.tutor_profile_id || Number(localStorage.getItem('tutorProfileId')) || null;
          
          console.log('🔍 Chat View Debug:', { userId, userType, tutorProfileId });
          
          if (userType === 'student') {
            return <MessagingVideoChat currentUserId={userId} />;
          } else if (userType === 'tutor') {
            return (
              <TutorMessagingView 
                currentTutorUserId={userId}
                tutorProfileId={tutorProfileId}
                tutorName={userName}
              />
            );
          }
          return null;
        })()
      )}

      {/* Modals */}
      {showTutorOnboarding && (
        <TutorOnboarding
          onComplete={(profileData) => {
            localStorage.setItem('profileComplete', 'true');
            
            if (profileData?.tutor_profile_id) {
              localStorage.setItem('tutorProfileId', profileData.tutor_profile_id);
            }
            
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              user.profile_complete = true;
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            setShowTutorOnboarding(false);
            alert('✅ Profile setup complete! You can now be matched with students.');
          }}
          onSkip={() => {
            setShowTutorOnboarding(false);
            alert('⚠️ Warning: You need to complete your profile to receive messages from students.');
          }}
        />
      )}

      {showProfileCompletionPrompt && (
        <ProfileCompletionPrompt
          onComplete={() => {
            setShowTutorProfile(true);
            setShowProfileCompletionPrompt(false);
          }}
          onDismiss={() => {
            sessionStorage.setItem('profilePromptDismissed', 'true');
            setShowProfileCompletionPrompt(false);
          }}
        />
      )}

      {showPasswordReset && (
        <PasswordResetPage onClose={() => setShowPasswordReset(false)} />
      )}

      {showStudentProfile && (
        <StudentProfile onClose={() => setShowStudentProfile(false)} />
      )}

      {showTutorProfile && (
        <TutorProfile onClose={() => setShowTutorProfile(false)} />
      )}

      {showCourseManager && (
        <TutorCourseManager onClose={() => setShowCourseManager(false)} />
      )}

      <div className="h-16"></div>

      {/* Bottom navigation */}
      {isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg max-w-md mx-auto">
          <div className="flex justify-around p-2">
            <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center p-2 ${currentView === 'home' ? 'text-blue-600' : 'text-gray-600'}`}>
              <BookOpen size={24} />
              <span className="text-xs mt-1">Home</span>
            </button>
            
            {userType === 'student' && (
              <>
                <button onClick={() => setCurrentView('courses')} className={`flex flex-col items-center p-2 ${currentView === 'courses' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <FileText size={24} />
                  <span className="text-xs mt-1">Courses</span>
                </button>
                <button onClick={() => setCurrentView('assignments')} className={`flex flex-col items-center p-2 ${currentView === 'assignments' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <FileText size={24} />
                  <span className="text-xs mt-1">Assignments</span>
                </button>
                <button onClick={() => setCurrentView('offline')} className={`flex flex-col items-center p-2 ${currentView === 'offline' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <Download size={24} />
                  <span className="text-xs mt-1">Offline</span>
                </button>
                <button onClick={() => setCurrentView('my-courses')} className={`flex flex-col items-center p-2 ${currentView === 'my-courses' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <GraduationCap size={24} />
                  <span className="text-xs mt-1">My Courses</span>
                </button>
              </>
            )}
            
            {userType === 'tutor' && (
              <>
                <button onClick={() => setShowCourseManager(true)} className={`flex flex-col items-center p-2 ${showCourseManager ? 'text-blue-600' : 'text-gray-600'}`}>
                  <FileText size={24} />
                  <span className="text-xs mt-1">Manage</span>
                </button>
                <button onClick={() => setCurrentView('assignments')} className={`flex flex-col items-center p-2 ${currentView === 'assignments' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <FileText size={24} />
                  <span className="text-xs mt-1">Assignments</span>
                </button>
                <button onClick={() => setCurrentView('chat')} className={`flex flex-col items-center p-2 ${currentView === 'chat' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <MessageSquare size={24} />
                  <span className="text-xs mt-1">Messages</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EduConnectApp;