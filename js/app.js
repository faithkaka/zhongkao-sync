// 刷题应用主逻辑 - 云同步版本（使用 Supabase）
// 支持跨设备数据同步

const app = {
    state: {
        currentPage: 'home',
        selectedGrade: 7,
        selectedSemester: 'lower',
        currentQuestions: [],
        currentIndex: 0,
        userAnswers: [],
        selectedOption: null,
        startTime: null,
        timerInterval: null,
        elapsedSeconds: 0
    },

    semesterNames: { 'upper': '上册', 'lower': '下册' },

    async init() {
        // 初始化云同步存储
        await Storage.init();
        
        await this.checkUserLogin();
        this.bindEvents();
        await this.updateStatsUI();
        await this.checkResumePractice();
        
        // 检查 Supabase 配置
        this.checkSupabaseConfig();
    },
    
    // 检查 Supabase 配置状态
    checkSupabaseConfig() {
        if (typeof SUPABASE_CONFIG === 'undefined') {
            console.warn('⚠️ Supabase 未配置，数据将无法保存');
            this.showConfigWarning();
        }
    },
    
    // 显示配置警告
    showConfigWarning() {
        setTimeout(() => {
            if (!document.querySelector('.config-warning')) {
                const warning = document.createElement('div');
                warning.className = 'config-warning';
                warning.innerHTML = `
                    <div class="warning-content">
                        <span class="warning-icon">⚠️</span>
                        <span class="warning-text">数据服务未配置，数据将无法保存</span>
                        <button class="warning-btn" onclick="app.showSetupModal()">了解如何配置</button>
                        <span class="warning-close" onclick="this.parentElement.remove()">✕</span>
                    </div>
                `;
                document.body.insertBefore(warning, document.body.firstChild);
            }
        }, 500);
    },
    
    // 显示配置说明弹窗
    showSetupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'setupModal';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.innerHTML = `
            <div class="modal" style="max-width:400px;">
                <h2 style="margin-bottom:15px;">🔧 数据同步配置</h2>
                <div class="modal-content" style="text-align:left; max-height:50vh; overflow-y:auto; font-size:14px; line-height:1.8;">
                    <p><strong>当前状态：</strong> 数据仅在本地（不同步）</p>
                    
                    <h4 style="margin-top:15px; color:#333;">✨ 启用云同步</h4>
                    <ol style="line-height:1.8; padding-left:20px; margin:10px 0;">
                        <li>访问 <a href="https://supabase.com" target="_blank" style="color:#667eea;">supabase.com</a> 注册</li>
                        <li>创建新项目，选择「Singapore」节点</li>
                        <li>复制项目 URL 和 Anon Key</li>
                        <li>运行 SUPABASE-README.md 中的 SQL</li>
                        <li>在 config.js 中填写配置</li>
                        <li>刷新页面即可</li>
                    </ol>
                    
                    <p style="color:#666; margin-top:10px; padding:10px; background:#f5f5f5; border-radius:8px;">
                        💡 启用后，手机和电脑的数据会自动同步！
                    </p>
                </div>
                <button class="modal-btn" onclick="document.getElementById('setupModal').remove()" style="margin-top:15px;">知道了</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async checkUserLogin() {
        const users = await Storage.getUsers();
        const currentUserId = Storage.getCurrentUserId();
        
        if (users.length === 0) {
            await Storage.createUser('默认用户');
            this.updateUserDisplay();
            return;
        }
        
        if (!currentUserId || !users.find(u => u.id === currentUserId)) {
            Storage.switchUser(users[0].id);
        }
        
        this.updateUserDisplay();
    },

    async updateUserDisplay() {
        const userNameEl = document.getElementById('current-username');
        if (!userNameEl) return;
        
        try {
            const users = await Storage.getUsers();
            const currentUserId = Storage.getCurrentUserId();
            const user = users.find(u => u.id === currentUserId);
            userNameEl.textContent = user ? user.name : '未登录';
        } catch (error) {
            console.error('获取用户列表失败:', error);
            userNameEl.textContent = '未登录';
        }
    },

    bindEvents() {
        document.querySelectorAll('.semester-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.semester-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.state.selectedSemester = e.target.dataset.semester;
            });
        });
        
        const input = document.getElementById('new-username-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addUser();
            });
        }
    },

    async checkResumePractice() {
        const state = await Storage.getPracticeState();
        if (state && state.questions && state.questions.length > 0) {
            if (confirm('检测到有未完成的练习，是否继续？')) {
                this.state.currentQuestions = state.questions;
                this.state.currentIndex = state.currentIndex || 0;
                this.state.userAnswers = state.userAnswers || [];
                this.state.elapsedSeconds = state.elapsedSeconds || 0;
                this.showPage('practice');
                this.startTimer();
                this.renderQuestion();
            } else {
                await Storage.clearPracticeState();
            }
        }
    },

    async showPage(pageName) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(pageName + '-page');
        if (page) {
            page.classList.add('active');
            this.state.currentPage = pageName;
        }
        
        if (pageName === 'home') await this.updateStatsUI();
        if (pageName === 'wrong') await this.renderWrongList('all');
        if (pageName === 'history') await this.renderHistory();
    },

    async updateStatsUI() {
        const stats = await Storage.getStats();
        const statDays = document.getElementById('stat-days');
        const statTotal = document.getElementById('stat-total');
        const statCorrect = document.getElementById('stat-correct');
        
        if (statDays) statDays.textContent = stats.totalDays || 0;
        if (statTotal) statTotal.textContent = stats.totalQuestions || 0;
        if (statCorrect) statCorrect.textContent = (stats.accuracy || 0) + '%';
    },

    async startPractice() {
        const questions = getTodayQuestions(this.state.selectedGrade, this.state.selectedSemester);
        
        if (!questions || questions.length === 0) {
            alert('题库加载失败，请刷新页面重试！');
            return;
        }
        
        this.state.currentQuestions = questions;
        this.state.currentIndex = 0;
        this.state.userAnswers = [];
        this.state.selectedOption = null;
        this.state.elapsedSeconds = 0;
        this.state.startTime = Date.now();
        
        const semesterName = this.semesterNames[this.state.selectedSemester];
        const titleEl = document.getElementById('practice-title');
        if (titleEl) titleEl.textContent = `七年级${semesterName} 每日打卡`;
        
        this.showPage('practice');
        this.startTimer();
        this.renderQuestion();
    },

    startTimer() {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = setInterval(async () => {
            this.state.elapsedSeconds++;
            const mins = Math.floor(this.state.elapsedSeconds / 60).toString().padStart(2, '0');
            const secs = (this.state.elapsedSeconds % 60).toString().padStart(2, '0');
            const timerEl = document.getElementById('timer');
            if (timerEl) timerEl.textContent = `${mins}:${secs}`;
            
            if (this.state.currentPage === 'practice') {
                await Storage.savePracticeState(this.state);
            }
        }, 1000);
    },

    stopTimer() {
        clearInterval(this.state.timerInterval);
    },

    renderQuestion() {
        const question = this.state.currentQuestions[this.state.currentIndex];
        if (!question) return;
        
        const counterEl = document.getElementById('question-counter');
        const subjectEl = document.getElementById('subject-tag');
        const questionEl = document.getElementById('question-text');
        const optionsEl = document.getElementById('options-container');
        
        if (counterEl) counterEl.textContent = `${this.state.currentIndex + 1}/${this.state.currentQuestions.length}`;
        if (subjectEl) {
            subjectEl.textContent = question.subject;
            subjectEl.className = 'subject-tag ' + question.subject.toLowerCase();
        }
        if (questionEl) questionEl.textContent = question.question;
        
        if (optionsEl) {
            optionsEl.innerHTML = question.options.map((opt, idx) => 
                `<button class="option" data-idx="${idx}" onclick="app.selectOption(${idx})">${String.fromCharCode(65 + idx)}. ${opt}</button>`
            ).join('');
        }
        
        const feedbackEl = document.getElementById('feedback');
        if (feedbackEl) feedbackEl.style.display = 'none';
        
        this.state.selectedOption = null;
    },

    selectOption(idx) {
        document.querySelectorAll('.option').forEach((btn, i) => {
            btn.classList.toggle('selected', i === idx);
        });
        this.state.selectedOption = idx;
    },

    async submitAnswer() {
        if (this.state.selectedOption === null) {
            alert('请选择一个答案');
            return;
        }
        
        const question = this.state.currentQuestions[this.state.currentIndex];
        const isCorrect = this.state.selectedOption === question.answer;
        
        this.state.userAnswers.push({
            questionIndex: this.state.currentIndex,
            selected: this.state.selectedOption,
            correct: isCorrect,
            subject: question.subject
        });
        
        if (!isCorrect) {
            await Storage.addWrongQuestion(question, this.state.selectedOption);
        }
        
        const feedbackEl = document.getElementById('feedback');
        const iconEl = document.getElementById('feedback-icon');
        const textEl = document.getElementById('feedback-text');
        const explanationEl = document.getElementById('explanation');
        
        if (feedbackEl) {
            feedbackEl.style.display = 'block';
            feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
        }
        if (iconEl) iconEl.textContent = isCorrect ? '✅' : '❌';
        if (textEl) textEl.textContent = isCorrect ? '回答正确！' : `回答错误，正确答案是：${String.fromCharCode(65 + question.answer)}`;
        if (explanationEl) explanationEl.textContent = question.explanation || '';
        
        if (this.state.currentIndex >= this.state.currentQuestions.length - 1) {
            setTimeout(() => this.completePractice(), 1000);
        }
    },

    nextQuestion() {
        if (this.state.currentIndex < this.state.currentQuestions.length - 1) {
            this.state.currentIndex++;
            this.renderQuestion();
        } else {
            this.completePractice();
        }
    },

    async completePractice() {
        this.stopTimer();
        
        const correctCount = this.state.userAnswers.filter(a => a.correct).length;
        const totalQuestions = this.state.currentQuestions.length;
        const accuracy = Math.round((correctCount / totalQuestions) * 100);
        
        await Storage.addHistory({
            grade: this.state.selectedGrade,
            semester: this.state.selectedSemester,
            totalQuestions,
            correctCount,
            accuracy,
            duration: this.state.elapsedSeconds,
            subjectStats: this.calculateSubjectStats(),
            questionIds: this.state.currentQuestions.map(q => q.id)
        });
        
        await Storage.clearPracticeState();
        
        const scoreEl = document.getElementById('final-score');
        const correctEl = document.getElementById('result-correct');
        const rateEl = document.getElementById('result-rate');
        const timeEl = document.getElementById('result-time');
        
        if (scoreEl) scoreEl.textContent = accuracy;
        if (correctEl) correctEl.textContent = `${correctCount}/${totalQuestions}`;
        if (rateEl) rateEl.textContent = `${accuracy}%`;
        if (timeEl) timeEl.textContent = this.formatTime(this.state.elapsedSeconds);
        
        this.showSubjectBreakdown();
        this.showPage('complete');
        this.updateStatsUI();
    },

    calculateSubjectStats() {
        const stats = {};
        this.state.currentQuestions.forEach((q, idx) => {
            if (!stats[q.subject]) {
                stats[q.subject] = { total: 0, correct: 0 };
            }
            stats[q.subject].total++;
            if (this.state.userAnswers[idx]?.correct) {
                stats[q.subject].correct++;
            }
        });
        return stats;
    },

    showSubjectBreakdown() {
        const container = document.getElementById('subject-breakdown');
        const stats = this.calculateSubjectStats();
        
        if (!container) return;
        
        container.innerHTML = `<h3>各科表现</h3>` + 
            Object.entries(stats).map(([subject, data]) => {
                const rate = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                return `
                    <div class="subject-stat">
                        <span class="subject-name">${subject}</span>
                        <span class="subject-score">${data.correct}/${data.total} (${rate}%)</span>
                    </div>
                `;
            }).join('');
    },

    async showWrongAnswers() {
        this.showPage('wrong');
        await this.renderWrongList('all');
    },

    async renderWrongList(filter) {
        const wrongs = await Storage.getWrongQuestions();
        const container = document.getElementById('wrong-list');
        const clearBtn = document.getElementById('clear-wrong-btn');
        
        if (!container) return;
        
        const filtered = filter === 'all' ? wrongs : wrongs.filter(w => w.subject === filter);
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-tip">暂无错题，继续加油！</div>';
            if (clearBtn) clearBtn.style.display = 'none';
            return;
        }
        
        container.innerHTML = filtered.map(w => `
            <div class="wrong-item">
                <div class="wrong-header">
                    <span class="wrong-subject ${w.subject.toLowerCase()}">${w.subject}</span>
                    <button class="wrong-delete" onclick="app.deleteWrong('${w.id}')">删除</button>
                </div>
                <div class="wrong-question">${w.question}</div>
                <div class="wrong-answer">
                    <span>你的答案：${String.fromCharCode(65 + w.userAnswer)}</span>
                    <span>正确答案：${String.fromCharCode(65 + w.answer)}</span>
                </div>
                <div class="wrong-explanation">${w.explanation || ''}</div>
            </div>
        `).join('');
        
        if (clearBtn) clearBtn.style.display = 'block';
    },

    async deleteWrong(wrongId) {
        await Storage.removeWrongQuestion(wrongId);
        await this.renderWrongList('all');
    },

    async clearWrongBook() {
        if (!confirm('确定要清空所有错题吗？此操作不可恢复。')) return;
        await Storage.clearWrongQuestions();
        await this.renderWrongList('all');
    },

    async renderHistory() {
        const history = await Storage.getHistory();
        const container = document.getElementById('history-list');
        
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-tip">暂无练习记录，开始打卡吧！</div>';
            return;
        }
        
        container.innerHTML = history.map(h => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-date">${h.date} ${h.time}</span>
                    <span class="history-grade">七年级${h.semester === 'upper' ? '上' : '下'}册</span>
                </div>
                <div class="history-stats">
                    <span>${h.totalQuestions} 题</span>
                    <span>${h.correctCount} 对</span>
                    <span>${h.accuracy}% 正确率</span>
                    <span>用时 ${this.formatTime(h.duration)}</span>
                </div>
            </div>
        `).join('');
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    },

    // ========== 用户管理 ==========
    async showUserManager() {
        this.showPage('user-manager');
        await this.renderUserList();
        const input = document.getElementById('new-username-input');
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 100);
        }
    },

    async renderUserList() {
        const users = await Storage.getUsers();
        const currentUserId = Storage.getCurrentUserId();
        const container = document.getElementById('user-list');
        
        if (!container) return;
        
        if (users.length === 0) {
            container.innerHTML = '<div class="user-empty">暂无用户，请先添加用户</div>';
            return;
        }
        
        container.innerHTML = users.map(user => {
            const isCurrent = user.id === currentUserId;
            return `
                <div class="user-item ${isCurrent ? 'current' : ''}">
                    <div class="user-info">
                        <div class="user-avatar">👤</div>
                        <div class="user-details">
                            <div class="user-name-text">${user.name}</div>
                            <div class="user-stats">${user.total_days || 0} 天 · ${user.total_questions || 0} 题</div>
                        </div>
                    </div>
                    <div class="user-actions">
                        ${isCurrent 
                            ? '<span class="user-current-badge">当前</span>' 
                            : `<button class="user-btn switch" onclick="app.switchUser('${user.id}')">切换</button>`
                        }
                        ${users.length > 1 ? `<button class="user-btn delete" onclick="app.deleteUser('${user.id}')">删除</button>` : ''}
                    </div>
                </div>`;
        }).join('');
    },

    async addUser() {
        const input = document.getElementById('new-username-input');
        if (!input) return;
        
        const username = input.value.trim();
        if (!username) {
            alert('请输入用户名');
            return;
        }
        if (username.length > 10) {
            alert('用户名不能超过 10 个字符');
            return;
        }
        
        try {
            await Storage.createUser(username);
            await this.renderUserList();
            this.updateUserDisplay();
            await this.updateStatsUI();
            input.value = '';
        } catch (error) {
            alert(error.message || '创建失败');
        }
    },

    async switchUser(userId) {
        Storage.switchUser(userId);
        await this.renderUserList();
        this.updateUserDisplay();
        await this.updateStatsUI();
    },

    async deleteUser(userId) {
        if (!confirm('确定删除该用户？')) return;
        
        try {
            await Storage.deleteUser(userId);
            await this.renderUserList();
            this.updateUserDisplay();
            await this.updateStatsUI();
        } catch (error) {
            alert(error.message || '删除失败');
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init().catch(console.error);
});

// 弹窗关闭
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.remove();
    }
});