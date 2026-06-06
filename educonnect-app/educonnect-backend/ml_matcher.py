import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import json
from datetime import datetime
from collections import defaultdict
import pickle

class RLTutorMatchingSystem:
    """
    Reinforcement Learning-Enhanced Tutor Matching System
    
    Key RL Improvements:
    - Q-Learning for feature weight optimization
    - Contextual bandits for exploration vs exploitation
    - Outcome-based learning from student feedback
    - Dynamic tutor scoring based on historical performance
    - Personalized matching that improves over time
    """
    
    def __init__(self, learning_rate=0.1, discount_factor=0.9, epsilon=0.15):
        self.scaler = StandardScaler()
        
        # RL Parameters
        self.learning_rate = learning_rate  # How fast we learn from feedback
        self.discount_factor = discount_factor  # Future reward importance
        self.epsilon = epsilon  # Exploration rate (15% try new things)
        
        # Base feature weights (will be adjusted by RL)
        self.base_weights = {
            'subject_match': 0.35,
            'skill_compatibility': 0.25,
            'schedule_match': 0.15,
            'language_match': 0.12,
            'learning_style_match': 0.08,
            'rating': 0.05
        }
        
        # RL Components
        self.q_table = defaultdict(lambda: defaultdict(float))  # State-action values
        self.tutor_performance = defaultdict(lambda: {
            'total_matches': 0,
            'successful_matches': 0,
            'avg_satisfaction': 0.0,
            'completion_rate': 0.0,
            'student_retention': 0.0,
            'response_time_score': 1.0,
            'reliability_score': 1.0
        })
        
        # Personalized student preferences (learned over time)
        self.student_preferences = defaultdict(lambda: {
            'weight_adjustments': {},
            'preferred_tutor_traits': {},
            'match_history': [],
            'satisfaction_history': []
        })
        
        # Feature importance learning
        self.feature_rewards = defaultdict(list)
        
        # Subject similarity mappings
        self.subject_groups = {
            'math': ['mathematics', 'algebra', 'calculus', 'geometry', 'statistics', 'trigonometry'],
            'science': ['physics', 'chemistry', 'biology', 'science'],
            'programming': ['computer science', 'programming', 'coding', 'web development', 'python', 'javascript'],
            'language': ['english', 'writing', 'literature', 'grammar', 'composition'],
            'arts': ['art', 'music', 'drawing', 'painting', 'design']
        }
    
    def get_state_representation(self, student_profile, tutor_profile):
        """
        Convert student-tutor pair into a state representation for RL
        """
        student_features = self.prepare_student_features(student_profile)
        tutor_features = self.prepare_tutor_features(tutor_profile)
        
        # Create a hashable state key
        state = (
            tuple(sorted(student_features['preferred_subjects'])),
            student_features['skill_level'],
            student_features['learning_style'],
            student_features['available_time'],
            tuple(sorted(tutor_features['expertise'])),
            tutor_features['teaching_style'],
            'experienced' if tutor_features['total_sessions'] > 100 else 'new'
        )
        
        return state
    def calculate_missing_penalty(self, tutor_profile, tutor_id):
        """
        Each absent critical field subtracts a fixed amount.
        Penalties stack — a tutor missing 3 fields can lose 0.19 points
        before confidence is even applied.
        """
        penalty = 0.0
        perf = self.tutor_performance[tutor_id]
    
        if tutor_profile.get('rating') is None:
            penalty += 0.08   # No rating: significant unknown
    
        if not tutor_profile.get('availability'):
            penalty += 0.06   # Unavailable or unspecified
    
        if not tutor_profile.get('expertise'):
            penalty += 0.10   # No subject data: near-disqualifying
    
        if not tutor_profile.get('languages'):
            penalty += 0.04   # Minor but real
    
        if perf['total_matches'] == 0:
            penalty += 0.05   # No history: extra cold-start tax

        return penalty
    def calculate_confidence(self, tutor_id, tutor_profile):
        """
        Confidence reflects how much we can trust a tutor's score.
        Three sub-components, each 0–1, combined with fixed weights.
        """
        perf = self.tutor_performance[tutor_id]
        n_matches  = perf['total_matches']
        n_ratings  = perf.get('n_ratings', 0)
    
        # Sub-component 1: match volume (saturates at 20 matches)
        match_conf = min(1.0, n_matches / 20)
    
        # Sub-component 2: feedback volume (saturates at 10 ratings)
        feedback_conf = min(1.0, n_ratings / 10)
    
        # Sub-component 3: feature completeness
        tutor_features = self.prepare_tutor_features(tutor_profile)
        present = sum([
            bool(tutor_features['expertise']),
            bool(tutor_features['availability']),
            bool(tutor_features['languages']),
            tutor_profile.get('rating') is not None,
            n_matches > 0,
        ])
        feature_completeness = present / 5.0
    
        confidence = (
            0.40 * match_conf +
            0.40 * feedback_conf +
            0.20 * feature_completeness
        )
        return confidence

    def calculate_rl_gate(self, tutor_id):
        """
        RL only contributes once sufficient real data exists.
        Gate = 0 means RL adds nothing. Gate = 1 means full RL weight.
        Requires at least 10 matches AND 5 ratings before RL kicks in.
        """
        perf = self.tutor_performance[tutor_id]
        n_matches = perf['total_matches']
        n_ratings = perf.get('n_ratings', 0)
    
        match_gate    = min(1.0, n_matches / 10)
        feedback_gate = min(1.0, n_ratings / 5)
    
        return match_gate * feedback_gate  # Both must ramp up together
    
    def calculate_tutor_performance_score(self, tutor_id):
        """
        Calculate dynamic performance score based on historical data
        This is what differentiates tutors beyond static features
        """
        perf = self.tutor_performance[tutor_id]
        
        if perf['total_matches'] == 0:
            return 0.7  # Neutral score for new tutors
        
        # Multiple factors contribute to performance
        success_rate = perf['successful_matches'] / max(perf['total_matches'], 1)
        satisfaction = perf['avg_satisfaction']
        completion = perf['completion_rate']
        retention = perf['student_retention']
        response = perf['response_time_score']
        reliability = perf['reliability_score']
        
        # Weighted combination of performance metrics
        performance_score = (
            0.25 * success_rate +           # How often matches work out
            0.20 * satisfaction +            # Student satisfaction ratings
            0.20 * completion +              # Course completion rate
            0.15 * retention +               # Student comes back for more
            0.10 * response +                # Fast response to messages
            0.10 * reliability               # Shows up on time, consistent
        )
        
        # Apply confidence based on sample size
        confidence = min(1.0, perf['total_matches'] / 20)
        
        # Blend with neutral score based on confidence
        final_score = confidence * performance_score + (1 - confidence) * 0.7
        
        return final_score
    
    def get_personalized_weights(self, student_id, base_weights):
        """
        Get personalized feature weights for a student based on their history
        """
        if student_id not in self.student_preferences:
            return base_weights
        
        prefs = self.student_preferences[student_id]
        
        # If student has enough history, use learned weights
        if len(prefs['match_history']) >= 3:
            adjusted_weights = base_weights.copy()
            
            for feature, adjustment in prefs['weight_adjustments'].items():
                if feature in adjusted_weights:
                    adjusted_weights[feature] *= (1 + adjustment)
            
            # Normalize
            total = sum(adjusted_weights.values())
            return {k: v / total for k, v in adjusted_weights.items()}
        
        return base_weights
    
    def select_action_epsilon_greedy(self, state, available_tutors):
        """
        Epsilon-greedy action selection: balance exploration vs exploitation
        """
        if np.random.random() < self.epsilon:
            # Explore: randomly select a tutor
            return np.random.choice(available_tutors)
        else:
            # Exploit: select best tutor based on Q-values
            q_values = {tutor: self.q_table[state][tutor] for tutor in available_tutors}
            return max(q_values, key=q_values.get)
    
    def update_q_value(self, state, action, reward, next_state):
        """
        Update Q-table using Q-learning algorithm
        """
        current_q = self.q_table[state][action]
        
        # Get max Q-value for next state
        max_next_q = max(self.q_table[next_state].values()) if self.q_table[next_state] else 0
        
        # Q-learning update rule
        new_q = current_q + self.learning_rate * (
            reward + self.discount_factor * max_next_q - current_q
        )
        
        self.q_table[state][action] = new_q
    
    def record_match_outcome(self, student_id, tutor_id, student_profile, 
                            tutor_profile, outcome_data):
        """
        Learn from match outcomes to improve future recommendations
        
        outcome_data should contain:
        - satisfaction_rating: 1-5 stars
        - completed: bool (did they complete the course/session)
        - would_recommend: bool
        - response_time: average response time in hours
        - punctuality_score: 0-1 (showed up on time)
        """
        # Calculate reward based on outcome
        satisfaction = outcome_data.get('satisfaction_rating', 3) / 5.0
        completed = 1.0 if outcome_data.get('completed', False) else 0.0
        recommend = 1.0 if outcome_data.get('would_recommend', False) else 0.0
        
        # Overall reward (0 to 1)
        reward = 0.4 * satisfaction + 0.3 * completed + 0.3 * recommend
        
        # Update tutor performance metrics
        perf = self.tutor_performance[tutor_id]
        perf['total_matches'] += 1
        
        if reward > 0.6:  # Consider it successful
            perf['successful_matches'] += 1
        
        # Running average of satisfaction
        n = perf['total_matches']
        perf['avg_satisfaction'] = (
            (perf['avg_satisfaction'] * (n - 1) + satisfaction) / n
        )
        
        # Update completion rate
        perf['completion_rate'] = (
            (perf['completion_rate'] * (n - 1) + completed) / n
        )
        
        # Update response time score
        if 'response_time' in outcome_data:
            response_hours = outcome_data['response_time']
            # Excellent: <2h, Good: <6h, OK: <24h, Poor: >24h
            response_score = max(0, 1 - (response_hours / 24))
            perf['response_time_score'] = (
                (perf['response_time_score'] * (n - 1) + response_score) / n
            )
        
        # Update reliability score
        if 'punctuality_score' in outcome_data:
            perf['reliability_score'] = (
                (perf['reliability_score'] * (n - 1) + 
                 outcome_data['punctuality_score']) / n
            )
        
        # Update Q-table
        state = self.get_state_representation(student_profile, tutor_profile)
        self.update_q_value(state, tutor_id, reward, state)
        
        # Update student preferences
        prefs = self.student_preferences[student_id]
        prefs['match_history'].append({
            'tutor_id': tutor_id,
            'reward': reward,
            'timestamp': datetime.now().isoformat()
        })
        prefs['satisfaction_history'].append(satisfaction)
        
        # Learn which features matter most for this student
        self._update_feature_importance(student_id, student_profile, 
                                       tutor_profile, reward)
        
        return reward
    
    def _update_feature_importance(self, student_id, student_profile, 
                                   tutor_profile, reward):
        """
        Learn which features lead to better outcomes for each student
        """
        prefs = self.student_preferences[student_id]
        
        # Calculate how well each feature matched
        student_features = self.prepare_student_features(student_profile)
        tutor_features = self.prepare_tutor_features(tutor_profile)
        
        feature_scores = {
            'subject_match': self.calculate_subject_match(
                student_features['preferred_subjects'],
                tutor_features['expertise']
            ),
            'skill_compatibility': self.calculate_skill_compatibility(
                student_features,
                tutor_features['total_sessions'],
                student_features['skill_level']
            ),
            'schedule_match': self.calculate_schedule_match(
                student_features['available_time'],
                tutor_features['availability']
            ),
            'language_match': self.calculate_language_match(
                student_features['preferred_languages'],
                tutor_features['languages']
            ),
            'learning_style_match': self.calculate_learning_style_match(
                student_features['learning_style'],
                tutor_features['teaching_style']
            ),
            'gender_match': self.calculate_gender_match(
                student_features.get('tutor_gender_preference', 'no_preference'),
                tutor_features.get('gender', '')
            ),
        }
        
        # Update weight adjustments based on correlation with reward
        for feature, score in feature_scores.items():
            self.feature_rewards[f"{student_id}_{feature}"].append({
                'score': score,
                'reward': reward
            })
            
            # If we have enough data, adjust weights
            history = self.feature_rewards[f"{student_id}_{feature}"]
            if len(history) >= 5:
                # Calculate correlation between feature score and reward
                scores = [h['score'] for h in history[-10:]]
                rewards = [h['reward'] for h in history[-10:]]
                
                correlation = np.corrcoef(scores, rewards)[0, 1]
                
                # Adjust weight based on correlation
                if not np.isnan(correlation):
                    # Positive correlation: increase weight
                    # Negative correlation: decrease weight
                    adjustment = correlation * 0.2  # Max 20% adjustment
                    prefs['weight_adjustments'][feature] = adjustment
    
    def prepare_student_features(self, student_profile):
        """Enhanced student feature extraction with None safety"""
        features = {
            'math_score': max(1, min(10, student_profile.get('math_score', 5) or 5)),
            'science_score': max(1, min(10, student_profile.get('science_score', 5) or 5)),
            'language_score': max(1, min(10, student_profile.get('language_score', 5) or 5)),
            'tech_score': max(1, min(10, student_profile.get('tech_score', 5) or 5)),
            'motivation_level': max(1, min(10, student_profile.get('motivation_level', 7) or 7)),
            'learning_style': (student_profile.get('learning_style') or 'visual').lower(),
            'preferred_subjects': [
                s.lower().strip() 
                for s in (student_profile.get('preferred_subjects') or []) 
                if s
            ],
            'skill_level': (student_profile.get('skill_level') or 'beginner').lower(),
            'available_time': (student_profile.get('available_time') or 'evening').lower(),
            'preferred_languages': [
                l.lower().strip() 
                for l in (student_profile.get('preferred_languages') or ['english']) 
                if l
            ],
            'selected_goals': [
                g.lower().strip()
                for g in (student_profile.get('selected_goals') or [])
                if g
        ],
        'tutor_gender_preference': (
            student_profile.get('tutor_gender_preference') or 'no_preference'
        ).lower(),
        }
        return features
        
    def calculate_gender_match(self, student_preference, tutor_gender):
        """Return 1.0 if no preference or match, 0.0 if mismatch"""
        if not student_preference or student_preference == 'no_preference':
            return 1.0
        tutor_gender = (tutor_gender or '').lower().strip()
        if not tutor_gender:
            return 0.8  # tutor gender unknown, slight penalty
        return 1.0 if student_preference == tutor_gender else 0.0
    
    def prepare_tutor_features(self, tutor_profile):
        """Enhanced tutor feature extraction with None safety"""
        features = {
            'expertise': [
                e.lower().strip() 
                for e in (tutor_profile.get('expertise') or []) 
                if e
            ],
            'languages': [
                l.lower().strip() 
                for l in (tutor_profile.get('languages') or ['english']) 
                if l
            ],
            'availability': tutor_profile.get('availability') or {},
            'rating': max(0.0, min(5.0, tutor_profile.get('rating', 4.0) or 4.0)),
            'total_sessions': max(0, tutor_profile.get('total_sessions', 0) or 0),
            'teaching_style': (tutor_profile.get('teaching_style') or 'adaptive').lower(),
            'gender': (tutor_profile.get('gender') or '').lower().strip(),
        }
        return features
    
    def get_subject_category(self, subject):
        """Map subject to category"""
        subject = subject.lower()
        for category, keywords in self.subject_groups.items():
            if subject in keywords or any(keyword in subject for keyword in keywords):
                return category
        return subject
    
    def calculate_subject_match(self, student_subjects, tutor_expertise):
        """Enhanced subject matching with fuzzy matching"""
        if not student_subjects or not tutor_expertise:
            return 0.3
        
        student_subjects = [s.lower() for s in student_subjects]
        tutor_expertise = [e.lower() for e in tutor_expertise]
        
        total_score = 0
        max_possible_score = len(student_subjects)
        
        for student_subject in student_subjects:
            subject_score = 0
            
            if student_subject in tutor_expertise:
                subject_score = 1.0
            else:
                for tutor_subject in tutor_expertise:
                    if student_subject in tutor_subject or tutor_subject in student_subject:
                        subject_score = max(subject_score, 0.8)
                    
                    student_category = self.get_subject_category(student_subject)
                    tutor_category = self.get_subject_category(tutor_subject)
                    if student_category == tutor_category and student_category in self.subject_groups:
                        subject_score = max(subject_score, 0.6)
            
            total_score += subject_score
        
        return total_score / max_possible_score if max_possible_score > 0 else 0.5
    
    def calculate_skill_compatibility(self, student_features, tutor_sessions, student_skill):
        """Multi-factor skill compatibility"""
        avg_score = np.mean([
            student_features.get('math_score', 5),
            student_features.get('science_score', 5),
            student_features.get('language_score', 5),
            student_features.get('tech_score', 5)
        ])
        
        normalized_score = avg_score / 10.0
        
        skill_map = {
            'beginner': 0.2,
            'intermediate': 0.5,
            'advanced': 0.8,
            'expert': 1.0
        }
        skill_value = skill_map.get(student_skill.lower(), 0.5)
        
        student_capability = 0.6 * skill_value + 0.4 * normalized_score
        
        if tutor_sessions > 200:
            compatibility = 0.95
        elif tutor_sessions > 100:
            compatibility = 0.95 if student_capability > 0.4 else 0.80
        elif tutor_sessions > 30:
            compatibility = 0.85
        else:
            compatibility = 0.90 if student_capability < 0.5 else 0.65
        
        motivation = student_features.get('motivation_level', 5) / 10.0
        if motivation > 0.7 and tutor_sessions > 100:
            compatibility = min(1.0, compatibility + 0.05)
        
        return compatibility
    
    def calculate_schedule_match(self, student_time, tutor_availability):
        """Schedule matching"""
        if not tutor_availability or not isinstance(tutor_availability, dict):
            return 0.5
        
        student_time = student_time.lower()
        available_slots = [slot.lower() for slot, available in tutor_availability.items() if available]
        
        if not available_slots:
            return 0.3
        
        if student_time in available_slots:
            return 0.88
        
        adjacent_times = {
            'morning': ['afternoon'],
            'afternoon': ['morning', 'evening'],
            'evening': ['afternoon']
        }
        
        adjacent = adjacent_times.get(student_time, [])
        for slot in available_slots:
            if slot in adjacent:
                return 0.65
        
        return 0.35
    
    def calculate_language_match(self, student_languages, tutor_languages):
        """Language matching"""
        if not student_languages or not tutor_languages:
            return 0.5
        
        student_set = set(l.lower() for l in student_languages)
        tutor_set = set(l.lower() for l in tutor_languages)
        
        common_languages = student_set & tutor_set
        
        if not common_languages:
            return 0.0
        
        overlap_ratio = len(common_languages) / len(student_set)
        
        if overlap_ratio == 1.0 and len(common_languages) > 1:
            return 0.95
        elif overlap_ratio == 1.0:
            return 0.85
        
        return 0.6 + (0.25 * overlap_ratio)
    
    def calculate_learning_style_match(self, student_style, tutor_style):
        """Learning style matching"""
        student_style = student_style.lower()
        tutor_style = tutor_style.lower()
        
        if tutor_style == 'adaptive':
            return 0.90
        
        if student_style == tutor_style:
            return 0.95
        
        compatibility = {
            'visual': {'hands-on': 0.65, 'auditory': 0.45, 'kinesthetic': 0.55},
            'auditory': {'hands-on': 0.55, 'visual': 0.45, 'kinesthetic': 0.45},
            'kinesthetic': {'hands-on': 0.80, 'visual': 0.55, 'auditory': 0.45},
            'hands-on': {'kinesthetic': 0.80, 'visual': 0.65, 'auditory': 0.55}
        }
        
        return compatibility.get(student_style, {}).get(tutor_style, 0.55)
    
    def normalize_rating(self, rating):
        """Rating normalization"""
        normalized = rating / 5.0
        return min(0.92, normalized * 0.90 + 0.02)
        
    def compute_final_score(self, base_score, confidence, rl_gate, rl_score, missing_penalty):
        """
        Final ranking formula:
          final = (base × base_w + rl × rl_w) × conf_weight − penalty
    
        conf_weight has a floor of 0.15 to avoid total collapse for
        feature-complete new tutors; the 0.85 factor caps the ceiling
        below 1.0 unless confidence is genuinely high.
    
        rl_weight shrinks to 0 when rl_gate = 0, so the formula
        degrades gracefully to: base × conf_weight − penalty
        """
        conf_weight = 0.85 * confidence + 0.15  # Range: [0.15, 1.0]
        rl_weight   = 0.30 * rl_gate            # Range: [0.00, 0.30]
        base_weight = 1.0 - rl_weight           # Range: [0.70, 1.00]
    
        raw = (
            base_score * base_weight * conf_weight
            + rl_score * rl_weight * conf_weight
            - missing_penalty
        )
        return float(np.clip(raw, 0.0, 1.0))
    
   def match_student_to_tutors(self, student_id, student_profile, tutors_list, use_rl=True):
        student_features = self.prepare_student_features(student_profile)
        weights = (
            self.get_personalized_weights(student_id, self.base_weights)
            if use_rl and student_id else self.base_weights.copy()
        )
    
        matches = []
    
        for tutor in tutors_list:
            tutor_id      = tutor.get('id')
            tutor_features = self.prepare_tutor_features(tutor)
    
            # Hard filter: gender preference
            gender_pref  = student_features.get('tutor_gender_preference', 'no_preference')
            tutor_gender = tutor_features.get('gender', '')
            if (gender_pref != 'no_preference' and tutor_gender
                    and gender_pref != tutor_gender):
                continue
    
            # --- Feature scores (use 0.1 floor when data absent, not 0.5) ---
            subject_score = self.calculate_subject_match(
                student_features['preferred_subjects'],
                tutor_features['expertise']          # returns 0.1 if either empty
            )
            skill_score = self.calculate_skill_compatibility(
                student_features,
                tutor_features['total_sessions'],
                student_features['skill_level']
            )
            schedule_score = self.calculate_schedule_match(
                student_features['available_time'],
                tutor_features['availability']       # returns 0.2 if dict empty
            )
            language_score = self.calculate_language_match(
                student_features['preferred_languages'],
                tutor_features['languages']
            )
            style_score = self.calculate_learning_style_match(
                student_features['learning_style'],
                tutor_features['teaching_style']
            )
    
            # Rating: use 0.0 when absent, not 4.0
            raw_rating = tutor.get('rating')        # None if not provided
            rating_score = (
                self.normalize_rating(raw_rating)
                if raw_rating is not None else 0.0
            )
    
            base_score = (
                weights['subject_match']        * subject_score  +
                weights['skill_compatibility']  * skill_score    +
                weights['schedule_match']       * schedule_score +
                weights['language_match']       * language_score +
                weights['learning_style_match'] * style_score    +
                weights['rating']               * rating_score
            )
    
            # --- Confidence, RL gate, penalty ---
            confidence      = self.calculate_confidence(tutor_id, tutor)
            rl_gate         = self.calculate_rl_gate(tutor_id) if use_rl else 0.0
            rl_score        = self.calculate_tutor_performance_score(tutor_id)
            missing_penalty = self.calculate_missing_penalty(tutor, tutor_id)
    
            final_score = self.compute_final_score(
                base_score, confidence, rl_gate, rl_score, missing_penalty
            )
    
            matches.append({
                'tutor_id':    tutor_id,
                'tutor_name':  tutor.get('name'),
                'match_score': int(final_score * 100),
                'confidence':  round(confidence, 3),
                'rl_gate':     round(rl_gate, 3),
                'breakdown': {
                    'subject_match':        int(subject_score  * 100),
                    'skill_compatibility':  int(skill_score    * 100),
                    'schedule_match':       int(schedule_score * 100),
                    'language_match':       int(language_score * 100),
                    'learning_style_match': int(style_score    * 100),
                    'rating':               int(rating_score   * 100),
                    'confidence':           int(confidence     * 100),
                    'missing_penalty':      int(missing_penalty * 100),
                    'rl_gate':              int(rl_gate        * 100),
                }
            })
    
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches
    
    def save_model(self, filepath):
        """Save model with RL state"""
        model_data = {
            'base_weights': self.base_weights,
            'subject_groups': self.subject_groups,
            'q_table': dict(self.q_table),
            'tutor_performance': dict(self.tutor_performance),
            'student_preferences': dict(self.student_preferences),
            'feature_rewards': dict(self.feature_rewards),
            'learning_rate': self.learning_rate,
            'discount_factor': self.discount_factor,
            'epsilon': self.epsilon,
            'version': '3.0-RL',
            'last_updated': datetime.now().isoformat()
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"✓ RL Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load model with RL state"""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.base_weights = model_data.get('base_weights', self.base_weights)
        self.subject_groups = model_data.get('subject_groups', self.subject_groups)
        self.q_table = defaultdict(lambda: defaultdict(float), model_data.get('q_table', {}))
        self.tutor_performance = defaultdict(lambda: {
            'total_matches': 0,
            'successful_matches': 0,
            'avg_satisfaction': 0.0,
            'completion_rate': 0.0,
            'student_retention': 0.0,
            'response_time_score': 1.0,
            'reliability_score': 1.0
        }, model_data.get('tutor_performance', {}))
        self.student_preferences = defaultdict(lambda: {
            'weight_adjustments': {},
            'preferred_tutor_traits': {},
            'match_history': [],
            'satisfaction_history': []
        }, model_data.get('student_preferences', {}))
        self.feature_rewards = defaultdict(list, model_data.get('feature_rewards', {}))
        
        print(f"✓ RL Model loaded from {filepath}")
