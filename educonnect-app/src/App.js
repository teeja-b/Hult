import StudentSurvey from './components/StudentSurvey';
import TutorOnboarding from './components/TutorOnboarding';
import StudentProfile from './components/StudentProfile';
import TutorProfile from './components/TutorProfile';
import { register, login, getMatchedTutors } from './services/api';
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Award, Heart, Download, Menu, X, Search, Upload, MessageSquare, BarChart3, Globe, DollarSign, GraduationCap, Video, FileText, CheckCircle, MapPin, Shield, AlertCircle,Lock } from 'lucide-react';
import { LogOut } from 'lucide-react';
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
const EduConnectApp = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'https://hult.onrender.com' ;
  const [showCourseManager, setShowCourseManager] = useState(false);
const [tutorStats, setTutorStats] = useState({
  totalCourses: 0,
  totalStudents: 0,
  totalMessages: 0,

});


  // Add this with your other state declarations (around line 40)
const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [showTutorProfile, setShowTutorProfile] = useState(false);
  const [showTutorOnboarding, setShowTutorOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [userType, setUserType] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
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
 const [selectedTutor, setSelectedTutor] = useState(null);
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
const [feedbackTutor, setFeedbackTutor] = useState(null);
  const [bookingData, setBookingData] = useState({
    subject: '',
    date: '',
    time: '',
    duration: '60',
    notes: ''
  });
  const [messageText, setMessageText] = useState('');

  // Added state
const [downloading, setDownloading] = useState(null);
  
  // World Bank Country Income Classifications (2024)
  const countryClassifications = {
    // Low-income economies
    'AF': { name: 'Afghanistan', income: 'low-income' },
    'BF': { name: 'Burkina Faso', income: 'low-income' },
    'BI': { name: 'Burundi', income: 'low-income' },
    'CF': { name: 'Central African Republic', income: 'low-income' },
    'TD': { name: 'Chad', income: 'low-income' },
    'CD': { name: 'Congo, Dem. Rep.', income: 'low-income' },
    'ER': { name: 'Eritrea', income: 'low-income' },
    'ET': { name: 'Ethiopia', income: 'low-income' },
    'GM': { name: 'Gambia', income: 'low-income' },
    'GW': { name: 'Guinea-Bissau', income: 'low-income' },
    'HT': { name: 'Haiti', income: 'low-income' },
    'LR': { name: 'Liberia', income: 'low-income' },
    'MG': { name: 'Madagascar', income: 'low-income' },
    'MW': { name: 'Malawi', income: 'low-income' },
    'ML': { name: 'Mali', income: 'low-income' },
    'MZ': { name: 'Mozambique', income: 'low-income' },
    'NE': { name: 'Niger', income: 'low-income' },
    'RW': { name: 'Rwanda', income: 'low-income' },
    'SL': { name: 'Sierra Leone', income: 'low-income' },
    'SO': { name: 'Somalia', income: 'low-income' },
    'SS': { name: 'South Sudan', income: 'low-income' },
    'SD': { name: 'Sudan', income: 'low-income' },
    'SY': { name: 'Syria', income: 'low-income' },
    'TJ': { name: 'Tajikistan', income: 'low-income' },
    'TG': { name: 'Togo', income: 'low-income' },
    'UG': { name: 'Uganda', income: 'low-income' },
    'YE': { name: 'Yemen', income: 'low-income' },
    
    // Lower-middle-income economies
    'DZ': { name: 'Algeria', income: 'lower-middle-income' },
    'AO': { name: 'Angola', income: 'lower-middle-income' },
    'BD': { name: 'Bangladesh', income: 'lower-middle-income' },
    'BJ': { name: 'Benin', income: 'lower-middle-income' },
    'BT': { name: 'Bhutan', income: 'lower-middle-income' },
    'BO': { name: 'Bolivia', income: 'lower-middle-income' },
    'KH': { name: 'Cambodia', income: 'lower-middle-income' },
    'CM': { name: 'Cameroon', income: 'lower-middle-income' },
    'CV': { name: 'Cabo Verde', income: 'lower-middle-income' },
    'CG': { name: 'Congo, Rep.', income: 'lower-middle-income' },
    'CI': { name: "Côte d'Ivoire", income: 'lower-middle-income' },
    'DJ': { name: 'Djibouti', income: 'lower-middle-income' },
    'EG': { name: 'Egypt', income: 'lower-middle-income' },
    'SV': { name: 'El Salvador', income: 'lower-middle-income' },
    'GH': { name: 'Ghana', income: 'lower-middle-income' },
    'HN': { name: 'Honduras', income: 'lower-middle-income' },
    'IN': { name: 'India', income: 'lower-middle-income' },
    'ID': { name: 'Indonesia', income: 'lower-middle-income' },
    'IR': { name: 'Iran', income: 'lower-middle-income' },
    'JO': { name: 'Jordan', income: 'lower-middle-income' },
    'KE': { name: 'Kenya', income: 'lower-middle-income' },
    'KG': { name: 'Kyrgyz Republic', income: 'lower-middle-income' },
    'LA': { name: 'Lao PDR', income: 'lower-middle-income' },
    'LB': { name: 'Lebanon', income: 'lower-middle-income' },
    'LS': { name: 'Lesotho', income: 'lower-middle-income' },
    'MR': { name: 'Mauritania', income: 'lower-middle-income' },
    'MN': { name: 'Mongolia', income: 'lower-middle-income' },
    'MA': { name: 'Morocco', income: 'lower-middle-income' },
    'MM': { name: 'Myanmar', income: 'lower-middle-income' },
    'NP': { name: 'Nepal', income: 'lower-middle-income' },
    'NI': { name: 'Nicaragua', income: 'lower-middle-income' },
    'NG': { name: 'Nigeria', income: 'lower-middle-income' },
    'PK': { name: 'Pakistan', income: 'lower-middle-income' },
    'PS': { name: 'Palestine', income: 'lower-middle-income' },
    'PG': { name: 'Papua New Guinea', income: 'lower-middle-income' },
    'PH': { name: 'Philippines', income: 'lower-middle-income' },
    'SN': { name: 'Senegal', income: 'lower-middle-income' },
    'LK': { name: 'Sri Lanka', income: 'lower-middle-income' },
    'TZ': { name: 'Tanzania', income: 'lower-middle-income' },
    'TL': { name: 'Timor-Leste', income: 'lower-middle-income' },
    'TN': { name: 'Tunisia', income: 'lower-middle-income' },
    'UZ': { name: 'Uzbekistan', income: 'lower-middle-income' },
    'VN': { name: 'Vietnam', income: 'lower-middle-income' },
    'ZM': { name: 'Zambia', income: 'lower-middle-income' },
    'ZW': { name: 'Zimbabwe', income: 'lower-middle-income' },
    
    // Upper-middle-income economies
    'AL': { name: 'Albania', income: 'upper-middle-income' },
    'AR': { name: 'Argentina', income: 'upper-middle-income' },
    'AM': { name: 'Armenia', income: 'upper-middle-income' },
    'AZ': { name: 'Azerbaijan', income: 'upper-middle-income' },
    'BY': { name: 'Belarus', income: 'upper-middle-income' },
    'BZ': { name: 'Belize', income: 'upper-middle-income' },
    'BA': { name: 'Bosnia and Herzegovina', income: 'upper-middle-income' },
    'BW': { name: 'Botswana', income: 'upper-middle-income' },
    'BR': { name: 'Brazil', income: 'upper-middle-income' },
    'BG': { name: 'Bulgaria', income: 'upper-middle-income' },
    'CN': { name: 'China', income: 'upper-middle-income' },
    'CO': { name: 'Colombia', income: 'upper-middle-income' },
    'CR': { name: 'Costa Rica', income: 'upper-middle-income' },
    'CU': { name: 'Cuba', income: 'upper-middle-income' },
    'DM': { name: 'Dominica', income: 'upper-middle-income' },
    'DO': { name: 'Dominican Republic', income: 'upper-middle-income' },
    'EC': { name: 'Ecuador', income: 'upper-middle-income' },
    'GQ': { name: 'Equatorial Guinea', income: 'upper-middle-income' },
    'FJ': { name: 'Fiji', income: 'upper-middle-income' },
    'GA': { name: 'Gabon', income: 'upper-middle-income' },
    'GE': { name: 'Georgia', income: 'upper-middle-income' },
    'GD': { name: 'Grenada', income: 'upper-middle-income' },
    'GT': { name: 'Guatemala', income: 'upper-middle-income' },
    'GY': { name: 'Guyana', income: 'upper-middle-income' },
    'IQ': { name: 'Iraq', income: 'upper-middle-income' },
    'JM': { name: 'Jamaica', income: 'upper-middle-income' },
    'KZ': { name: 'Kazakhstan', income: 'upper-middle-income' },
    'XK': { name: 'Kosovo', income: 'upper-middle-income' },
    'LY': { name: 'Libya', income: 'upper-middle-income' },
    'MK': { name: 'North Macedonia', income: 'upper-middle-income' },
    'MY': { name: 'Malaysia', income: 'upper-middle-income' },
    'MV': { name: 'Maldives', income: 'upper-middle-income' },
    'MU': { name: 'Mauritius', income: 'upper-middle-income' },
    'MX': { name: 'Mexico', income: 'upper-middle-income' },
    'MD': { name: 'Moldova', income: 'upper-middle-income' },
    'ME': { name: 'Montenegro', income: 'upper-middle-income' },
    'NA': { name: 'Namibia', income: 'upper-middle-income' },
    'MK': { name: 'North Macedonia', income: 'upper-middle-income' },
    'PY': { name: 'Paraguay', income: 'upper-middle-income' },
    'PE': { name: 'Peru', income: 'upper-middle-income' },
    'RU': { name: 'Russia', income: 'upper-middle-income' },
    'RS': { name: 'Serbia', income: 'upper-middle-income' },
    'ZA': { name: 'South Africa', income: 'upper-middle-income' },
    'LC': { name: 'St. Lucia', income: 'upper-middle-income' },
    'VC': { name: 'St. Vincent and Grenadines', income: 'upper-middle-income' },
    'SR': { name: 'Suriname', income: 'upper-middle-income' },
    'TH': { name: 'Thailand', income: 'upper-middle-income' },
    'TO': { name: 'Tonga', income: 'upper-middle-income' },
    'TR': { name: 'Turkey', income: 'upper-middle-income' },
    'TM': { name: 'Turkmenistan', income: 'upper-middle-income' },
    'UA': { name: 'Ukraine', income: 'upper-middle-income' },
    
    // High-income economies
    'AE': { name: 'United Arab Emirates', income: 'high-income' },
    'AU': { name: 'Australia', income: 'high-income' },
    'AT': { name: 'Austria', income: 'high-income' },
    'BE': { name: 'Belgium', income: 'high-income' },
    'CA': { name: 'Canada', income: 'high-income' },
    'CL': { name: 'Chile', income: 'high-income' },
    'HR': { name: 'Croatia', income: 'high-income' },
    'CY': { name: 'Cyprus', income: 'high-income' },
    'CZ': { name: 'Czech Republic', income: 'high-income' },
    'DK': { name: 'Denmark', income: 'high-income' },
    'EE': { name: 'Estonia', income: 'high-income' },
    'FI': { name: 'Finland', income: 'high-income' },
    'FR': { name: 'France', income: 'high-income' },
    'DE': { name: 'Germany', income: 'high-income' },
    'GR': { name: 'Greece', income: 'high-income' },
    'HK': { name: 'Hong Kong', income: 'high-income' },
    'HU': { name: 'Hungary', income: 'high-income' },
    'IS': { name: 'Iceland', income: 'high-income' },
    'IE': { name: 'Ireland', income: 'high-income' },
    'IL': { name: 'Israel', income: 'high-income' },
    'IT': { name: 'Italy', income: 'high-income' },
    'JP': { name: 'Japan', income: 'high-income' },
    'KR': { name: 'South Korea', income: 'high-income' },
    'KW': { name: 'Kuwait', income: 'high-income' },
    'LV': { name: 'Latvia', income: 'high-income' },
    'LT': { name: 'Lithuania', income: 'high-income' },
    'LU': { name: 'Luxembourg', income: 'high-income' },
    'MT': { name: 'Malta', income: 'high-income' },
    'NL': { name: 'Netherlands', income: 'high-income' },
    'NZ': { name: 'New Zealand', income: 'high-income' },
    'NO': { name: 'Norway', income: 'high-income' },
    'OM': { name: 'Oman', income: 'high-income' },
    'PL': { name: 'Poland', income: 'high-income' },
    'PT': { name: 'Portugal', income: 'high-income' },
    'QA': { name: 'Qatar', income: 'high-income' },
    'RO': { name: 'Romania', income: 'high-income' },
    'SA': { name: 'Saudi Arabia', income: 'high-income' },
    'SG': { name: 'Singapore', income: 'high-income' },
    'SK': { name: 'Slovakia', income: 'high-income' },
    'SI': { name: 'Slovenia', income: 'high-income' },
    'ES': { name: 'Spain', income: 'high-income' },
    'SE': { name: 'Sweden', income: 'high-income' },
    'CH': { name: 'Switzerland', income: 'high-income' },
    'TW': { name: 'Taiwan', income: 'high-income' },
    'GB': { name: 'United Kingdom', income: 'high-income' },
    'US': { name: 'United States', income: 'high-income' },
    'UY': { name: 'Uruguay', income: 'high-income' },
  };

useEffect(() => {
  if (isAuthenticated && userType === 'tutor') {
    const profileComplete = localStorage.getItem('profileComplete');
    const promptDismissed = sessionStorage.getItem('profilePromptDismissed');
    
    if (profileComplete !== 'true' && !promptDismissed) {
      // Show prompt after a short delay
      setTimeout(() => {
        setShowProfileCompletionPrompt(true);
      }, 1000);
    }
  }
}, [isAuthenticated, userType]);

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

            {/* STUDENT MENU ITEMS - Only show when authenticated as student */}
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

            {/* TUTOR MENU ITEMS - Only show when authenticated as tutor */}
            {isAuthenticated && userType === 'tutor' && (
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
// In your App.js, add this test component temporarily:

const DebugTutorFetch = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://hult.onrender.com/api/tutors');
      const data = await response.json();
      console.log('📊 Frontend received:', data);
      setTutors(data.tutors || []);
    } catch (error) {
      console.error('❌ Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
      <h3 className="font-bold mb-2">🔍 Debug: Tutor Fetch Test</h3>
      <button 
        onClick={fetchTutors}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-2"
      >
        Fetch Tutors
      </button>
      
      {loading && <p>Loading...</p>}
      
      {tutors.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold">Found {tutors.length} tutors:</p>
          <ul className="text-xs space-y-1 mt-2">
            {tutors.map(t => (
              <li key={t.id} className="bg-white p-2 rounded">
                {t.name} - {t.expertise?.slice(0, 50)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Add this to your HomeView temporarily:
{userType === 'student' && <DebugTutorFetch />}
// Replace your existing useEffect (around line 489) with these TWO separate effects:

// Replace your initial useEffect with this:
useEffect(() => {
  detectUserLocation();
  
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
    
    // ✅ CRITICAL: Don't show onboarding if profile is complete
    if (storedUserType === 'tutor') {
      const isComplete = profileComplete === 'true';
      console.log('📝 Tutor detected on mount, profileComplete =', isComplete);
      
      // Only show onboarding if explicitly incomplete
      if (!isComplete) {
        console.log('⚠️ Profile incomplete, will show prompt if needed');
      } else {
        console.log('✅ Profile complete, no prompt needed');
      }
    }
  }
}, []);

// Fetch courses and tutors count for student home dashboard
// Fetch courses and tutors count for student home dashboard
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

// NEW: Separate effect to fetch tutor stats when authentication and userType are ready
useEffect(() => {
  if (isAuthenticated && userType === 'tutor') {
    fetchTutorStats();
  }
}, [isAuthenticated, userType]);
  
  const detectUserLocation = async () => {
    setIsDetecting(true);
    
    // Simulate API call to ipapi.co or similar service
    // In production: const response = await fetch('https://ipapi.co/json/');
    
    setTimeout(() => {
      // Simulated detection - you can change this to test different countries
      const simulatedCountryCode = 'MU'; // Mauritius (upper-middle-income)
      // Try these: 'US' (high), 'IN' (lower-middle), 'ET' (low), 'BR' (upper-middle)
      
      const countryData = countryClassifications[simulatedCountryCode];
      
      if (countryData) {
        setDetectedCountry({
          code: simulatedCountryCode,
          name: countryData.name,
          income: countryData.income
        });
        setIncomeLevel(countryData.income);
        setUserRegion(countryData.income);
        setLocationVerified(true);
      } else {
        // Unknown country - default to middle income
        setDetectedCountry({
          code: simulatedCountryCode,
          name: 'Unknown',
          income: 'lower-middle-income'
        });
        setIncomeLevel('lower-middle-income');
        setUserRegion('lower-middle-income');
      }
      
      setIsDetecting(false);
    }, 1500);
  };

  // Replace the handleAIMatching function in your App.js with this fixed version:

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

  // Validate that survey has required fields (camelCase)
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
    
    // Convert camelCase to snake_case for backend
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

    const testResponse = await fetch(`${API_URL}/api/debug/test-match`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    student_profile: studentProfile
  })
});

const testResult = await testResponse.json();
console.log('🧪 Test result:', testResult);

    console.log('📡 ML API Response status:', response.status);

    console.log('🎯 Sending to AI:', {
  learningStyle: survey.learningStyle,
  subjects: survey.preferredSubjects,
  skillLevel: survey.skillLevel,
  mathScore: survey.mathScore,
  scienceScore: survey.scienceScore,
  languageScore: survey.languageScore,
  techScore: survey.techScore,
  motivationLevel: survey.motivationLevel
});

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
// MATCHED TUTORS RESULTS VIEW - Displays ML-generated matches
const MatchedTutorsView = () => {
  if (!matchedTutors || matchedTutors.length === 0) {
    return (
      <div className="p-4">
        <button 
          onClick={() => setCurrentView('tutors')}
          className="text-blue-600 mb-4"
        >
          ← Back to Find Tutors
        </button>
        
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Matches Found</h3>
          <p className="text-sm text-gray-600 mb-4">
            We couldn't find any tutors matching your criteria. This might be because:
          </p>
          <ul className="text-sm text-gray-600 mb-4 text-left max-w-md mx-auto">
            <li>• No tutors are currently available in your subject area</li>
            <li>• The ML model needs more tutor data</li>
            <li>• Try updating your survey preferences</li>
          </ul>
          <button 
            onClick={() => setCurrentView('tutors')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Browse All Tutors
          </button>
        </div>
      </div>
    );
  }

  const handleOpenFeedback = (tutor) => {
    setFeedbackTutor(tutor);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = () => {
    // Refresh matches after feedback
    handleAIMatching();
  };

  return (
    <div className="p-4">
      <button 
        onClick={() => setCurrentView('tutors')}
        className="text-blue-600 mb-4 flex items-center gap-1"
      >
        ← Back to Find Tutors
      </button>

      {/* Success Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Award size={32} />
          <div>
            <h2 className="text-2xl font-bold">Your Perfect Matches!</h2>
            <p className="text-purple-100">AI-powered personalized tutor recommendations</p>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Matches Found:</span>
            <span className="text-2xl font-bold">{matchedTutors.length}</span>
          </div>
          <div className="text-xs mt-2 opacity-80">
            Using: ML-Powered Matching with Performance History
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
        <div className="flex items-start gap-2">
          <BarChart3 className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Enhanced ML Matching</h4>
            <p className="text-sm text-blue-800">
              Our algorithm now learns from student feedback to improve recommendations over time.
              Rate your tutors to help us match you better!
            </p>
          </div>
        </div>
      </div>

      {/* Matched Tutors using TutorMatchCard */}
      <div className="space-y-4">
        {matchedTutors.map((match, index) => (
          <div key={match.tutor_id || index}>
            <TutorMatchCard 
              match={match}
              onFeedback={handleOpenFeedback}
              showPerformance={true}
            />
            
            {/* Additional Action Buttons */}
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => {
                  setSelectedTutor(match);
                  setCurrentView('tutor-profile');
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition text-sm font-semibold"
              >
                View Full Profile
              </button>
              <button 
                onClick={() => {
                  setSelectedTutor(match);
                  setCurrentView('chat');
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold"
              >
                Message Tutor
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Help us improve your matches</h4>
        <p className="text-sm text-gray-600 mb-3">
          After working with a tutor, rate your experience to get even better recommendations!
        </p>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setShowSurvey(true);
              setCurrentView('home');
            }}
            className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm"
          >
            Update Preferences
          </button>
          <button 
            onClick={() => setCurrentView('tutors')}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Browse All
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackTutor && (
        <TutorFeedbackModal
          tutor={{
            id: feedbackTutor.tutor_id,
            name: feedbackTutor.tutor_name
          }}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackTutor(null);
          }}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};


// Enhanced download function with actual downloading
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
    const response = await fetch(`https://hult.onrender.com/api/courses/${course.id}/download`, {
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
    const materialsResponse = await fetch(`https://hult.onrender.com/api/courses/${course.id}/materials`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const materialsData = await materialsResponse.json();
    
    // Step 3: Download each material file
    for (const material of materialsData.materials || []) {
      try {
        const fileResponse = await fetch(`https://hult.onrender.com/api/materials/${material.id}/stream`);
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

// Load offline courses on mount
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


  const getPricing = () => {
    if (!incomeLevel) return 'Detecting...';
    if (incomeLevel === 'low-income') return 'FREE';
    if (incomeLevel === 'lower-middle-income') return '$4.99/month';
    if (incomeLevel === 'upper-middle-income') return '$9.99/month';
    return '$19.99/month';
  };

  const getPricingColor = () => {
    if (incomeLevel === 'low-income') return 'text-green-600';
    if (incomeLevel === 'lower-middle-income') return 'text-blue-600';
    if (incomeLevel === 'upper-middle-income') return 'text-purple-600';
    return 'text-orange-600';
  };

  const verifyPhone = () => {
    if (phoneNumber.length > 8) {
      alert('Phone verification successful! Your location has been confirmed.');
      setShowVerification(false);
      setLocationVerified(true);
      
    } else {
      alert('Please enter a valid phone number.');
    }
  };
const [showSurvey, setShowSurvey] = useState(false);



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
        <p className="text-gray-600">Your access: <strong className={getPricingColor()}>{getPricing()}</strong></p>
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

const CoursesView = () => {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const fetchAllCourses = async () => {
    try {
      const response = await fetch('https://hult.onrender.com/api/courses');
      const data = await response.json();
      setAllCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Fallback to hardcoded courses if API fails
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
            
            <button 
              onClick={() => { setSelectedCourse(course); setCurrentView('course-detail'); }}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              View Course
            </button>
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

const fetchTutorStats = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('https://hult.onrender.com/api/tutor/stats', {
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
    // Set default values on error
    setTutorStats({
      totalCourses: 0,
      totalStudents: 0,
      totalMessages: 0
    });
  }
};
const MyCoursesView = () => {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    console.log('🔵 Fetching my courses...');
    console.log('🔵 isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('🔵 Token:', token ? 'exists' : 'missing');
      
      const response = await fetch('https://hult.onrender.com/api/student/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔵 Response status:', response.status);
      
      const data = await response.json();
      console.log('🔵 Response data:', data);
      
      setMyCourses(data.enrollments || []);
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (enrollmentId, newProgress) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hult.onrender.com/api/enrollments/${enrollmentId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress: newProgress })
      });

      if (response.ok) {
        // Refresh courses to show updated progress
        fetchMyCourses();
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center py-8">
        <p className="text-gray-600 mb-4">Please log in to view your courses</p>
        <button 
          onClick={() => setShowLogin(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Loading your courses...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">My Enrolled Courses</h2>

      {myCourses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p>No enrolled courses yet</p>
          <button 
            onClick={() => setCurrentView('courses')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myCourses.map(enrollment => {
            const isCompleted = enrollment.progress >= 100;
            const isOfflineAvailable = enrollment.offline_available;
            
            return (
              <div key={enrollment.id} className="bg-white rounded-lg shadow-md p-4 border-l-4" 
                   style={{ borderColor: isCompleted ? '#10b981' : '#3b82f6' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{enrollment.course_title}</h3>
                    <p className="text-sm text-gray-600">by {enrollment.tutor_name}</p>
                  </div>
                  {isCompleted && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <CheckCircle size={14} />
                      Completed
                    </div>
                  )}
                </div>
                
                {/* Progress Bar with Controls */}
                <div className="mt-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Progress</span>
                    <span className="font-bold text-blue-600">{enrollment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress Update Buttons */}
                  {!isCompleted && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => updateProgress(enrollment.id, Math.min(enrollment.progress + 10, 100))}
                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100"
                      >
                        +10%
                      </button>
                      <button
                        onClick={() => updateProgress(enrollment.id, Math.min(enrollment.progress + 25, 100))}
                        className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded hover:bg-purple-100"
                      >
                        +25%
                      </button>
                      <button
                        onClick={() => updateProgress(enrollment.id, 100)}
                        className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded hover:bg-green-100"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>

                {/* Course Access Info */}
                {isOfflineAvailable ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Download className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-semibold text-yellow-900">Offline Available</p>
                        <p className="text-xs text-yellow-700">This course is available for offline download</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-semibold text-blue-900">Online Only</p>
                        <p className="text-xs text-blue-700">View materials online - requires internet connection</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!isOfflineAvailable && (
                    <button 
                      onClick={() => {
                        setSelectedCourse(enrollment);
                        setCurrentView('course-materials');
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <FileText size={16} />
                      View Course Materials
                    </button>
                  )}
                  
                  {isOfflineAvailable && (
                    <button 
                      onClick={() => {
                        alert('This course is available for offline download. Go to "Offline Library" to access it.');
                        setCurrentView('offline');
                      }}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Access in Offline Library
                    </button>
                  )}
                  
                  {isCompleted && (
                    <button 
                      onClick={() => {
                        alert('Certificate feature coming soon!');
                      }}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <Award size={16} />
                      Get Certificate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
const OfflineView = () => {
  const [offlineDownloads, setOfflineDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCourse, setDownloadingCourse] = useState(null);
  const [availableForDownload, setAvailableForDownload] = useState([]);

  useEffect(() => {
    fetchOfflineData();
  }, []);

  const fetchOfflineData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Fetch user's offline downloads
      const downloadsResponse = await fetch('https://hult.onrender.com/api/student/downloads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const downloadsData = await downloadsResponse.json();
      
      // Fetch enrolled courses that are offline-available
      const enrollmentsResponse = await fetch('https://hult.onrender.com/api/student/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrollmentsData = await enrollmentsResponse.json();
      
      const offlineAvailableCourses = enrollmentsData.enrollments.filter(
        e => e.offline_available
      );
      
      setOfflineDownloads(downloadsData.downloads || []);
      setAvailableForDownload(offlineAvailableCourses);
    } catch (error) {
      console.error('Failed to fetch offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (course) => {
    console.log('\n🔵 Starting download for course:', course);
    setDownloadingCourse(course.course_id);
    
    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Record download in database
      console.log('🔵 Step 1: Recording download...');
      const response = await fetch(`https://hult.onrender.com/api/courses/${course.course_id}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const data = await response.json();
      console.log('✅ Step 1 Complete:', data);
      
      // Step 2: Fetch course materials
      console.log('🔵 Step 2: Fetching materials...');
      const materialsResponse = await fetch(`https://hult.onrender.com/api/courses/${course.course_id}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!materialsResponse.ok) {
        throw new Error('Failed to fetch materials');
      }
      
      const materialsData = await materialsResponse.json();
      console.log('✅ Step 2 Complete:', materialsData);
      console.log('📦 Materials found:', materialsData.materials?.length || 0);
      
      if (!materialsData.materials || materialsData.materials.length === 0) {
        alert('⚠️ This course has no materials to download yet.');
        fetchOfflineData();
        return;
      }
      
      // Step 3: Download each material file
      console.log('🔵 Step 3: Downloading files...');
      let successCount = 0;
      let failCount = 0;
      
      for (const material of materialsData.materials) {
        try {
          console.log(`📥 Downloading: ${material.title}`);
          
          const fileResponse = await fetch(`https://hult.onrender.com/api/materials/${material.id}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!fileResponse.ok) {
            throw new Error(`Failed to download ${material.title}`);
          }
          
          const blob = await fileResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${material.title}.${material.type}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          successCount++;
          console.log(`✅ Downloaded: ${material.title}`);
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          failCount++;
          console.error(`❌ Failed to download ${material.title}:`, err);
        }
      }
      
      console.log(`\n✅ Download Complete!`);
      console.log(`Success: ${successCount} files`);
      console.log(`Failed: ${failCount} files\n`);
      
      alert(`✅ ${course.course_title} downloaded!\n${successCount} files saved successfully.${failCount > 0 ? `\n${failCount} files failed.` : ''}`);
      fetchOfflineData(); // Refresh the list
      
    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`Failed to download: ${error.message}`);
    } finally {
      setDownloadingCourse(null);
    }
  };

  const handleRemoveDownload = async (downloadId) => {
    if (!window.confirm('Remove this course from offline library?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const download = offlineDownloads.find(d => d.id === downloadId);
      
      const response = await fetch(`https://hult.onrender.com/api/courses/${download.course_id}/download`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchOfflineData();
        alert('Removed from offline library');
      }
    } catch (error) {
      console.error('Failed to remove download:', error);
      alert('Failed to remove download');
    }
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getDaysUntilExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    return Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center py-8">
        <p className="text-gray-600 mb-4">Please log in to access offline library</p>
        <button 
          onClick={() => setShowLogin(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Loading offline library...</div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Download size={24} />
          <h2 className="text-xl font-bold">Offline Library</h2>
        </div>
        <p className="text-sm text-purple-100">Access downloaded courses anytime, anywhere - no internet required!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-xs text-gray-600">Downloaded</p>
          <p className="text-2xl font-bold text-gray-800">{offlineDownloads.length}</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-xs text-gray-600">Available</p>
          <p className="text-2xl font-bold text-gray-800">{availableForDownload.length}</p>
        </div>
      </div>

      {/* Downloaded Courses */}
      {offlineDownloads.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            Downloaded Courses
          </h3>
          <div className="space-y-3">
            {offlineDownloads.map(download => {
              const isExpired = download.is_expired;
              const daysLeft = getDaysUntilExpiry(download.expires_at);
              const expiringSoon = isExpiringSoon(download.expires_at);
              
              return (
                <div 
                  key={download.id} 
                  className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                    isExpired ? 'border-red-500' : expiringSoon ? 'border-yellow-500' : 'border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{download.course_title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Downloaded {new Date(download.downloaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {isExpired ? (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Expired</span>
                    ) : expiringSoon ? (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                        {daysLeft} days left
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Active</span>
                    )}
                  </div>

                  {/* Expiry Info */}
                  {!isExpired && download.expires_at && (
                    <div className="bg-gray-50 rounded p-2 mb-3 text-xs">
                      <p className="text-gray-600">
                        Expires: {new Date(download.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {isExpired && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-3 text-xs">
                      <p className="text-red-700">
                        ⚠️ This download has expired. Re-download to access materials.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isExpired ? (
                      <button 
                        onClick={() => {
                          setSelectedCourse({ 
                            course_id: download.course_id, 
                            course_title: download.course_title 
                          });
                          setCurrentView('offline-materials');
                        }}
                        className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition text-sm"
                      >
                        Open Materials
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          const course = availableForDownload.find(c => c.course_id === download.course_id);
                          if (course) handleDownload(course);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm"
                      >
                        Re-download
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemoveDownload(download.id)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available for Download */}
      {availableForDownload.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Download className="text-blue-500" size={20} />
            Available for Download
          </h3>
          <div className="space-y-3">
            {availableForDownload.map(course => {
              const alreadyDownloaded = offlineDownloads.some(d => d.course_id === course.course_id && !d.is_expired);
              
              return (
                <div key={course.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                  <h4 className="font-bold text-gray-800">{course.course_title}</h4>
                  <p className="text-sm text-gray-600 mb-3">by {course.tutor_name}</p>
                  
                  {alreadyDownloaded ? (
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700">
                      ✓ Already downloaded
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleDownload(course)}
                      disabled={downloadingCourse === course.course_id}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {downloadingCourse === course.course_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Download for Offline
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {offlineDownloads.length === 0 && availableForDownload.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Download size={48} className="mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-lg mb-2">No Offline Courses Yet</h3>
          <p className="text-sm mb-4">
            Enroll in courses with offline availability to download them here
          </p>
          <button 
            onClick={() => setCurrentView('courses')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Browse Courses
          </button>
        </div>
      )}
    </div>
  );
};
const OfflineMaterialsView = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials();
    }
  }, [selectedCourse]);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hult.onrender.com/api/courses/${selectedCourse.course_id}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type) => {
    switch(type) {
      case 'video': return <Video className="text-purple-600" size={24} />;
      case 'document': return <FileText className="text-blue-600" size={24} />;
      case 'presentation': return <FileText className="text-green-600" size={24} />;
      case 'audio': return <MessageSquare className="text-orange-600" size={24} />;
      default: return <FileText className="text-gray-600" size={24} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownloadMaterial = async (material) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hult.onrender.com/api/materials/${material.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${material.title}.${material.type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download material');
    }
  };

  if (loading) {
    return <div className="p-4">Loading materials...</div>;
  }

  return (
    <div className="p-4">
      <button 
        onClick={() => setCurrentView('offline')}
        className="text-blue-600 mb-4 flex items-center gap-1"
      >
        ← Back to Offline Library
      </button>

      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold mb-1">{selectedCourse?.course_title}</h2>
        <p className="text-sm text-purple-100">Offline Course Materials</p>
      </div>

      {materials.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <AlertCircle className="mx-auto mb-2 text-yellow-600" size={32} />
          <p className="text-yellow-800">No materials available for this course</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-3 rounded-lg">
                  {getMaterialIcon(material.type)}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{material.title}</h3>
                  <div className="flex gap-2 text-xs text-gray-600 mt-1">
                    <span className="bg-gray-100 px-2 py-1 rounded capitalize">{material.type}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{formatFileSize(material.file_size)}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setSelectedMaterial(material)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:shadow-lg transition text-sm font-medium"
                    >
                      {material.type === 'video' ? '▶ Watch' : 
                       material.type === 'audio' ? '🔊 Listen' : '📖 View'}
                    </button>
                    <button
                      onClick={() => handleDownloadMaterial(material)}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition text-sm"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Material Viewer Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">{selectedMaterial.title}</h3>
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {selectedMaterial.type === 'video' && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    controls 
                    className="w-full h-full"
                    src={`https://hult.onrender.com/api/materials/${selectedMaterial.id}/stream`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              
              {selectedMaterial.type === 'document' && (
                <div className="bg-white rounded-lg min-h-[500px]">
                  <iframe
                    src={`https://hult.onrender.com/api/materials/${selectedMaterial.id}/stream`}
                    className="w-full h-[600px] rounded-lg"
                    title={selectedMaterial.title}
                  />
                </div>
              )}

              {selectedMaterial.type === 'audio' && (
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8">
                  <audio 
                    controls 
                    className="w-full"
                    src={`https://hult.onrender.com/api/materials/${selectedMaterial.id}/stream`}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const CourseMaterialsView = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials();
    }
  }, [selectedCourse]);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hult.onrender.com/api/courses/${selectedCourse.course_id}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type) => {
    switch(type) {
      case 'video': return <Video className="text-purple-600" size={24} />;
      case 'document': return <FileText className="text-blue-600" size={24} />;
      case 'presentation': return <FileText className="text-green-600" size={24} />;
      case 'audio': return <MessageSquare className="text-orange-600" size={24} />;
      default: return <FileText className="text-gray-600" size={24} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-4">Loading materials...</div>;
  }

  return (
    <div className="p-4">
      <button 
        onClick={() => setCurrentView('my-courses')}
        className="text-blue-600 mb-4 flex items-center gap-1"
      >
        ← Back to My Courses
      </button>

      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold mb-1">{selectedCourse?.course_title}</h2>
        <p className="text-sm text-blue-100">Course Materials</p>
      </div>

      {materials.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <AlertCircle className="mx-auto mb-2 text-yellow-600" size={32} />
          <p className="text-yellow-800">No materials uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-3 rounded-lg">
                  {getMaterialIcon(material.type)}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{material.title}</h3>
                  <div className="flex gap-2 text-xs text-gray-600 mt-1">
                    <span className="bg-gray-100 px-2 py-1 rounded capitalize">{material.type}</span>
                    {material.file_size && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{formatFileSize(material.file_size)}</span>
                    )}
                    {material.duration && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {formatDuration(material.duration)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedMaterial(material)}
                    className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition text-sm font-medium"
                  >
                    {material.type === 'video' ? '▶ Watch Video' : 
                     material.type === 'audio' ? '🔊 Listen' : '📖 View Content'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Material Viewer Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">{selectedMaterial.title}</h3>
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {selectedMaterial.type === 'video' && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    controls 
                    className="w-full h-full"
                    src={`https://hult.onrender.com/api/materials/${selectedMaterial.id}/stream`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              
              {selectedMaterial.type === 'document' && (
                <div className="bg-white rounded-lg min-h-[500px]">
                  <iframe
                    src={`https://hult.onrender.com/api/materials/${selectedMaterial.id}/stream`}
                    className="w-full h-[600px] rounded-lg"
                    title={selectedMaterial.title}
                  />
                </div>
              )}

              {selectedMaterial.type === 'audio' && (
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8">
                  <audio 
                    controls 
                    className="w-full"
                    src={`https://hult.onrender.com/api/materials/${selectedMaterial.id}/stream`}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

{isAuthenticated && userType === 'student' && (
  <button 
    onClick={() => { setCurrentView('my-courses'); setMenuOpen(false); }} 
    className="w-full text-left px-4 py-3 hover:bg-white/20 rounded-lg transition flex items-center gap-3 bg-white/10"
  >
    <BookOpen size={20} />
    <span className="font-medium">My Courses</span>
  </button>
)}

// Add to main render section
{currentView === 'my-courses' && <MyCoursesView />}
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

<button 
  onClick={async () => {
    if (!isAuthenticated) {
      alert('Please log in to enroll!');
      setShowLogin(true);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hult.onrender.com/api/courses/${selectedCourse.id}/enroll`, {
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
  Enroll Now {incomeLevel === 'low-income' ? '(Free)' : `(${getPricing()})`}
</button>
        </div>
      )}
    </div>
  );

  const TutorsView = () => {
  const [allTutors, setAllTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      const response = await fetch('https://hult.onrender.com/api/tutors');
      const data = await response.json();
      setAllTutors(data.tutors || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = (tutor) => {
    setFeedbackTutor(tutor);
    setShowFeedbackModal(true);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading tutors...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-3">Find Your Perfect Tutor</h2>
        <button 
          onClick={handleAIMatching}
          disabled={aiMatching}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg transition disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          <MessageSquare size={20} />
          {aiMatching ? 'AI Matching in Progress...' : 'AI-Powered Smart Matching'}
        </button>
      </div>

      {aiMatching && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800">Analyzing your learning style, goals, and preferences...</p>
        </div>
      )}

      <div className="space-y-3">
        {(matchedTutors.length > 0 ? matchedTutors : allTutors).map(tutor => (
          <div key={tutor.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-800">{tutor.name}</h3>
                <p className="text-sm text-gray-600">{tutor.expertise}</p>
              </div>
              {matchedTutors.length > 0 && tutor.matchScore && (
                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                  {tutor.matchScore}% Match
                </div>
              )}
            </div>
            
            <div className="flex gap-2 text-xs text-gray-600 mb-2">
              <span className="bg-yellow-100 px-2 py-1 rounded">⭐ {tutor.rating}</span>
              <span className="bg-blue-100 px-2 py-1 rounded">{tutor.total_sessions || tutor.sessions} sessions</span>
              <span className="bg-green-100 px-2 py-1 rounded">{tutor.availability}</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Languages: {Array.isArray(tutor.languages) ? tutor.languages.join(', ') : tutor.languages}
            </p>
            
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm">
                Book Session
              </button>
              <button className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition text-sm">
                Message
              </button>
              <button 
                onClick={() => handleOpenFeedback(tutor)}
                className="bg-purple-100 text-purple-700 px-3 py-2 rounded hover:bg-purple-200 transition text-sm font-semibold"
              >
                Rate
              </button>
            </div>
          </div>
        ))}

        {allTutors.length === 0 && matchedTutors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No tutors available yet.</p>
          </div>
        )}
      </div>

      {/* 👇 PLACE THE FEEDBACK MODAL HERE - Right before the closing </div> */}
      {showFeedbackModal && feedbackTutor && (
        <TutorFeedbackModal
          tutor={feedbackTutor}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackTutor(null);
          }}
          onSubmit={() => {
            // Optionally refresh tutor list
            fetchTutors();
          }}
        />
      )}
    </div>
  );
};

  const DonateView = () => (
    <div className="p-4">
      <div className="bg-gradient-to-r from-pink-100 to-red-100 p-6 rounded-lg mb-4">
        <Heart className="text-red-500 mb-3" size={40} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Support Free Education</h2>
        <p className="text-gray-700">Help us provide free access to quality education for students in developing countries</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-bold mb-3">Your Impact</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="font-semibold">$10</p>
              <p className="text-sm text-gray-600">Provides 1 month of free access for a student</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded">
              <BookOpen className="text-green-600" size={20} />
            </div>
            <div>
              <p className="font-semibold">$50</p>
              <p className="text-sm text-gray-600">Sponsors a complete course for 5 students</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <Globe className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="font-semibold">$100</p>
              <p className="text-sm text-gray-600">Supports 1 year of education for a student</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-lg hover:shadow-lg transition">
          One-Time Donation
        </button>
        <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg hover:shadow-lg transition">
          Monthly Support
        </button>
        <button className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition">
          Share Platform
        </button>
      </div>

      <div className="mt-4 bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-800">✓ 100% of donations go directly to providing free education</p>
        <p className="text-sm text-green-800 mt-1">✓ Tax-deductible in eligible countries</p>
      </div>
    </div>
  );
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

    

    {/* Always show HomeView when not authenticated, otherwise show requested view */}
    {!isAuthenticated ? (
      <HomeView />
    ) : (
      <>
        {currentView === 'home' && <HomeView />}
        {currentView === 'courses' && <CoursesView />}
        {currentView === 'course-detail' && <CourseDetailView />}
        {currentView === 'tutors' && <TutorsView />}
        {currentView === 'offline' && <OfflineView />}
        {currentView === 'offline-materials' && <OfflineMaterialsView />}
        {currentView === 'donate' && <DonateView />}
        {currentView === 'matched-tutors' && <MatchedTutorsView />}
        {currentView === 'my-courses' && <MyCoursesView key={currentView} />}
        {currentView === 'course-materials' && <CourseMaterialsView />}
        
       
      </>
    )}

    {/* Chat view - only for authenticated users */}
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

    {/* Modals and profiles - available for authenticated users */}
 {showTutorOnboarding && (
  <TutorOnboarding
    onComplete={(profileData) => {
      // ✅ Update localStorage to mark profile as complete
      localStorage.setItem('profileComplete', 'true');
      
      if (profileData?.tutor_profile_id) {
        localStorage.setItem('tutorProfileId', profileData.tutor_profile_id);
        console.log('✅ Saved tutorProfileId from onboarding:', profileData.tutor_profile_id);
      }
      
      // ✅ Update user object in localStorage
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

    {/* Bottom navigation - only show for authenticated users */}
{/* Bottom navigation - only show for authenticated users */}
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
          <button onClick={() => setCurrentView('chat')} className={`flex flex-col items-center p-2 ${currentView === 'chat' ? 'text-blue-600' : 'text-gray-600'}`}>
            <Users size={24} />
            <span className="text-xs mt-1">Tutors</span>
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
