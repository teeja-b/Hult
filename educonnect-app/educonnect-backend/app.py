from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
import json
from functools import wraps
import jwt
from flask import request, jsonify
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import Table, TableStyle
import os
import sys

# Reduce memory usage
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'




# IMPORT YOUR ML SYSTEM
from ml_matcher import TutorMatchingSystem
db = SQLAlchemy()
app = Flask(__name__)

# At the top of your file, replace CORS(app) with:
CORS(app, 
     origins=[
         "https://hult-ten.vercel.app",
         "http://localhost:3000",
         "http://localhost:5173",
         "http://127.0.0.1:3000",
         "http://127.0.0.1:5173"
     ],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     expose_headers=["Content-Type", "Authorization"])

print("✅ CORS configured for:", [
    "https://hult-ten.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
])


# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///educonnect.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'courses'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'materials'), exist_ok=True)

db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app) 

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# INITIALIZE ML MATCHING SYSTEM
matcher = None

def get_matcher():
    global matcher
    if matcher is None:
        matcher = TutorMatchingSystem()
    return matcher

# ============================================================================
# DATABASE MODELS
# ============================================================================


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    country_code = db.Column(db.String(5))
    income_level = db.Column(db.String(50))
    phone_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    student_profile = db.relationship('StudentProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    tutor_profile = db.relationship('TutorProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='student', cascade='all, delete-orphan')

class StudentProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    learning_style = db.Column(db.String(50))
    preferred_subjects = db.Column(db.Text)
    skill_level = db.Column(db.String(50))
    learning_goals = db.Column(db.Text)
    available_time = db.Column(db.String(50))
    preferred_languages = db.Column(db.Text)
    survey_completed = db.Column(db.Boolean, default=False)
    
    math_score = db.Column(db.Integer)
    science_score = db.Column(db.Integer)
    language_score = db.Column(db.Integer)
    tech_score = db.Column(db.Integer)
    motivation_level = db.Column(db.Integer)

class TutorProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    expertise = db.Column(db.Text)
    bio = db.Column(db.Text)
    hourly_rate = db.Column(db.Float)
    rating = db.Column(db.Float, default=0.0)
    total_sessions = db.Column(db.Integer, default=0)
    languages = db.Column(db.Text)
    availability = db.Column(db.Text)
    verified = db.Column(db.Boolean, default=False)
    
    courses = db.relationship('Course', backref='tutor', cascade='all, delete-orphan')

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tutor_id = db.Column(db.Integer, db.ForeignKey('tutor_profile.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    level = db.Column(db.String(50))
    duration = db.Column(db.String(50))
    price = db.Column(db.Float, default=0.0)
    rating = db.Column(db.Float, default=0.0)
    total_students = db.Column(db.Integer, default=0)
    offline_available = db.Column(db.Boolean, default=False)
    published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    materials = db.relationship('CourseMaterial', backref='course', cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='course', cascade='all, delete-orphan')

class CourseMaterial(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    material_type = db.Column(db.String(50))
    file_path = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    order = db.Column(db.Integer)
    duration = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress = db.Column(db.Float, default=0.0)
    completed = db.Column(db.Boolean, default=False)
    certificate_issued = db.Column(db.Boolean, default=False)

class OfflineDownload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    downloaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)



class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    participant1_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    participant2_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    last_message = db.Column(db.String(500))
    last_message_time = db.Column(db.DateTime)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'))
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    text = db.Column(db.String(1000))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Optional: Booking model
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tutor_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    subject = db.Column(db.String(100))
    date = db.Column(db.String(20))
    time = db.Column(db.String(20))
    duration = db.Column(db.Integer)
    status = db.Column(db.String(20))
    notes = db.Column(db.String(500))





# -------------------- ROUTES --------------------
@app.route('/api/enrollments/<int:enrollment_id>/progress', methods=['PUT'])
@jwt_required()
def update_enrollment_progress(enrollment_id):
    """Update student's course progress"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'student':
            return jsonify({'error': 'Only students can update progress'}), 403
        
        enrollment = Enrollment.query.get(enrollment_id)
        
        if not enrollment:
            return jsonify({'error': 'Enrollment not found'}), 404
        
        # Check ownership
        if enrollment.student_id != user_id:
            return jsonify({'error': 'Not authorized'}), 403
        
        data = request.get_json()
        new_progress = float(data.get('progress', 0))
        
        # Validate progress
        if new_progress < 0 or new_progress > 100:
            return jsonify({'error': 'Progress must be between 0 and 100'}), 400
        
        enrollment.progress = new_progress
        
        # Mark as completed if progress is 100%
        if new_progress >= 100:
            enrollment.completed = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Progress updated successfully',
            'progress': enrollment.progress,
            'completed': enrollment.completed
        }), 200
        
    except ValueError as e:
        return jsonify({'error': f'Invalid progress value: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"[PROGRESS ERROR] {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to update progress'}), 500


@app.route('/api/student/enrollments', methods=['GET'])
@jwt_required()
def get_student_enrollments():
    """Get student's enrolled courses with offline availability info"""
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    user = User.query.get(user_id)
    
    if not user or user.user_type != 'student':
        return jsonify({'error': 'Not authorized'}), 403
    
    enrollments = Enrollment.query.filter_by(student_id=user_id).all()
    
    enrollments_list = []
    for enrollment in enrollments:
        course = enrollment.course
        tutor_name = course.tutor.user.full_name if course.tutor else 'Unknown'
        
        enrollments_list.append({
            'id': enrollment.id,
            'course_id': course.id,
            'course_title': course.title,
            'tutor_name': tutor_name,
            'progress': enrollment.progress,
            'completed': enrollment.completed,
            'offline_available': course.offline_available,  # Add this field
            'enrolled_at': enrollment.enrolled_at.isoformat()
        })
    
    return jsonify({'enrollments': enrollments_list}), 200
@app.route('/api/tutor/stats', methods=['GET'])
@jwt_required()
def get_tutor_stats():
    """Get tutor statistics for dashboard"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can access stats'}), 403
        
        tutor_profile = user.tutor_profile
        if not tutor_profile:
            return jsonify({
                'totalCourses': 0,
                'totalStudents': 0,
                'totalMessages': 0
            }), 200
        
        # Get course count
        course_count = Course.query.filter_by(tutor_id=tutor_profile.id).count()
        
        # Get total students across all courses
        courses = Course.query.filter_by(tutor_id=tutor_profile.id).all()
        total_students = sum(course.total_students for course in courses)
        
        # Get message count (conversations where tutor is participant)
        message_count = Conversation.query.filter(
            (Conversation.participant1_id == user_id) | 
            (Conversation.participant2_id == user_id)
        ).count()
        
        return jsonify({
            'totalCourses': course_count,
            'totalStudents': total_students,
            'totalMessages': message_count
        }), 200
        
    except Exception as e:
        print(f"[STATS ERROR] {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to get stats'}), 500

# ============================================================================
# TUTOR MESSAGING ROUTES
# ============================================================================

@app.route('/api/tutors/<int:tutor_id>/conversations', methods=['GET', 'OPTIONS'])
def get_tutor_conversations(tutor_id):
    """Get all conversations for a tutor"""
    
    print("\n" + "🔥"*50)
    print(f"🔥 TUTOR CONVERSATIONS ROUTE WAS HIT! Tutor ID: {tutor_id}")
    print(f"🔥 Request method: {request.method}")
    print("🔥"*50 + "\n")
    
    if request.method == 'OPTIONS':
        print("[TUTOR CONV] Handling OPTIONS request")
        return '', 200
    
    try:
        print(f"[TUTOR CONV] Step 1: Looking for tutor profile {tutor_id}...")
        
        # Get the tutor profile
        tutor_profile = TutorProfile.query.get(tutor_id)
        
        print(f"[TUTOR CONV] Step 2: Tutor profile result: {tutor_profile}")
        
        if not tutor_profile:
            print(f"[TUTOR CONV ERROR] Step 3: Tutor profile {tutor_id} NOT FOUND - returning 404")
            return jsonify({'error': 'Tutor not found'}), 404
        
        print(f"[TUTOR CONV] Step 3: Found tutor! user_id = {tutor_profile.user_id}")
        
        user_id = tutor_profile.user_id
        
        # Verify the user exists
        user = User.query.get(user_id)
        print(f"[TUTOR CONV] Step 4: User lookup result: {user}")
        
        if not user:
            print(f"[TUTOR CONV ERROR] User {user_id} not found - returning 404")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"[TUTOR CONV] Step 5: User found: {user.full_name}")
        
        # Get all conversations where this user is a participant
        print(f"[TUTOR CONV] Step 6: Searching for conversations with user_id {user_id}...")
        convs = Conversation.query.filter(
            (Conversation.participant1_id == user_id) | (Conversation.participant2_id == user_id)
        ).all()
        
        print(f"[TUTOR CONV] Step 7: Found {len(convs)} conversations")
        
        result = []
        for i, c in enumerate(convs):
            print(f"[TUTOR CONV] Step 8.{i}: Processing conversation {c.id}...")
            partner_id = c.participant2_id if c.participant1_id == user_id else c.participant1_id
            partner = User.query.get(partner_id)
            
            if partner:
                conv_data = {
                    'id': c.id,
                    'partnerId': partner.id,
                    'partnerName': partner.full_name,
                    'partnerAvatar': f'https://ui-avatars.com/api/?name={partner.full_name}',
                    'lastMessage': c.last_message or '',
                    'lastMessageTime': c.last_message_time.isoformat() if c.last_message_time else None
                }
                result.append(conv_data)
                print(f"[TUTOR CONV] Added conversation with {partner.full_name}")
            else:
                print(f"[TUTOR CONV] Warning: Partner {partner_id} not found, skipping")
        
        print(f"[TUTOR CONV] Step 9: Returning {len(result)} conversations")
        print(f"[TUTOR CONV] Step 10: About to return response with status 200")
        
        response = jsonify(result)
        print(f"[TUTOR CONV] Step 11: Response created successfully")
        return response, 200
        
    except Exception as e:
        print(f"❌ [TUTOR CONV ERROR] EXCEPTION CAUGHT!")
        print(f"❌ Exception type: {type(e)}")
        print(f"❌ Exception message: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to retrieve conversations', 'details': str(e)}), 500
@app.route('/api/students/<int:student_id>/conversations', methods=['GET'])
def get_student_conversations(student_id):
    print("\n" + "🔥"*50)
   
    print("🔥"*50 + "\n")
    """Get all conversations for a student (same as tutor but for students)"""
    try:
        user = User.query.get(student_id)
        
        if not user:
            return jsonify({'error': 'Student not found'}), 404
        
        convs = Conversation.query.filter(
            (Conversation.participant1_id == student_id) | (Conversation.participant2_id == student_id)
        ).all()
        
        result = []
        for c in convs:
            partner_id = c.participant2_id if c.participant1_id == student_id else c.participant1_id
            partner = User.query.get(partner_id)
            
            if partner:
                result.append({
                    'id': c.id,
                    'partnerId': partner.id,
                    'partnerName': partner.full_name,
                    'partnerAvatar': f'https://ui-avatars.com/api/?name={partner.full_name}',
                    'lastMessage': c.last_message or '',
                    'lastMessageTime': c.last_message_time.isoformat() if c.last_message_time else None
                })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to get student conversations: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to retrieve conversations'}), 500

@app.route('/api/conversations/<int:conversation_id>/messages', methods=['POST'])
def post_message(conversation_id):
    data = request.json
    sender_id = data.get('senderId')
    text = data.get('text')
    msg = Message(conversation_id=conversation_id, sender_id=sender_id, text=text)
    db.session.add(msg)
    
    # Update conversation last message
    conv = Conversation.query.get(conversation_id)
    conv.last_message = text
    conv.last_message_time = msg.timestamp
    db.session.commit()
    
    return jsonify({
        'id': msg.id,
        'senderId': sender_id,
        'text': text,
        'timestamp': msg.timestamp
    }), 201
# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================
@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register_alt():
    """Alternative register endpoint without /auth/ prefix"""
    if request.method == 'OPTIONS':
        return '', 200
    return register()

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    try:
        data = request.json
        
        print(f"[REGISTER] Attempting registration: {data.get('email')}, role: {data.get('role')}")
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User already exists'}), 400
        
        # Create new user
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        new_user = User(
            email=data['email'],
            password_hash=hashed_password,
            full_name=data['name'],
            user_type=data.get('role', 'student'),
            income_level=data.get('income_level', 'lower-middle-income')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        print(f"[REGISTER] User created with ID: {new_user.id}")
        
        # Create token
        access_token = create_access_token(identity=str(new_user.id))
        
        # Build user data
        user_data = {
            'id': new_user.id,
            'email': new_user.email,
            'user_type': new_user.user_type,
            'full_name': new_user.full_name,
            'income_level': new_user.income_level
        }
        
        # ✅ CRITICAL: Check for tutor profile (will be null for new tutors)
        if new_user.user_type == 'tutor':
            tutor_profile = TutorProfile.query.filter_by(user_id=new_user.id).first()
            if tutor_profile:
                user_data['tutor_profile_id'] = tutor_profile.id
                print(f"[REGISTER] ✅ Found existing tutor_profile_id: {tutor_profile.id}")
            else:
                user_data['tutor_profile_id'] = None
                print(f"[REGISTER] 📝 New tutor - profile will be created during onboarding")
        
        return jsonify({
            'token': access_token,
            'user': user_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[REGISTER ERROR] {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login_alt():
    """Alternative login endpoint without /auth/ prefix"""
    if request.method == 'OPTIONS':
        return '', 200
    return login()


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        print(f"[LOGIN] Attempting login: {data.get('email')}")
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create token with user.id as STRING
        access_token = create_access_token(identity=str(user.id))
        
        print(f"[LOGIN] Success! Token created for user {user.id}")
        
        # Build user data
        user_data = {
            'id': user.id,
            'email': user.email,
            'user_type': user.user_type,
            'full_name': user.full_name,
            'income_level': user.income_level
        }
        
        # ✅ CRITICAL: Add tutor_profile_id for tutors
        if user.user_type == 'tutor':
            tutor_profile = TutorProfile.query.filter_by(user_id=user.id).first()
            if tutor_profile:
                user_data['tutor_profile_id'] = tutor_profile.id
                print(f"[LOGIN] ✅ Found tutor_profile_id: {tutor_profile.id}")
            else:
                user_data['tutor_profile_id'] = None
                print(f"[LOGIN] ⚠️ No tutor profile found for user {user.id}")
        
        return jsonify({
            'token': access_token,
            'user': user_data
        }), 200
        
    except Exception as e:
        print(f"[LOGIN ERROR] {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ML-POWERED TUTOR MATCHING ENDPOINT
# ============================================================================

@app.route('/api/student/match', methods=['POST', 'OPTIONS'])
def match_tutors():
    """ML-powered tutor matching endpoint"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        print("\n" + "="*70)
        print("[MATCH] Starting tutor matching...")
        print("="*70)
        
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        try:
            verify_jwt_in_request()
        except Exception as e:
            print(f"[MATCH ERROR] JWT verification failed: {e}")
            return jsonify({'error': 'Authentication required', 'details': str(e)}), 401
        
        user_id_str = get_jwt_identity()
        print(f"[MATCH] User ID: {user_id_str}")
        
        user_id = int(user_id_str)
        user = User.query.get(user_id)

        if not user:
            print(f"[MATCH ERROR] User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        if user.user_type != 'student':
            print(f"[MATCH ERROR] Not a student: {user.user_type}")
            return jsonify({'error': 'Not a student account'}), 403

        data = request.get_json() or {}
        print(f"[MATCH] Received data: {data}")

        profile = user.student_profile
        if not profile:
            print("[MATCH] Creating new student profile")
            profile = StudentProfile(user_id=user.id)
            db.session.add(profile)
            db.session.flush()

        profile.learning_style = data.get('learningStyle') or profile.learning_style or 'visual'
        profile.preferred_subjects = json.dumps(data.get('subjects', []))
        profile.learning_goals = data.get('goals', profile.learning_goals or '')
        profile.available_time = data.get('availability', profile.available_time or 'evening')
        profile.skill_level = data.get('skill_level', profile.skill_level or 'intermediate')
        profile.preferred_languages = json.dumps(data.get('preferred_languages', ['English']))
        profile.survey_completed = True

        db.session.commit()
        print("[MATCH] Profile saved successfully")

        student_data = {
            'learning_style': profile.learning_style,
            'preferred_subjects': json.loads(profile.preferred_subjects),
            'skill_level': profile.skill_level,
            'available_time': profile.available_time,
            'preferred_languages': json.loads(profile.preferred_languages)
        }
        print(f"[MATCH] Student data: {student_data}")

        all_tutors = TutorProfile.query.filter_by(verified=True).all()
        print(f"[MATCH] Found {len(all_tutors)} verified tutors")

        if len(all_tutors) == 0:
            print("[MATCH] No tutors available")
            return jsonify({
                'matches': [],
                'message': 'No tutors available yet. Please check back later.',
                'algorithm': 'Weighted Feature Matching with ML'
            }), 200

        tutors_data = []
        for t in all_tutors:
            # Explicitly load user
            tutor_user = User.query.get(t.user_id) if t.user_id else None
            
            if not tutor_user:
                print(f"[MATCH WARNING] Tutor {t.id} has no associated user, skipping")
                continue
            
            tutor_dict = {
                'id': t.id,
                'user_id': t.user_id,
                'name': tutor_user.full_name,
                'expertise': json.loads(t.expertise or '[]'),
                'languages': json.loads(t.languages or '["English"]'),
                'availability': json.loads(t.availability or '{}'),
                'rating': t.rating or 4.5,
                'total_sessions': t.total_sessions or 0,
                'teaching_style': 'adaptive'
            }
            tutors_data.append(tutor_dict)
        
        print(f"[MATCH] Prepared {len(tutors_data)} tutor records")
        print(f"[MATCH] Calling ML matcher...")

        ml_matches = get_matcher().get_top_matches(student_data, tutors_data, top_n=10)
        print(f"[MATCH] ML matcher returned {len(ml_matches)} matches")

        matches = []
        for ml_match in ml_matches:
            tutor = next((t for t in all_tutors if t.id == ml_match['tutor_id']), None)
            if not tutor:
                continue
            
            # Explicitly load user again
            tutor_user = User.query.get(tutor.user_id)
            if not tutor_user:
                continue
                
            matches.append({
                'id': tutor.id,
                'user_id': tutor.user_id,
                'name': tutor_user.full_name,
                'expertise': ', '.join(json.loads(tutor.expertise or '[]')),
                'rating': tutor.rating or 4.5,
                'sessions': tutor.total_sessions or 0,
                'languages': json.loads(tutor.languages or '["English"]'),
                'matchScore': ml_match['match_score'],
                'breakdown': ml_match.get('breakdown', {}),
                'explanations': matcher.explain_match(ml_match)
            })

        print(f"[MATCH] Returning {len(matches)} matches")
        print("="*70 + "\n")

        return jsonify({
            'matches': matches,
            'message': f'ML matching found {len(matches)} tutors',
            'algorithm': 'Weighted Feature Matching with ML'
        }), 200
        
    except Exception as e:
        print(f"\n❌ [MATCH ERROR] Exception occurred: {str(e)}")
        import traceback
        print(traceback.format_exc())
        print("="*70 + "\n")
        
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'message': 'Failed to match tutors. Please try again.'
        }), 500


# ============================================================================
# SEED DATA ENDPOINT (for testing)
# ============================================================================

@app.route('/api/seed-tutors', methods=['POST'])
def seed_tutors():
    """Create sample tutors for testing"""
    
    if TutorProfile.query.count() > 0:
        return jsonify({'message': 'Tutors already exist'}), 200
    
    sample_tutors = [
        {
            'email': 'sarah.johnson@example.com',
            'password': 'password123',
            'full_name': 'Dr. Sarah Johnson',
            'expertise': ['Mathematics', 'Physics', 'Calculus'],
            'bio': 'PhD in Mathematics with 10 years teaching experience',
            'hourly_rate': 50.0,
            'rating': 4.9,
            'total_sessions': 234,
            'languages': ['English', 'Spanish'],
            'availability': {'morning': True, 'afternoon': True, 'evening': False}
        },
        {
            'email': 'john.smith@example.com',
            'password': 'password123',
            'full_name': 'John Smith',
            'expertise': ['Web Development', 'Programming', 'JavaScript', 'Python'],
            'bio': 'Senior software developer and coding instructor',
            'hourly_rate': 45.0,
            'rating': 4.8,
            'total_sessions': 189,
            'languages': ['English'],
            'availability': {'morning': False, 'afternoon': True, 'evening': True}
        },
        {
            'email': 'emma.williams@example.com',
            'password': 'password123',
            'full_name': 'Emma Williams',
            'expertise': ['English', 'Literature', 'Writing'],
            'bio': 'English literature professor and published author',
            'hourly_rate': 40.0,
            'rating': 4.7,
            'total_sessions': 156,
            'languages': ['English', 'French'],
            'availability': {'morning': True, 'afternoon': True, 'evening': False}
        },
        {
            'email': 'michael.chen@example.com',
            'password': 'password123',
            'full_name': 'Prof. Michael Chen',
            'expertise': ['Physics', 'Chemistry', 'Science'],
            'bio': 'University physics professor',
            'hourly_rate': 55.0,
            'rating': 4.9,
            'total_sessions': 298,
            'languages': ['English', 'Mandarin'],
            'availability': {'morning': True, 'afternoon': False, 'evening': True}
        }
    ]
    
    for tutor_data in sample_tutors:
        hashed_password = bcrypt.generate_password_hash(tutor_data['password']).decode('utf-8')
        user = User(
            email=tutor_data['email'],
            password_hash=hashed_password,
            user_type='tutor',
            full_name=tutor_data['full_name']
        )
        db.session.add(user)
        db.session.flush()
        
        profile = TutorProfile(
            user_id=user.id,
            expertise=json.dumps(tutor_data['expertise']),
            bio=tutor_data['bio'],
            hourly_rate=tutor_data['hourly_rate'],
            rating=tutor_data['rating'],
            total_sessions=tutor_data['total_sessions'],
            languages=json.dumps(tutor_data['languages']),
            availability=json.dumps(tutor_data['availability']),
            verified=True
        )
        db.session.add(profile)
    
    db.session.commit()
    
    return jsonify({'message': f'Created {len(sample_tutors)} sample tutors'}), 201

# ============================================================================
# TEST/DEBUG ENDPOINTS
# ============================================================================

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify server is working"""
    print("[TEST] Test endpoint was hit!")
    return jsonify({
        'message': 'Server is working!',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@app.route('/api/debug/request', methods=['POST'])
def debug_request():
    """Debug endpoint to see what data is being sent"""
    print("\n" + "="*70)
    print("[DEBUG] Request received!")
    print("="*70)
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Content-Type: {request.content_type}")
    print(f"Data: {request.get_data(as_text=True)}")
    
    try:
        json_data = request.get_json(force=True)
        print(f"JSON Data: {json.dumps(json_data, indent=2)}")
    except Exception as e:
        print(f"Could not parse JSON: {e}")
    
    print("="*70 + "\n")
    
    return jsonify({'received': True}), 200

# ============================================================================
# STUDENT ENDPOINTS
# ============================================================================

@app.route('/api/student/survey', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def save_student_survey():
    """Save student survey/preferences - with comprehensive debugging"""
    
    print("\n" + "🔵"*35)
    print("🔵 SURVEY ENDPOINT HIT!")
    print("🔵"*35)
    
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        print("[SURVEY] Handling OPTIONS preflight request")
        return '', 200
    
    try:
        print(f"[SURVEY] Method: {request.method}")
        print(f"[SURVEY] Headers: {dict(request.headers)}")
        
        # Get user identity - convert to int
        user_id_str = get_jwt_identity()
        print(f"[SURVEY] User ID (string): {user_id_str}")
        
        if not user_id_str:
            print("[SURVEY ERROR] No user_id - authentication failed")
            return jsonify({'error': 'Authentication required'}), 401
        
        # Convert string ID to integer
        user_id = int(user_id_str)
        print(f"[SURVEY] User ID (converted to int): {user_id}")
        
        user = User.query.get(user_id)
        
        if not user:
            print(f"[SURVEY ERROR] User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        if user.user_type != 'student':
            print(f"[SURVEY ERROR] User is not a student: {user.user_type}")
            return jsonify({'error': 'Only students can complete surveys'}), 403
        
        # Get request data
        raw_data = request.get_data(as_text=True)
        print(f"[SURVEY] Raw data: {raw_data}")
        
        data = request.get_json(force=True, silent=True)
        
        # Debug: Print received data
        print(f"[SURVEY] Parsed JSON data:")
        print(json.dumps(data, indent=2))
        
        if not data:
            print("[SURVEY ERROR] No data provided or couldn't parse JSON")
            return jsonify({'error': 'No data provided'}), 400
        
        # Get or create student profile
        profile = user.student_profile
        if not profile:
            print(f"[SURVEY] Creating new profile for user {user_id}")
            profile = StudentProfile(user_id=user.id)
            db.session.add(profile)
            db.session.flush()
        else:
            print(f"[SURVEY] Updating existing profile {profile.id}")
        
        # Handle different possible field names from frontend
        # Support both camelCase and snake_case
        profile.learning_style = (
            data.get('learningStyle') or 
            data.get('learning_style') or 
            data.get('style') or
            'visual'  # default
        )
        print(f"[SURVEY] Learning style: {profile.learning_style}")
        
        # Handle subjects - can be array or string
        subjects = data.get('subjects') or data.get('preferred_subjects') or []
        if isinstance(subjects, str):
            subjects = [s.strip() for s in subjects.split(',')]
        profile.preferred_subjects = json.dumps(subjects)
        print(f"[SURVEY] Subjects: {subjects}")
        
        # Handle skill level
        profile.skill_level = (
            data.get('skillLevel') or 
            data.get('skill_level') or 
            data.get('level') or 
            'beginner'
        )
        print(f"[SURVEY] Skill level: {profile.skill_level}")
        
        # Handle goals
        profile.learning_goals = (
            data.get('goals') or 
            data.get('learning_goals') or 
            data.get('learningGoals') or
            ''
        )
        
        # Handle availability
        profile.available_time = (
            data.get('availability') or 
            data.get('available_time') or 
            data.get('availableTime') or
            'evening'
        )
        print(f"[SURVEY] Availability: {profile.available_time}")
        
        # Handle languages
        languages = (
            data.get('languages') or 
            data.get('preferred_languages') or 
            data.get('preferredLanguages') or 
            ['English']
        )
        if isinstance(languages, str):
            languages = [lang.strip() for lang in languages.split(',')]
        profile.preferred_languages = json.dumps(languages)
        print(f"[SURVEY] Languages: {languages}")
        
        # Optional: detailed scores (default to 5 if not provided)
        profile.math_score = int(
            data.get('mathScore') or 
            data.get('math_score') or 
            5
        )
        profile.science_score = int(
            data.get('scienceScore') or 
            data.get('science_score') or 
            5
        )
        profile.language_score = int(
            data.get('languageScore') or 
            data.get('language_score') or 
            5
        )
        profile.tech_score = int(
            data.get('techScore') or 
            data.get('tech_score') or 
            5
        )
        profile.motivation_level = int(
            data.get('motivationLevel') or 
            data.get('motivation_level') or 
            7
        )
        
        profile.survey_completed = True
        
        print("[SURVEY] About to commit to database...")
        
        # Commit to database
        db.session.commit()
        
        print(f"✅ [SURVEY] Successfully saved survey for user {user_id}")
        
        response_data = {
            'message': 'Survey saved successfully',
            'profile': {
                'id': profile.id,
                'learning_style': profile.learning_style,
                'preferred_subjects': json.loads(profile.preferred_subjects or '[]'),
                'skill_level': profile.skill_level,
                'available_time': profile.available_time,
                'survey_completed': profile.survey_completed
            }
        }
        
        print(f"[SURVEY] Sending response: {json.dumps(response_data, indent=2)}")
        print("🔵"*35 + "\n")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        print(f"❌ [SURVEY ERROR] Exception: {error_message}")
        import traceback
        print(traceback.format_exc())
        print("🔵"*35 + "\n")
        
        return jsonify({
            'error': 'Failed to save survey',
            'details': error_message
        }), 500

@app.route('/api/student/profile', methods=['GET', 'PUT'])
@jwt_required()
def student_profile():
    """Get or update student profile"""
    # Convert string ID to integer
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    
    user = User.query.get(user_id)
    
    if not user or user.user_type != 'student':
        return jsonify({'error': 'Not authorized'}), 403
    
    profile = user.student_profile
    
    if request.method == 'GET':
        if not profile:
            return jsonify({
                'profile': None,
                'survey_completed': False
            }), 200
        
        return jsonify({
            'profile': {
                'learning_style': profile.learning_style,
                'preferred_subjects': json.loads(profile.preferred_subjects or '[]'),
                'skill_level': profile.skill_level,
                'learning_goals': profile.learning_goals,
                'available_time': profile.available_time,
                'preferred_languages': json.loads(profile.preferred_languages or '[]'),
                'survey_completed': profile.survey_completed,
                'math_score': profile.math_score,
                'science_score': profile.science_score,
                'language_score': profile.language_score,
                'tech_score': profile.tech_score,
                'motivation_level': profile.motivation_level
            }
        }), 200
    
    elif request.method == 'PUT':
        print("\n📝 [PROFILE UPDATE] Updating student profile")
        
        data = request.json
        
        if not profile:
            profile = StudentProfile(user_id=user.id)
            db.session.add(profile)
            db.session.flush()
        
        # Update profile fields
        if 'learning_style' in data:
            profile.learning_style = data['learning_style']
        if 'preferred_subjects' in data:
            profile.preferred_subjects = json.dumps(data['preferred_subjects'])
        if 'skill_level' in data:
            profile.skill_level = data['skill_level']
        if 'learning_goals' in data:
            profile.learning_goals = data['learning_goals']
        if 'available_time' in data:
            profile.available_time = data['available_time']
        if 'preferred_languages' in data:
            profile.preferred_languages = json.dumps(data['preferred_languages'])
        
        db.session.commit()
        
        print("✅ [PROFILE UPDATE] Profile updated successfully")
        
        return jsonify({'message': 'Profile updated successfully'}), 200


@app.route('/api/upload/material', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def upload_material():
    """Upload course material (video, PDF, document, etc.)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        print("\n" + "📤"*35)
        print("📤 MATERIAL UPLOAD ENDPOINT HIT!")
        print("📤"*35)
        
        # Get and validate user
        user_id_str = get_jwt_identity()
        if not user_id_str:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can upload materials'}), 403
        
        # Validate course_id
        course_id = request.form.get('course_id')
        if not course_id:
            return jsonify({'error': 'Course ID is required'}), 400
        
        course_id = int(course_id)
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check ownership
        if course.tutor.user_id != user.id:
            return jsonify({'error': 'Not authorized to upload to this course'}), 403
        
        # Validate file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get material metadata
        material_title = request.form.get('title', file.filename)
        material_type = request.form.get('type', 'document')
        order = int(request.form.get('order', 0))
        duration = request.form.get('duration', 0)
        
        print(f"[UPLOAD] File: {file.filename}")
        print(f"[UPLOAD] Title: {material_title}")
        print(f"[UPLOAD] Type: {material_type}")
        print(f"[UPLOAD] Course ID: {course_id}")
        
        # Validate file type
        allowed_extensions = {
            'video': {'mp4', 'mov', 'avi', 'mkv', 'webm'},
            'document': {'pdf', 'doc', 'docx', 'txt'},
            'presentation': {'ppt', 'pptx'},
            'image': {'jpg', 'jpeg', 'png', 'gif', 'svg'},
            'audio': {'mp3', 'wav', 'ogg'},
            'archive': {'zip', 'rar'}
        }
        
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        # Check if extension is allowed for the material type
        if material_type in allowed_extensions:
            if file_ext not in allowed_extensions[material_type]:
                return jsonify({
                    'error': f'Invalid file type for {material_type}',
                    'allowed': list(allowed_extensions[material_type])
                }), 400
        
        # Secure filename and create unique name
        filename = secure_filename(file.filename)
        unique_filename = f"{course_id}_{datetime.utcnow().timestamp()}_{filename}"
        
        # Create course materials directory
        materials_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'materials', str(course_id))
        os.makedirs(materials_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(materials_dir, unique_filename)
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        print(f"[UPLOAD] File saved to: {file_path}")
        print(f"[UPLOAD] File size: {file_size} bytes")
        
        # Create database record
        material = CourseMaterial(
            course_id=course_id,
            title=material_title,
            material_type=material_type,
            file_path=file_path,
            file_size=file_size,
            order=order,
            duration=int(duration) if duration else None
        )
        
        db.session.add(material)
        db.session.commit()
        
        print(f"✅ [UPLOAD] Material uploaded successfully with ID: {material.id}")
        print("📤"*35 + "\n")
        
        return jsonify({
            'message': 'Material uploaded successfully',
            'material': {
                'id': material.id,
                'course_id': course_id,
                'title': material.title,
                'type': material.material_type,
                'file_size': material.file_size,
                'order': material.order,
                'duration': material.duration,
                'created_at': material.created_at.isoformat()
            }
        }), 201
        
    except ValueError as e:
        print(f"❌ [UPLOAD ERROR] Validation error: {str(e)}")
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ [UPLOAD ERROR] Exception: {str(e)}")
        import traceback
        print(traceback.format_exc())
        print("📤"*35 + "\n")
        
        return jsonify({
            'error': 'Failed to upload material',
            'details': str(e)
        }), 500


@app.route('/api/courses/<int:course_id>/materials', methods=['GET'])
def get_course_materials(course_id):
    """Get all materials for a course"""
    try:
        print(f"\n[MATERIALS] Fetching materials for course {course_id}")
        
        course = Course.query.get(course_id)
        
        if not course:
            print(f"[MATERIALS] Course {course_id} not found")
            return jsonify({'error': 'Course not found'}), 404
        
        materials = CourseMaterial.query.filter_by(course_id=course_id).order_by(CourseMaterial.order).all()
        
        print(f"[MATERIALS] Found {len(materials)} materials")
        
        materials_list = []
        for material in materials:
            material_data = {
                'id': material.id,
                'title': material.title,
                'type': material.material_type,
                'file_size': material.file_size,
                'order': material.order,
                'duration': material.duration,
                'created_at': material.created_at.isoformat()
            }
            materials_list.append(material_data)
            print(f"[MATERIALS] - {material.title} ({material.material_type})")
        
        response_data = {
            'course_id': course_id,
            'materials': materials_list,
            'total': len(materials_list)
        }
        
        print(f"[MATERIALS] Returning {len(materials_list)} materials\n")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to get materials: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to retrieve materials'}), 500
#================
# OFFLINE DOWNLOAD ENDPOINTS
# ============================================================================

@app.route('/api/courses/<int:course_id>/download', methods=['POST'])
@jwt_required()
def download_course_for_offline(course_id):
    """Record course download for offline access"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.user_type != 'student':
            return jsonify({'error': 'Only students can download courses'}), 403
        
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        if not course.offline_available:
            return jsonify({'error': 'This course is not available for offline download'}), 400
        
        # Check if student is enrolled
        enrollment = Enrollment.query.filter_by(student_id=user_id, course_id=course_id).first()
        
        if not enrollment:
            return jsonify({'error': 'You must be enrolled in this course to download it'}), 403
        
        # Check if already downloaded
        existing_download = OfflineDownload.query.filter_by(
            user_id=user_id,
            course_id=course_id
        ).first()
        
        if existing_download:
            # Update expiration date
            existing_download.expires_at = datetime.utcnow() + timedelta(days=30)
            db.session.commit()
            
            return jsonify({
                'message': 'Course download refreshed',
                'expires_at': existing_download.expires_at.isoformat()
            }), 200
        
        # Create new download record
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        download = OfflineDownload(
            user_id=user_id,
            course_id=course_id,
            expires_at=expires_at
        )
        
        db.session.add(download)
        db.session.commit()
        
        print(f"✅ [DOWNLOAD] Course {course_id} downloaded by user {user_id}")
        
        return jsonify({
            'message': 'Course downloaded for offline access',
            'course_id': course_id,
            'expires_at': expires_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ [DOWNLOAD ERROR] {str(e)}")
        return jsonify({'error': 'Failed to download course'}), 500


@app.route('/api/student/downloads', methods=['GET'])
@jwt_required()
def get_user_downloads():
    """Get all offline downloads for the user"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        
        print(f"\n[DOWNLOADS] Fetching downloads for user {user_id}")
        
        downloads = OfflineDownload.query.filter_by(user_id=user_id).all()
        
        print(f"[DOWNLOADS] Found {len(downloads)} downloads")
        
        downloads_list = []
        for download in downloads:
            course = Course.query.get(download.course_id)
            
            if not course:
                print(f"[DOWNLOADS] Warning: Course {download.course_id} not found")
                continue
            
            # Check if expired
            is_expired = download.expires_at and download.expires_at < datetime.utcnow()
            
            downloads_list.append({
                'id': download.id,
                'course_id': course.id,
                'course_title': course.title,
                'downloaded_at': download.downloaded_at.isoformat(),
                'expires_at': download.expires_at.isoformat() if download.expires_at else None,
                'is_expired': is_expired
            })
            
            print(f"[DOWNLOADS] Added: {course.title} (expired: {is_expired})")
        
        print(f"[DOWNLOADS] Returning {len(downloads_list)} downloads\n")
        
        return jsonify({
            'downloads': downloads_list,
            'total': len(downloads_list)
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to get downloads: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to retrieve downloads'}), 500
@app.route('/api/courses/<int:course_id>/download', methods=['DELETE'])
@jwt_required()
def remove_offline_download(course_id):
    """Remove offline download record"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        
        download = OfflineDownload.query.filter_by(
            user_id=user_id,
            course_id=course_id
        ).first()
        
        if not download:
            return jsonify({'error': 'Download not found'}), 404
        
        db.session.delete(download)
        db.session.commit()
        
        return jsonify({'message': 'Offline download removed'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to remove download: {str(e)}")
        return jsonify({'error': 'Failed to remove download'}), 500


# ============================================================================
# COURSE ENDPOINTS
# ============================================================================




@app.route('/api/materials/<int:material_id>', methods=['DELETE'])
@jwt_required()
def delete_material(material_id):
    """Delete a course material"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can delete materials'}), 403
        
        material = CourseMaterial.query.get(material_id)
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        # Check ownership
        if material.course.tutor.user_id != user.id:
            return jsonify({'error': 'Not authorized to delete this material'}), 403
        
        # Delete file from filesystem
        if os.path.exists(material.file_path):
            os.remove(material.file_path)
        
        # Delete database record
        db.session.delete(material)
        db.session.commit()
        
        return jsonify({'message': 'Material deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to delete material: {str(e)}")
        return jsonify({'error': 'Failed to delete material'}), 500


@app.route('/api/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    """Update course details"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can update courses'}), 403
        
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check ownership
        if course.tutor.user_id != user.id:
            return jsonify({'error': 'Not authorized to update this course'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            course.title = data['title'].strip()
        if 'description' in data:
            course.description = data['description'].strip()
        if 'category' in data:
            course.category = data['category']
        if 'level' in data:
            course.level = data['level']
        if 'duration' in data:
            course.duration = data['duration']
        if 'price' in data:
            course.price = float(data['price'])
        if 'offline_available' in data:
            course.offline_available = data['offline_available']
        if 'published' in data:
            course.published = data['published']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Course updated successfully',
            'course': {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'category': course.category,
                'level': course.level,
                'duration': course.duration,
                'price': course.price,
                'offline_available': course.offline_available,
                'published': course.published
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to update course: {str(e)}")
        return jsonify({'error': 'Failed to update course'}), 500


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    """Delete a course and all its materials"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can delete courses'}), 403
        
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check ownership
        if course.tutor.user_id != user.id:
            return jsonify({'error': 'Not authorized to delete this course'}), 403
        
        # Delete all course materials (files and database records)
        materials = CourseMaterial.query.filter_by(course_id=course_id).all()
        for material in materials:
            if os.path.exists(material.file_path):
                os.remove(material.file_path)
        
        # Delete course materials directory
        materials_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'materials', str(course_id))
        if os.path.exists(materials_dir):
            import shutil
            shutil.rmtree(materials_dir)
        
        # Delete course (cascade will delete materials and enrollments)
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({'message': 'Course deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to delete course: {str(e)}")
        return jsonify({'error': 'Failed to delete course'}), 500

# Add these routes AFTER get_course_materials function

@app.route('/api/materials/<int:material_id>/stream', methods=['GET', 'OPTIONS'])
def stream_material(material_id):
    """Stream video/audio/document file"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        print(f"\n{'='*70}")
        print(f"[STREAM] Streaming material ID: {material_id}")
        print(f"{'='*70}")
        
        material = CourseMaterial.query.get(material_id)
        
        if not material:
            print(f"[STREAM ERROR] Material {material_id} not found in database")
            return jsonify({'error': 'Material not found'}), 404
        
        print(f"[STREAM] Material found: {material.title}")
        print(f"[STREAM] File path: {material.file_path}")
        
        # Make sure path is absolute
        file_path = material.file_path
        if not os.path.isabs(file_path):
            file_path = os.path.join(os.getcwd(), file_path)
            print(f"[STREAM] Converted to absolute path: {file_path}")
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"[STREAM ERROR] File not found on disk: {file_path}")
            return jsonify({'error': 'File not found on server'}), 404
        
        print(f"[STREAM] File exists! Size: {os.path.getsize(file_path)} bytes")
        
        # Get file extension to determine mime type
        file_ext = file_path.rsplit('.', 1)[1].lower() if '.' in file_path else ''
        print(f"[STREAM] File extension: {file_ext}")
        
        mime_types = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif'
        }
        
        mimetype = mime_types.get(file_ext, 'application/octet-stream')
        print(f"[STREAM] MIME type: {mimetype}")
        
        print(f"[STREAM] Sending file...")
        
        response = send_file(
            file_path,
            mimetype=mimetype,
            as_attachment=False
        )
        
        # Add CORS headers
        
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        print(f"✅ [STREAM] File sent successfully!")
        print(f"{'='*70}\n")
        
        return response
        
    except Exception as e:
        print(f"❌ [STREAM ERROR] Exception: {str(e)}")
        import traceback
        print(traceback.format_exc())
        print(f"{'='*70}\n")
        return jsonify({'error': 'Failed to stream material', 'details': str(e)}), 500


@app.route('/api/materials/<int:material_id>/download', methods=['GET', 'OPTIONS'])
def download_material(material_id):
    """Download material file"""
    
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        
        return response
    
    try:
        print(f"\n[DOWNLOAD] Downloading material ID: {material_id}")
        
        material = CourseMaterial.query.get(material_id)
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        # Make sure path is absolute
        file_path = material.file_path
        if not os.path.isabs(file_path):
            file_path = os.path.join(os.getcwd(), file_path)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found on server'}), 404
        
        file_ext = file_path.rsplit('.', 1)[1] if '.' in file_path else 'file'
        
        response = send_file(
            file_path,
            as_attachment=True,
            download_name=f"{material.title}.{file_ext}"
        )
        
        
        
        print(f"✅ [DOWNLOAD] File sent successfully")
        
        return response
        
    except Exception as e:
        print(f"❌ [DOWNLOAD ERROR] {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to download material'}), 500
@app.route('/api/tutor/courses', methods=['GET'])
@jwt_required()
def get_tutor_courses():
    """Get all courses created by the tutor"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can access this endpoint'}), 403
        
        tutor_profile = user.tutor_profile
        if not tutor_profile:
            return jsonify({'courses': []}), 200
        
        courses = Course.query.filter_by(tutor_id=tutor_profile.id).all()
        
        courses_list = []
        for course in courses:
            material_count = CourseMaterial.query.filter_by(course_id=course.id).count()
            
            courses_list.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'category': course.category,
                'level': course.level,
                'duration': course.duration,
                'price': course.price,
                'rating': course.rating,
                'total_students': course.total_students,
                'offline_available': course.offline_available,
                'published': course.published,
                'material_count': material_count,
                'created_at': course.created_at.isoformat()
            })
        
        return jsonify({
            'courses': courses_list,
            'total': len(courses_list)
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to get tutor courses: {str(e)}")
        return jsonify({'error': 'Failed to retrieve courses'}), 500
# ============================================================================
# TUTOR ENDPOINTS
# ============================================================================

@app.route('/api/tutor/profile', methods=['GET'])
@jwt_required()
def get_tutor_profile():
    """Get tutor profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.user_type != 'tutor':
        return jsonify({'error': 'Not authorized'}), 403
    
    profile = user.tutor_profile
    
    if not profile:
        return jsonify({'profile': None}), 200
    
    return jsonify({
        'profile': {
            'id': profile.id,
            'expertise': json.loads(profile.expertise or '[]'),
            'bio': profile.bio,
            'hourly_rate': profile.hourly_rate,
            'rating': profile.rating,
            'total_sessions': profile.total_sessions,
            'languages': json.loads(profile.languages or '[]'),
            'availability': json.loads(profile.availability or '{}'),
            'verified': profile.verified
        }
    }), 200

@app.route('/api/tutor/profile', methods=['PUT'])
@jwt_required()
def update_tutor_profile():
    """Update tutor profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.user_type != 'tutor':
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.json
    
    profile = user.tutor_profile
    if not profile:
        profile = TutorProfile(user_id=user.id)
        db.session.add(profile)
    
    # Update profile fields
    if 'expertise' in data:
        profile.expertise = json.dumps(data['expertise'])
    if 'bio' in data:
        profile.bio = data['bio']
    if 'hourly_rate' in data:
        profile.hourly_rate = data['hourly_rate']
    if 'languages' in data:
        profile.languages = json.dumps(data['languages'])
    if 'availability' in data:
        profile.availability = json.dumps(data['availability'])
    
    db.session.commit()
    
    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/tutors', methods=['GET'])
def get_all_tutors():
    """Get all verified tutors"""
    tutors = TutorProfile.query.filter_by(verified=True).all()
    
    tutors_list = []
    for tutor in tutors:
        # Add safety check and load user explicitly
        user = User.query.get(tutor.user_id) if tutor.user_id else None
        
        tutors_list.append({
            'id': tutor.id,
            'user_id': tutor.user_id,  # Add this for debugging
            'name': user.full_name if user else 'Unknown',
            'expertise': json.loads(tutor.expertise or '[]'),
            'bio': tutor.bio,
            'hourly_rate': tutor.hourly_rate,
            'rating': tutor.rating,
            'total_sessions': tutor.total_sessions,
            'languages': json.loads(tutor.languages or '[]'),
            'verified': tutor.verified
        })
    
    return jsonify({'tutors': tutors_list}), 200

# ============================================================================
# COURSE ENDPOINTS
# ============================================================================

@app.route('/api/courses', methods=['GET'])
def get_courses():
    """Get all published courses"""
    courses = Course.query.filter_by(published=True).all()
    
    courses_list = []
    for course in courses:
        tutor_name = course.tutor.user.full_name if course.tutor else 'Unknown'
        courses_list.append({
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'category': course.category,
            'level': course.level,
            'duration': course.duration,
            'price': course.price,
            'rating': course.rating,
            'total_students': course.total_students,
            'tutor_name': tutor_name,
            'offline_available': course.offline_available
        })
    
    return jsonify({'courses': courses_list}), 200


@app.route('/api/courses/<int:course_id>/generate-certificates', methods=['POST'])
@jwt_required()
def generate_certificates_for_course(course_id):
    """Generate certificates for all students who completed a course"""
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can generate certificates'}), 403
        
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check ownership
        if course.tutor.user_id != user.id:
            return jsonify({'error': 'Not authorized'}), 403
        
        # Get all completed enrollments
        completed_enrollments = Enrollment.query.filter_by(
            course_id=course_id,
            completed=True,
            certificate_issued=False
        ).all()
        
        certificates_generated = []
        
        for enrollment in completed_enrollments:
            # Generate certificate PDF
            cert_id = f"CERT-{course_id}-{enrollment.student_id}-{datetime.utcnow().timestamp()}"
            
            # Mark as issued
            enrollment.certificate_issued = True
            
            certificates_generated.append({
                'student_name': enrollment.student.full_name,
                'certificate_id': cert_id
            })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Generated {len(certificates_generated)} certificates',
            'certificates': certificates_generated
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[CERT ERROR] {str(e)}")
        return jsonify({'error': 'Failed to generate certificates'}), 500


@app.route('/api/certificates/<certificate_id>/download', methods=['GET'])
@jwt_required()
def download_certificate(certificate_id):
    """Download a certificate PDF"""
    try:
        # Create PDF in memory
        buffer = io.BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Heading1'],
            fontSize=36,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        story.append(Paragraph("Certificate of Completion", title_style))
        story.append(Spacer(1, 0.5*inch))
        
        # Student name (you'd get this from database)
        story.append(Paragraph("This certifies that", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph("<b>Student Name</b>", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Course name
        story.append(Paragraph("has successfully completed", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph("<b>Course Title</b>", title_style))
        
        # Build PDF
        doc.build(story)
        
        # Return PDF
        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{certificate_id}.pdf'
        )
        
    except Exception as e:
        print(f"[CERT DOWNLOAD ERROR] {str(e)}")
        return jsonify({'error': 'Failed to download certificate'}), 500
@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Get single course details"""
    course = Course.query.get(course_id)
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    tutor_name = course.tutor.user.full_name if course.tutor else 'Unknown'
    
    return jsonify({
        'course': {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'category': course.category,
            'level': course.level,
            'duration': course.duration,
            'price': course.price,
            'rating': course.rating,
            'total_students': course.total_students,
            'tutor_name': tutor_name,
            'offline_available': course.offline_available,
            'created_at': course.created_at.isoformat()
        }
    }), 200

@app.route('/api/courses/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_in_course(course_id):
    """Enroll student in a course"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.user_type != 'student':
        return jsonify({'error': 'Only students can enroll'}), 403
    
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Check if already enrolled
    existing = Enrollment.query.filter_by(
        student_id=user_id,
        course_id=course_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Already enrolled'}), 400
    
    enrollment = Enrollment(
        student_id=user_id,
        course_id=course_id
    )
    
    course.total_students += 1
    
    db.session.add(enrollment)
    db.session.commit()
    
    return jsonify({'message': 'Enrolled successfully'}), 201
@app.route('/api/debug/tutors', methods=['GET'])
def debug_tutors():
    """Debug endpoint to check tutor-user relationships"""
    tutors = TutorProfile.query.all()
    
    debug_info = []
    for tutor in tutors:
        user = User.query.get(tutor.user_id) if tutor.user_id else None
        debug_info.append({
            'tutor_id': tutor.id,
            'user_id': tutor.user_id,
            'user_exists': user is not None,
            'user_name': user.full_name if user else 'NO USER',
            'verified': tutor.verified
        })
    
    return jsonify({'tutors': debug_info}), 200
@app.route('/api/courses/create', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def create_course():
    """Create a new course (tutor only)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        print("\n" + "📚"*35)
        print("📚 COURSE CREATION ENDPOINT HIT!")
        print("📚"*35)
        
        # Get and validate user
        user_id_str = get_jwt_identity()
        if not user_id_str:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = int(user_id_str)
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.user_type != 'tutor':
            return jsonify({'error': 'Only tutors can create courses'}), 403
        
        # Get tutor profile
        tutor_profile = user.tutor_profile
        if not tutor_profile:
            return jsonify({'error': 'Tutor profile not found'}), 404
        
        print(f"[COURSE] Creating course for tutor: {user.full_name} (ID: {tutor_profile.id})")
        
        # Get request data
        data = request.get_json()
        print(f"[COURSE] Received data: {json.dumps(data, indent=2)}")
        
        # Validate required fields
        required_fields = ['title', 'description', 'category', 'level']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing_fields
            }), 400
        
        # Create course
        course = Course(
            tutor_id=tutor_profile.id,
            title=data['title'].strip(),
            description=data['description'].strip(),
            category=data['category'],
            level=data['level'],
            duration=data.get('duration', ''),
            price=float(data.get('price', 0.0)),
            offline_available=data.get('offline_available', False),
            published=data.get('published', False)
        )
        
        db.session.add(course)
        db.session.commit()
        
        print(f"✅ [COURSE] Course created successfully with ID: {course.id}")
        print("📚"*35 + "\n")
        
        return jsonify({
            'message': 'Course created successfully',
            'course': {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'category': course.category,
                'level': course.level,
                'duration': course.duration,
                'price': course.price,
                'offline_available': course.offline_available,
                'published': course.published,
                'created_at': course.created_at.isoformat()
            }
        }), 201
        
    except ValueError as e:
        print(f"❌ [COURSE ERROR] Validation error: {str(e)}")
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ [COURSE ERROR] Exception: {str(e)}")
        import traceback
        print(traceback.format_exc())
        print("📚"*35 + "\n")
        
        return jsonify({
            'error': 'Failed to create course',
            'details': str(e)
        }), 500
@app.route('/api/debug/users-and-tutors', methods=['GET'])
def debug_users_and_tutors():
    """Comprehensive debug endpoint"""
    try:
        # Get all users
        all_users = User.query.all()
        users_info = []
        for user in all_users:
            users_info.append({
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'user_type': user.user_type,
                'has_tutor_profile': user.tutor_profile is not None,
                'has_student_profile': user.student_profile is not None,
                'tutor_profile_id': user.tutor_profile.id if user.tutor_profile else None,
                'student_profile_id': user.student_profile.id if user.student_profile else None
            })
        
        # Get all tutor profiles
        all_tutors = TutorProfile.query.all()
        tutors_info = []
        for tutor in all_tutors:
            # Try to get user through relationship
            user_via_relationship = tutor.user
            # Try to get user directly
            user_via_query = User.query.get(tutor.user_id) if tutor.user_id else None
            
            tutors_info.append({
                'tutor_profile_id': tutor.id,
                'user_id_field': tutor.user_id,
                'verified': tutor.verified,
                'user_via_relationship': {
                    'exists': user_via_relationship is not None,
                    'id': user_via_relationship.id if user_via_relationship else None,
                    'name': user_via_relationship.full_name if user_via_relationship else None
                },
                'user_via_query': {
                    'exists': user_via_query is not None,
                    'id': user_via_query.id if user_via_query else None,
                    'name': user_via_query.full_name if user_via_query else None
                }
            })
        
        return jsonify({
            'users': users_info,
            'tutors': tutors_info,
            'total_users': len(users_info),
            'total_tutors': len(tutors_info)
        }), 200
        
    except Exception as e:
        print(f"[DEBUG ERROR] {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/api/debug/user/<int:user_id>', methods=['GET'])
def debug_get_user(user_id):
    """Check if a specific user exists"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'exists': False,
                'message': f'User {user_id} does not exist',
                'user_id': user_id
            }), 404
        
        return jsonify({
            'exists': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'user_type': user.user_type,
                'has_tutor_profile': user.tutor_profile is not None,
                'has_student_profile': user.student_profile is not None,
                'tutor_profile_id': user.tutor_profile.id if user.tutor_profile else None,
                'student_profile_id': user.student_profile.id if user.student_profile else None
            }
        }), 200
        
    except Exception as e:
        print(f"[DEBUG ERROR] {str(e)}")
        return jsonify({'error': str(e)}), 500
# ============================================================================
# INITIALIZE DATABASE
# ============================================================================

with app.app_context():
    db.create_all()

if __name__ == '__main__':
   
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)
