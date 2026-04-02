// Cloud sync storage module - using Supabase
// Supports cross-device synchronization

(function(window) {
    'use strict';
    
    console.log('📦 storage-sync.js loading...');

    const Storage = {
        _currentUserId: null,
        _supabaseClient: null,
        _initialized: false,
        
        async init() {
            console.log('🔧 Storage.init() called');
            
            this._currentUserId = sessionStorage.getItem('quiz_current_user');
            
            // Check if Supabase config exists
            if (typeof window.SUPABASE_CONFIG === 'undefined') {
                console.warn('⚠️ SUPABASE_CONFIG not defined');
                return false;
            }
            
            if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.key) {
                console.warn('⚠️ Supabase URL or key missing');
                return false;
            }
            
            console.log('📡 Supabase config found:', window.SUPABASE_CONFIG.url);
            
            try {
                // Initialize Supabase client
                if (typeof window.initSupabase !== 'function') {
                    console.error('❌ initSupabase function not available');
                    throw new Error('initSupabase not available');
                }
                
                const client = window.initSupabase(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
                if (!client) {
                    console.error('❌ initSupabase returned null');
                    throw new Error('initSupabase returned null');
                }
                
                this._supabaseClient = client;
                this._initialized = true;
                
                console.log('✅ Cloud sync mode enabled');
                return true;
                
            } catch (error) {
                console.error('❌ Supabase init failed:', error.message);
                this._initialized = false;
                return false;
            }
        },
        
        getCurrentUserId() {
            return this._currentUserId || sessionStorage.getItem('quiz_current_user');
        },
        
        setCurrentUser(userId) {
            this._currentUserId = userId;
            sessionStorage.setItem('quiz_current_user', userId);
        },
        
        clearCurrentUser() {
            this._currentUserId = null;
            sessionStorage.removeItem('quiz_current_user');
        },
        
        switchUser(userId) {
            this.setCurrentUser(userId);
        },
        
        _ensureClient() {
            console.log('🔍 _ensureClient called, initialized:', this._initialized);
            
            if (this._supabaseClient) {
                return this._supabaseClient;
            }
            
            if (this._initialized && typeof window.getSupabase === 'function') {
                try {
                    this._supabaseClient = window.getSupabase();
                    console.log('✅ Got Supabase client from window');
                    return this._supabaseClient;
                } catch (e) {
                    console.error('❌ getSupabase failed:', e.message);
                }
            }
            
            // Last resort: reinitialize
            if (window.SUPABASE_CONFIG && typeof window.initSupabase === 'function') {
                console.log('🔄 Re-initializing Supabase client...');
                this._supabaseClient = window.initSupabase(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
                if (this._supabaseClient) {
                    console.log('✅ Re-initialization successful');
                    return this._supabaseClient;
                }
            }
            
            throw new Error('Supabase client not initialized. Check console for details.');
        },
        
        // ==================== User Management ====================
        
        async getUsers() {
            try {
                const client = this._ensureClient();
                const { data, error } = await client.query('users', {
                    order: { column: 'created_at', ascending: false }
                });
                
                if (error) throw error;
                return Array.isArray(data) ? data : [];
            } catch (error) {
                console.error('Failed to get users:', error);
                return [];
            }
        },
        
        async createUser(username) {
            try {
                const client = this._ensureClient();
                const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                
                console.log('👤 Creating user:', username, 'with ID:', userId);
                
                const { data, error } = await client.insert('users', {
                    id: userId,
                    name: username,
                    total_days: 0,
                    total_questions: 0
                });
                
                if (error) {
                    console.error('❌ Create user error:', error);
                    throw error;
                }
                
                console.log('✅ User created:', userId);
                
                this.setCurrentUser(userId);
                
                return {
                    id: userId,
                    name: username,
                    totalDays: 0,
                    totalQuestions: 0
                };
            } catch (error) {
                console.error('Failed to create user:', error);
                throw new Error('Failed to create user: ' + error.message);
            }
        },
        
        async deleteUser(userId) {
            try {
                const client = this._ensureClient();
                await client.deleteAll('wrong_questions', { user_id: userId });
                await client.deleteAll('practice_history', { user_id: userId });
                await client.delete('users', userId);
                
                if (this.getCurrentUserId() === userId) {
                    this.clearCurrentUser();
                }
                
                return true;
            } catch (error) {
                console.error('Failed to delete user:', error);
                throw error;
            }
        },
        
        // ==================== Statistics ====================
        
        async getStats() {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { totalDays: 0, totalQuestions: 0, totalCorrect: 0, accuracy: 0 };
            }
            
            try {
                const client = this._ensureClient();
                const { data: history, error } = await client.query('practice_history', {
                    eq: { user_id: userId }
                });
                
                if (error) throw error;
                
                const historyList = Array.isArray(history) ? history : [];
                
                const totalDays = new Set(historyList.map(h => {
                    const date = new Date(h.created_at);
                    return date.toISOString().split('T')[0];
                })).size;
                
                const totalQuestions = historyList.reduce((sum, h) => sum + (h.total_questions || 0), 0);
                const totalCorrect = historyList.reduce((sum, h) => sum + (h.correct_count || 0), 0);
                const accuracy = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;
                
                return { totalDays, totalQuestions, totalCorrect, accuracy };
            } catch (error) {
                console.error('Failed to get stats:', error);
                return { totalDays: 0, totalQuestions: 0, totalCorrect: 0, accuracy: 0 };
            }
        },
        
        // ==================== History ====================
        
        async getHistory() {
            const userId = this.getCurrentUserId();
            if (!userId) return [];
            
            try {
                const client = this._ensureClient();
                const { data, error } = await client.query('practice_history', {
                    eq: { user_id: userId },
                    order: { column: 'created_at', ascending: false }
                });
                
                if (error) throw error;
                
                const historyList = Array.isArray(data) ? data : [];
                
                return historyList.map(item => ({
                    id: item.id,
                    grade: item.grade,
                    semester: item.semester,
                    totalQuestions: item.total_questions,
                    correctCount: item.correct_count,
                    accuracy: item.accuracy,
                    duration: item.duration,
                    subjectStats: item.subject_stats,
                    date: item.created_at ? item.created_at.split('T')[0] : '',
                    time: item.created_at ? item.created_at.split('T')[1].substr(0, 5) : ''
                }));
            } catch (error) {
                console.error('Failed to get history:', error);
                return [];
            }
        },
        
        async addHistory(record) {
            const userId = this.getCurrentUserId();
            if (!userId) return null;
            
            try {
                const client = this._ensureClient();
                const historyId = 'history_' + Date.now();
                
                await client.insert('practice_history', {
                    id: historyId,
                    user_id: userId,
                    grade: record.grade,
                    semester: record.semester,
                    total_questions: record.totalQuestions,
                    correct_count: record.correctCount,
                    accuracy: record.accuracy,
                    duration: record.duration,
                    subject_stats: record.subjectStats,
                    question_ids: record.questionIds
                });
                
                return { id: historyId, ...record };
            } catch (error) {
                console.error('Failed to add history:', error);
                return null;
            }
        },
        
        // ==================== Wrong Questions ====================
        
        async getWrongQuestions() {
            const userId = this.getCurrentUserId();
            if (!userId) return [];
            
            try {
                const client = this._ensureClient();
                const { data, error } = await client.query('wrong_questions', {
                    eq: { user_id: userId },
                    order: { column: 'created_at', ascending: false }
                });
                
                if (error) throw error;
                return Array.isArray(data) ? data : [];
            } catch (error) {
                console.error('Failed to get wrong questions:', error);
                return [];
            }
        },
        
        async addWrongQuestion(question, userAnswer) {
            const userId = this.getCurrentUserId();
            if (!userId) return null;
            
            try {
                const client = this._ensureClient();
                
                const { data: exists } = await client.query('wrong_questions', {
                    eq: { user_id: userId, question_id: question.id }
                });
                
                if (exists && exists.length > 0) return null;
                
                const wrongId = 'wrong_' + Date.now();
                await client.insert('wrong_questions', {
                    id: wrongId,
                    user_id: userId,
                    question_id: question.id,
                    question: question.question,
                    options: question.options,
                    answer: question.answer,
                    user_answer: userAnswer,
                    explanation: question.explanation,
                    subject: question.subject,
                    knowledge_point: question.knowledgePoint || ''
                });
                
                return { id: wrongId, questionId: question.id, ...question, userAnswer };
            } catch (error) {
                console.error('Failed to add wrong question:', error);
                return null;
            }
        },
        
        async removeWrongQuestion(wrongId) {
            try {
                const client = this._ensureClient();
                await client.delete('wrong_questions', wrongId);
                return true;
            } catch (error) {
                console.error('Failed to remove wrong question:', error);
                return false;
            }
        },
        
        async clearWrongQuestions() {
            const userId = this.getCurrentUserId();
            if (!userId) return false;
            
            try {
                const client = this._ensureClient();
                await client.deleteAll('wrong_questions', { user_id: userId });
                return true;
            } catch (error) {
                console.error('Failed to clear wrong questions:', error);
                return false;
            }
        },
        
        // ==================== Practice State ====================
        
        async getPracticeState() {
            const userId = this.getCurrentUserId();
            if (!userId) return null;
            
            try {
                const client = this._ensureClient();
                const { data, error } = await client.query('practice_state', {
                    eq: { user_id: userId }
                });
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    const state = data[0];
                    return {
                        grade: state.grade,
                        semester: state.semester,
                        questions: state.questions,
                        currentIndex: state.current_index,
                        userAnswers: state.user_answers,
                        elapsedSeconds: state.elapsed_seconds
                    };
                }
                return null;
            } catch (error) {
                console.error('Failed to get practice state:', error);
                return null;
            }
        },
        
        async savePracticeState(state) {
            const userId = this.getCurrentUserId();
            if (!userId) return false;
            
            try {
                const client = this._ensureClient();
                const stateId = 'state_' + userId;
                
                const { data: exists } = await client.query('practice_state', {
                    eq: { user_id: userId }
                });
                
                const stateData = {
                    id: stateId,
                    user_id: userId,
                    grade: state.selectedGrade || state.grade,
                    semester: state.selectedSemester || state.semester,
                    questions: state.currentQuestions || state.questions,
                    current_index: state.currentIndex,
                    user_answers: state.userAnswers,
                    elapsed_seconds: state.elapsedSeconds
                };
                
                if (exists && exists.length > 0) {
                    await client.update('practice_state', stateId, stateData);
                } else {
                    await client.insert('practice_state', stateData);
                }
                
                return true;
            } catch (error) {
                console.error('Failed to save practice state:', error);
                return false;
            }
        },
        
        async clearPracticeState() {
            const userId = this.getCurrentUserId();
            if (!userId) return false;
            
            try {
                const client = this._ensureClient();
                const stateId = 'state_' + userId;
                await client.delete('practice_state', stateId);
                return true;
            } catch (error) {
                console.error('Failed to clear practice state:', error);
                return false;
            }
        }
    };
    
    // Expose to global scope
    window.Storage = Storage;
    console.log('✅ storage-sync.js loaded, window.Storage available');

})(window);