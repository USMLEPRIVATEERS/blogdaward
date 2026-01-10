// ============================================
// WARD ACADEMY - WASA RESULTS (Admin View)
// ============================================

let currentUser = null;
let assessments = [];
let enrollments = [];
let attempts = [];
let responses = [];
let questions = [];
let questionStats = [];
let users = {};

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureSupabase();
        await checkAuth();
        await loadAllData();
        initializeUI();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar dados', 'error');
    }
});

// Ensure Supabase is ready
async function ensureSupabase() {
    if (window.supabase && typeof window.supabase.auth !== 'undefined') {
        return;
    }

    let attempts = 0;
    while (typeof window.supabase?.createClient !== 'function' && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
    }

    if (typeof window.supabase?.createClient !== 'function') {
        throw new Error('Supabase library not loaded');
    }

    if (!window.supabase.auth) {
        const SUPABASE_URL = 'https://yxtdesthusclivjdewfl.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGRlc3RodXNjbGl2amRld2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDUzMzYsImV4cCI6MjA4MjcyMTMzNn0.OQgK2s8K7CKJKyIwx7I6jnExTdCBpgiM7KfZuqhbPbw';
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

// Check auth - only Marcos can access
async function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('ward_user'));
    if (!currentUser || currentUser.role !== 'mentor_marcos') {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Load all data
async function loadAllData() {
    showLoading();

    try {
        // Load assessments
        const { data: assessmentsData, error: assessmentsError } = await window.supabase
            .from('self_assessments')
            .select('*')
            .order('created_at', { ascending: false });

        if (assessmentsError) throw assessmentsError;
        assessments = assessmentsData || [];

        // Load enrollments with user data
        const { data: enrollmentsData, error: enrollmentsError } = await window.supabase
            .from('self_assessment_enrollments')
            .select('*')
            .order('enrolled_at', { ascending: false });

        if (enrollmentsError) throw enrollmentsError;
        enrollments = enrollmentsData || [];

        // Load all attempts
        const { data: attemptsData, error: attemptsError } = await window.supabase
            .from('self_assessment_attempts')
            .select('*')
            .order('started_at', { ascending: false });

        if (attemptsError) throw attemptsError;
        attempts = attemptsData || [];

        // Load all responses
        const { data: responsesData, error: responsesError } = await window.supabase
            .from('self_assessment_responses')
            .select('*');

        if (responsesError) throw responsesError;
        responses = responsesData || [];

        // Load all questions
        const { data: questionsData, error: questionsError } = await window.supabase
            .from('self_assessment_questions')
            .select('*')
            .order('question_number');

        if (questionsError) throw questionsError;
        questions = questionsData || [];

        // Load question stats
        const { data: statsData, error: statsError } = await window.supabase
            .from('self_assessment_question_stats')
            .select('*');

        if (!statsError && statsData) {
            questionStats = statsData;
        }

        // Load users for enrolled students
        const userIds = [...new Set(enrollments.map(e => e.user_id))];
        if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await window.supabase
                .from('users')
                .select('id, name, email, cpf, whatsapp')
                .in('id', userIds);

            if (!usersError && usersData) {
                usersData.forEach(u => {
                    users[u.id] = u;
                });
            }
        }

        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        throw error;
    }
}

// Initialize UI
function initializeUI() {
    // Populate assessment filter
    populateAssessmentFilter();

    // Render student list
    renderStudentList();

    // Set up event listeners
    setupEventListeners();

    // Load retake request notifications
    loadRetakeRequests();

    // Show overview by default
    showOverview();
}

// Populate assessment filter
function populateAssessmentFilter() {
    const filter = document.getElementById('assessment-filter');
    filter.innerHTML = '<option value="all">Todos os Self Assessments</option>';

    assessments.forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = a.name;
        filter.appendChild(option);
    });
}

// Render student list in sidebar
function renderStudentList() {
    const list = document.getElementById('student-list');

    // Keep overview item
    const overviewItem = list.querySelector('.overview-item');
    list.innerHTML = '';
    list.appendChild(overviewItem);

    // Get unique students from enrollments
    const studentMap = new Map();

    enrollments.forEach(enrollment => {
        // Try both string and number keys for users object
        const user = users[enrollment.user_id] || users[String(enrollment.user_id)];
        if (!user) {
            console.log('User not found for enrollment.user_id:', enrollment.user_id);
            return;
        }

        const userIdKey = String(enrollment.user_id);
        if (!studentMap.has(userIdKey)) {
            studentMap.set(userIdKey, {
                user,
                enrollments: [],
                attempts: []
            });
        }

        studentMap.get(userIdKey).enrollments.push(enrollment);
    });

    // Add attempts to students
    attempts.forEach(attempt => {
        const enrollment = enrollments.find(e =>
            String(e.id) === String(attempt.enrollment_id) ||
            e.id === attempt.enrollment_id
        );
        if (enrollment) {
            const userIdKey = String(enrollment.user_id);
            if (studentMap.has(userIdKey)) {
                studentMap.get(userIdKey).attempts.push(attempt);
            }
        }
    });

    // Render each student
    studentMap.forEach((data, userId) => {
        const { user, enrollments: userEnrollments, attempts: userAttempts } = data;

        // Determine status
        let status = 'enrolled';
        let statusText = 'Inscrito';
        let statusClass = '';

        const hasCompleted = userAttempts.some(a => a.status === 'completed');
        const hasInProgress = userAttempts.some(a => a.status === 'in_progress');
        const hasWaiting = userEnrollments.some(e => e.status === 'awaiting_results');

        if (hasCompleted) {
            status = 'completed';
            statusText = 'Concluido';
            statusClass = 'completed';
        } else if (hasWaiting) {
            status = 'waiting';
            statusText = 'Aguardando Resultado';
            statusClass = 'waiting';
        } else if (hasInProgress) {
            status = 'in-progress';
            statusText = 'Em Progresso';
            statusClass = 'in-progress';
        }

        const li = document.createElement('li');
        li.className = 'student-item';
        li.dataset.userId = userId;

        const initials = getInitials(user.name);

        li.innerHTML = `
            <div class="student-avatar">${initials}</div>
            <div class="student-info">
                <div class="student-name">${user.name}</div>
                <div class="student-status ${statusClass}">${statusText}</div>
            </div>
        `;

        list.appendChild(li);
    });
}

// Get initials from name
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Setup event listeners
function setupEventListeners() {
    // Student list clicks
    document.getElementById('student-list').addEventListener('click', (e) => {
        const item = e.target.closest('.student-item');
        if (!item) return;

        // Update active state
        document.querySelectorAll('.student-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        if (item.dataset.view === 'overview') {
            showOverview();
        } else {
            showStudentDetail(item.dataset.userId);
        }
    });

    // Assessment filter change
    document.getElementById('assessment-filter').addEventListener('change', () => {
        showOverview();
    });

    // Search
    document.getElementById('student-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.student-item:not(.overview-item)').forEach(item => {
            const name = item.querySelector('.student-name').textContent.toLowerCase();
            item.style.display = name.includes(query) ? '' : 'none';
        });
    });
}

// Show overview
function showOverview() {
    document.getElementById('overview-view').style.display = 'block';
    document.getElementById('student-detail-view').classList.remove('active');
    document.getElementById('empty-state').style.display = 'none';

    const selectedAssessment = document.getElementById('assessment-filter').value;

    // Filter data based on selected assessment
    let filteredEnrollments = enrollments;
    let filteredAttempts = attempts;
    let filteredResponses = responses;
    let filteredQuestions = questions;

    if (selectedAssessment !== 'all') {
        filteredEnrollments = enrollments.filter(e => e.self_assessment_id === selectedAssessment);
        const enrollmentIds = filteredEnrollments.map(e => e.id);
        filteredAttempts = attempts.filter(a => enrollmentIds.includes(a.enrollment_id));
        const attemptIds = filteredAttempts.map(a => a.id);
        filteredResponses = responses.filter(r => attemptIds.includes(r.attempt_id));
        filteredQuestions = questions.filter(q => q.self_assessment_id === selectedAssessment);
    }

    // Calculate stats
    const participants = new Set(filteredEnrollments.map(e => e.user_id)).size;
    const completed = filteredAttempts.filter(a => a.status === 'completed').length;

    // Calculate average score and accuracy
    const completedAttempts = filteredAttempts.filter(a => a.status === 'completed' && a.score !== null);
    const avgScore = completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length)
        : 0;

    // Calculate accuracy from responses
    const correctResponses = filteredResponses.filter(r => r.is_correct).length;
    const totalResponses = filteredResponses.length;
    const avgAccuracy = totalResponses > 0
        ? Math.round((correctResponses / totalResponses) * 100)
        : 0;

    // Update stats
    document.getElementById('stat-participants').textContent = participants;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-avg-score').textContent = avgScore;
    document.getElementById('stat-avg-accuracy').textContent = avgAccuracy + '%';

    // Calculate question difficulty
    const questionAccuracy = calculateQuestionAccuracy(filteredQuestions, filteredResponses);

    let easy = 0, medium = 0, hard = 0;
    Object.values(questionAccuracy).forEach(acc => {
        if (acc > 60) easy++;
        else if (acc >= 40) medium++;
        else hard++;
    });

    document.getElementById('easy-count').textContent = easy;
    document.getElementById('medium-count').textContent = medium;
    document.getElementById('hard-count').textContent = hard;

    // Render questions table
    renderQuestionsTable(filteredQuestions, questionAccuracy);

    // Show empty state if no data
    if (participants === 0) {
        document.getElementById('empty-state').style.display = 'block';
        document.getElementById('overview-view').style.display = 'none';
    }
}

// Calculate accuracy per question
function calculateQuestionAccuracy(qs, resps) {
    const accuracy = {};

    qs.forEach(q => {
        const questionResponses = resps.filter(r => r.question_id === q.id);
        if (questionResponses.length > 0) {
            const correct = questionResponses.filter(r => r.is_correct).length;
            accuracy[q.id] = Math.round((correct / questionResponses.length) * 100);
        } else {
            accuracy[q.id] = null;
        }
    });

    return accuracy;
}

// Render questions table
function renderQuestionsTable(qs, accuracy) {
    const tbody = document.getElementById('questions-tbody');
    tbody.innerHTML = '';

    if (qs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Nenhuma questao encontrada</td></tr>';
        return;
    }

    qs.forEach((q, index) => {
        const acc = accuracy[q.id];
        const accValue = acc !== null ? acc : '-';

        // Parse question_tags to extract Subject and System
        // Format: "Subject::System::Topic" (e.g., "Anatomy::Cardiovascular::Gross Anatomy")
        let subject = '-';
        let system = '-';
        if (q.question_tags) {
            const tags = q.question_tags.split('::');
            subject = tags[0] || '-';
            system = tags[1] || '-';
        }

        let difficulty = '-';
        let difficultyClass = '';
        let difficultyBadge = '';

        if (acc !== null) {
            if (acc > 60) {
                difficulty = 'Facil';
                difficultyClass = 'easy';
                difficultyBadge = 'badge-easy';
            } else if (acc >= 40) {
                difficulty = 'Intermediaria';
                difficultyClass = 'medium';
                difficultyBadge = 'badge-medium';
            } else {
                difficulty = 'Dificil';
                difficultyClass = 'hard';
                difficultyBadge = 'badge-hard';
            }
        }

        // Count responses
        const questionResponses = responses.filter(r => r.question_id === q.id);
        const correctCount = questionResponses.filter(r => r.is_correct).length;
        const totalCount = questionResponses.length;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${q.question_number || (index + 1)}</td>
            <td>${subject}</td>
            <td>${system}</td>
            <td>${correctCount}/${totalCount}</td>
            <td>
                <div class="accuracy-bar">
                    <div class="accuracy-fill ${difficultyClass}" style="width: ${acc || 0}%"></div>
                </div>
                ${accValue}%
            </td>
            <td>
                ${difficulty !== '-' ? `<span class="badge ${difficultyBadge}">${difficulty}</span>` : '-'}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Show student detail
function showStudentDetail(userId) {
    document.getElementById('overview-view').style.display = 'none';
    document.getElementById('student-detail-view').classList.add('active');
    document.getElementById('empty-state').style.display = 'none';

    // Convert userId to ensure consistent comparison
    const userIdStr = String(userId);
    const userIdNum = parseInt(userId);

    const user = users[userId] || users[userIdStr] || users[userIdNum];
    if (!user) {
        console.log('User not found for userId:', userId);
        return;
    }

    // Update profile header
    document.getElementById('detail-avatar').textContent = getInitials(user.name);
    document.getElementById('detail-name').textContent = user.name;
    document.getElementById('detail-email').textContent = user.email || 'Sem email';

    // Get student's enrollments - compare with both string and number
    const studentEnrollments = enrollments.filter(e =>
        String(e.user_id) === userIdStr || e.user_id === userIdNum
    );

    console.log('Student enrollments for userId', userId, ':', studentEnrollments);

    // Build data grid
    const dataGrid = document.getElementById('student-data-grid');
    const enrollment = studentEnrollments[0];

    console.log('First enrollment:', enrollment);

    dataGrid.innerHTML = `
        <div class="student-data-item">
            <div class="student-data-label">CPF</div>
            <div class="student-data-value">${formatCPF(user.cpf) || 'Nao informado'}</div>
        </div>
        <div class="student-data-item">
            <div class="student-data-label">WhatsApp</div>
            <div class="student-data-value">${user.whatsapp || 'Nao informado'}</div>
        </div>
        <div class="student-data-item">
            <div class="student-data-label">Etapa de Estudo</div>
            <div class="student-data-value">${formatStudyStage(enrollment?.study_stage) || 'Nao informado'}</div>
        </div>
        <div class="student-data-item">
            <div class="student-data-label">Instituicao</div>
            <div class="student-data-value">${enrollment?.current_institution || 'Nao informado'}</div>
        </div>
        <div class="student-data-item">
            <div class="student-data-label">Endereco</div>
            <div class="student-data-value">${enrollment?.current_address || 'Nao informado'}</div>
        </div>
        <div class="student-data-item">
            <div class="student-data-label">Data de Graduacao</div>
            <div class="student-data-value">${enrollment?.graduation_date ? formatDate(enrollment.graduation_date) : 'Nao informado'}</div>
        </div>
    `;

    // Render assessments performance
    renderStudentAssessments(userId, studentEnrollments);
}

// Format study stage
function formatStudyStage(stage) {
    const stages = {
        'iniciando': 'Iniciando',
        'step1': 'Step 1',
        'step2ck': 'Step 2 CK',
        'step3': 'Step 3'
    };
    return stages[stage] || stage;
}

// Format CPF
function formatCPF(cpf) {
    if (!cpf) return null;
    if (cpf.length === 11) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// Render student assessments
function renderStudentAssessments(userId, studentEnrollments) {
    const container = document.getElementById('student-assessments-container');
    container.innerHTML = '';

    if (studentEnrollments.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma inscricao encontrada.</p></div>';
        return;
    }

    studentEnrollments.forEach(enrollment => {
        // Compare with both string and number for ID matching
        const assessment = assessments.find(a =>
            String(a.id) === String(enrollment.self_assessment_id) ||
            a.id === enrollment.self_assessment_id
        );
        if (!assessment) {
            console.log('Assessment not found for self_assessment_id:', enrollment.self_assessment_id);
            return;
        }

        // Get attempts for this enrollment
        const enrollmentAttempts = attempts.filter(a =>
            String(a.enrollment_id) === String(enrollment.id) ||
            a.enrollment_id === enrollment.id
        );

        // Get the latest completed or in-progress attempt
        const latestAttempt = enrollmentAttempts.find(a => a.status === 'completed') ||
                             enrollmentAttempts.find(a => a.status === 'in_progress') ||
                             enrollmentAttempts[0];

        // Calculate student's performance
        let studentScore = '-';
        let studentAccuracy = 0;
        let studentCorrect = 0;
        let studentTotal = 0;

        if (latestAttempt) {
            const attemptResponses = responses.filter(r => r.attempt_id === latestAttempt.id);
            studentCorrect = attemptResponses.filter(r => r.is_correct).length;
            studentTotal = attemptResponses.length;
            studentAccuracy = studentTotal > 0 ? Math.round((studentCorrect / studentTotal) * 100) : 0;

            // Use studentAccuracy as score if no explicit score is set
            if (latestAttempt.score != null && latestAttempt.score !== undefined) {
                studentScore = latestAttempt.score;
            } else {
                studentScore = studentAccuracy + '%';
            }
        }

        // Calculate average for comparison
        const assessmentQuestions = questions.filter(q => q.self_assessment_id === assessment.id);
        const assessmentResponses = responses.filter(r => {
            const attemptId = r.attempt_id;
            const attempt = attempts.find(a => a.id === attemptId);
            if (!attempt) return false;
            const enroll = enrollments.find(e => e.id === attempt.enrollment_id);
            return enroll && enroll.self_assessment_id === assessment.id;
        });

        const avgCorrect = assessmentResponses.filter(r => r.is_correct).length;
        const avgTotal = assessmentResponses.length;
        const avgAccuracy = avgTotal > 0 ? Math.round((avgCorrect / avgTotal) * 100) : 0;

        // Comparison
        const diff = studentAccuracy - avgAccuracy;
        let comparisonClass = 'equal';
        let comparisonText = 'Na media';
        let comparisonIcon = '➖';

        if (diff > 0) {
            comparisonClass = 'above';
            comparisonText = `+${diff}% acima`;
            comparisonIcon = '📈';
        } else if (diff < 0) {
            comparisonClass = 'below';
            comparisonText = `${diff}% abaixo`;
            comparisonIcon = '📉';
        }

        // Status badge and release button logic
        let statusBadge = '';
        let releaseButton = '';

        // Check if assessment is completed
        const isCompleted = latestAttempt?.status === 'completed' || enrollment.completed_at;

        // Check if 24h have passed since completion (automatic release)
        let autoReleased = false;
        if (enrollment.completed_at) {
            const completedAt = new Date(enrollment.completed_at);
            const releaseTime = new Date(completedAt);
            releaseTime.setHours(releaseTime.getHours() + (assessment.release_results_after_hours || 24));
            autoReleased = new Date() >= releaseTime;
        }

        // Check if manually released
        const manuallyReleased = !!enrollment.results_released_at;

        if (isCompleted) {
            if (manuallyReleased) {
                statusBadge = '<span class="badge badge-easy">Concluido</span>';
                releaseButton = '<span class="badge" style="background: #d1fae5; color: #065f46; margin-left: 0.5rem;">Resultado Liberado Manualmente</span>';
            } else if (autoReleased) {
                statusBadge = '<span class="badge badge-easy">Concluido</span>';
                releaseButton = '<span class="badge" style="background: #e0e7ff; color: #3730a3; margin-left: 0.5rem;">Resultado Disponivel (24h)</span>';
            } else {
                // Completed but 24h haven't passed - show release button
                statusBadge = '<span class="badge badge-medium">Aguardando Liberacao</span>';
                releaseButton = `
                    <button onclick="releaseResults(${enrollment.id})"
                            style="margin-left: 0.5rem; padding: 0.4rem 0.8rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                   color: white; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                        Liberar Resultado
                    </button>
                `;
            }
        } else if (latestAttempt?.status === 'in_progress') {
            statusBadge = '<span class="badge" style="background: #dbeafe; color: #1e40af;">Em Progresso</span>';
        } else {
            statusBadge = '<span class="badge" style="background: #fef3c7; color: #92400e;">Inscrito</span>';
        }

        const section = document.createElement('div');
        section.className = 'student-performance';
        section.innerHTML = `
            <div class="student-performance-header" style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <h3 style="margin: 0;">${assessment.name}</h3>
                ${statusBadge}
                ${releaseButton}
            </div>
            <div class="student-score">
                <div class="score-circle">
                    <div class="score-value">${studentScore}</div>
                    <div class="score-label">Score</div>
                </div>
                <div class="score-details">
                    <p><strong>Acertos:</strong> ${studentCorrect}/${studentTotal} (${studentAccuracy}%)</p>
                    <p><strong>Media Geral:</strong> ${avgAccuracy}%</p>
                    <p>
                        <span class="comparison-badge ${comparisonClass}">
                            ${comparisonIcon} ${comparisonText}
                        </span>
                    </p>
                </div>
            </div>
            ${latestAttempt ? renderStudentQuestions(latestAttempt, assessmentQuestions, avgAccuracy) : ''}
        `;

        container.appendChild(section);
    });
}

// Render student questions
function renderStudentQuestions(attempt, qs, avgAccuracy) {
    const attemptResponses = responses.filter(r => r.attempt_id === attempt.id);

    if (attemptResponses.length === 0) {
        return '<div style="padding: 1rem; text-align: center; color: #666;">Nenhuma resposta registrada ainda.</div>';
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="student-questions-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Subject</th>
                        <th>System</th>
                        <th>Resposta</th>
                        <th>Resultado</th>
                        <th>vs Media</th>
                    </tr>
                </thead>
                <tbody>
    `;

    qs.forEach((q, index) => {
        const response = attemptResponses.find(r => r.question_id === q.id);

        if (!response) return;

        // Parse question_tags to extract Subject and System
        // Format: "Subject::System::Topic" (e.g., "Anatomy::Cardiovascular::Gross Anatomy")
        let subject = '-';
        let system = '-';
        if (q.question_tags) {
            const tags = q.question_tags.split('::');
            subject = tags[0] || '-';
            system = tags[1] || '-';
        }

        // Calculate question's average accuracy
        const questionResponses = responses.filter(r => r.question_id === q.id);
        const questionAccuracy = questionResponses.length > 0
            ? Math.round((questionResponses.filter(r => r.is_correct).length / questionResponses.length) * 100)
            : 0;

        // Compare
        const studentGotIt = response.is_correct;
        let comparison = '';

        if (studentGotIt && questionAccuracy < 50) {
            comparison = '<span class="comparison-badge above">Acertou questao dificil!</span>';
        } else if (!studentGotIt && questionAccuracy > 70) {
            comparison = '<span class="comparison-badge below">Errou questao facil</span>';
        }

        html += `
            <tr>
                <td>${q.question_number || (index + 1)}</td>
                <td>${subject}</td>
                <td>${system}</td>
                <td>${response.selected_answer || '-'}</td>
                <td class="${response.is_correct ? 'answer-correct' : 'answer-incorrect'}">
                    ${response.is_correct ? '✓ Correto' : '✗ Incorreto'}
                </td>
                <td>${comparison || `${questionAccuracy}% acertaram`}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    return html;
}

// Helper functions
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

function showToast(message, type = 'info') {
    if (typeof WardApp !== 'undefined' && WardApp.showToast) {
        WardApp.showToast(message, type);
    } else {
        alert(message);
    }
}

// Release results early for a student
async function releaseResults(enrollmentId) {
    if (!confirm('Liberar resultado antecipadamente para este aluno?')) {
        return;
    }

    showLoading();

    try {
        const { error } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                results_released_at: new Date().toISOString(),
                status: 'completed'
            })
            .eq('id', enrollmentId);

        if (error) throw error;

        // Update local data
        const enrollment = enrollments.find(e => e.id === enrollmentId);
        if (enrollment) {
            enrollment.results_released_at = new Date().toISOString();
            enrollment.status = 'completed';
        }

        hideLoading();
        showToast('Resultado liberado com sucesso!', 'success');

        // Re-render the student detail view
        const currentStudent = document.querySelector('.student-item.active');
        if (currentStudent && currentStudent.dataset.userId) {
            showStudentDetail(currentStudent.dataset.userId);
        }
    } catch (error) {
        console.error('Error releasing results:', error);
        hideLoading();
        showToast('Erro ao liberar resultado', 'error');
    }
}

// ============================================
// RETAKE REQUEST NOTIFICATIONS
// ============================================

// Load and render retake requests
function loadRetakeRequests() {
    const panel = document.getElementById('notifications-panel');
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-count');

    if (!panel || !list) return;

    // Filter enrollments with pending retake requests
    const pendingRequests = enrollments.filter(e =>
        e.retake_requested_at &&
        !e.retake_approved_at &&
        !e.retake_denied_at
    );

    if (pendingRequests.length === 0) {
        panel.classList.remove('has-notifications');
        return;
    }

    // Show panel
    panel.classList.add('has-notifications');
    badge.textContent = pendingRequests.length;

    // Render notifications
    list.innerHTML = pendingRequests.map(enrollment => {
        const user = users[enrollment.user_id] || {};
        const assessment = assessments.find(a => a.id === enrollment.self_assessment_id);
        const initials = getInitials(user.name || 'U');
        const timeAgo = formatTimeAgo(enrollment.retake_requested_at);

        return `
            <div class="notification-item" data-enrollment-id="${enrollment.id}">
                <div class="notification-avatar">${initials}</div>
                <div class="notification-content">
                    <div class="notification-text">
                        <strong>${escapeHtml(user.name || 'Usuario')}</strong> solicitou uma nova tentativa
                        ${assessment ? `no ${escapeHtml(assessment.name)}` : ''}
                    </div>
                    ${enrollment.retake_request_reason ? `
                        <div class="notification-reason">"${escapeHtml(enrollment.retake_request_reason)}"</div>
                    ` : ''}
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-actions">
                    <button class="btn-approve" onclick="approveRetake(${enrollment.id})">
                        ✓ Aprovar
                    </button>
                    <button class="btn-deny" onclick="denyRetake(${enrollment.id})">
                        ✕ Negar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Format time ago
function formatTimeAgo(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atras`;
    if (diffHours < 24) return `${diffHours}h atras`;
    if (diffDays < 7) return `${diffDays} dias atras`;

    return date.toLocaleDateString('pt-BR');
}

// ============================================
// SCHEDULING MODAL FOR RETAKE APPROVAL
// ============================================

let pendingRetakeEnrollmentId = null;

// Open scheduling modal instead of direct approval
function approveRetake(enrollmentId) {
    openScheduleRetakeModal(enrollmentId);
}

// Open the scheduling modal
function openScheduleRetakeModal(enrollmentId) {
    pendingRetakeEnrollmentId = enrollmentId;

    // Find enrollment and user info
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    const user = enrollment ? (users[enrollment.user_id] || {}) : {};

    // Update modal with student name
    document.getElementById('schedule-student-name').textContent = user.name || 'Aluno';

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('retake-date').value = tomorrow.toISOString().split('T')[0];

    // Set default time to 9:00 AM
    document.getElementById('retake-time').value = '09:00';

    // Show modal
    document.getElementById('schedule-retake-modal').classList.add('visible');
}

// Close the scheduling modal
function closeScheduleRetakeModal() {
    pendingRetakeEnrollmentId = null;
    document.getElementById('schedule-retake-modal').classList.remove('visible');
}

// Confirm retake approval with scheduling
async function confirmRetakeApproval() {
    const date = document.getElementById('retake-date').value;
    const time = document.getElementById('retake-time').value;
    const timezone = document.getElementById('retake-timezone').value;

    // Validate inputs
    if (!date || !time) {
        showToast('Por favor, preencha a data e horario', 'error');
        return;
    }

    if (!pendingRetakeEnrollmentId) {
        showToast('Erro: Nenhuma solicitacao selecionada', 'error');
        closeScheduleRetakeModal();
        return;
    }

    // Convert to UTC
    const localDatetime = `${date}T${time}:00`;
    const scheduledDate = new Date(localDatetime);

    // Validate date is in the future
    if (scheduledDate <= new Date()) {
        showToast('A data e horario devem ser no futuro', 'error');
        return;
    }

    const scheduledDatetimeUtc = scheduledDate.toISOString();

    showLoading();
    closeScheduleRetakeModal();

    try {
        const enrollmentId = pendingRetakeEnrollmentId;
        const enrollment = enrollments.find(e => e.id === enrollmentId);

        // Delete old attempts for this enrollment to start fresh
        if (enrollment) {
            const { error: deleteAttemptsError } = await window.supabase
                .from('self_assessment_attempts')
                .delete()
                .eq('enrollment_id', enrollmentId);

            if (deleteAttemptsError) {
                console.error('Error deleting old attempts:', deleteAttemptsError);
            }

            // Delete old responses for this enrollment
            const { error: deleteResponsesError } = await window.supabase
                .from('self_assessment_responses')
                .delete()
                .eq('enrollment_id', enrollmentId);

            if (deleteResponsesError) {
                console.error('Error deleting old responses:', deleteResponsesError);
            }
        }

        // Update enrollment with scheduled datetime and reset for new attempt
        const { error } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                retake_approved_at: new Date().toISOString(),
                retake_response_by: currentUser.id,
                status: 'enrolled',
                completed_at: null,
                results_released_at: null,
                started_at: null,
                scheduled_datetime_utc: scheduledDatetimeUtc,
                scheduled_timezone: timezone,
                retake_count: (enrollment?.retake_count || 0) + 1
            })
            .eq('id', enrollmentId);

        if (error) throw error;

        // Update local data
        if (enrollment) {
            enrollment.retake_approved_at = new Date().toISOString();
            enrollment.status = 'enrolled';
            enrollment.completed_at = null;
            enrollment.results_released_at = null;
            enrollment.started_at = null;
            enrollment.scheduled_datetime_utc = scheduledDatetimeUtc;
            enrollment.scheduled_timezone = timezone;
            enrollment.retake_count = (enrollment.retake_count || 0) + 1;
        }

        // Remove old attempts from local data
        attempts = attempts.filter(a => a.enrollment_id !== enrollmentId);

        hideLoading();

        // Format date for display
        const displayDate = scheduledDate.toLocaleDateString('pt-BR');
        const displayTime = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        showToast(`Aprovado! Nova tentativa agendada para ${displayDate} as ${displayTime}`, 'success');

        // Reload notifications
        loadRetakeRequests();

        // Re-render student list
        renderStudentList();

    } catch (error) {
        console.error('Error approving retake:', error);
        hideLoading();
        showToast('Erro ao aprovar solicitacao', 'error');
    }
}

// Deny retake request
async function denyRetake(enrollmentId) {
    if (!confirm('Negar a solicitacao de nova tentativa?')) return;

    showLoading();

    try {
        const { error } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                retake_denied_at: new Date().toISOString(),
                retake_response_by: currentUser.id
            })
            .eq('id', enrollmentId);

        if (error) throw error;

        // Update local data
        const enrollment = enrollments.find(e => e.id === enrollmentId);
        if (enrollment) {
            enrollment.retake_denied_at = new Date().toISOString();
        }

        hideLoading();
        showToast('Solicitacao negada.', 'success');

        // Reload notifications
        loadRetakeRequests();

    } catch (error) {
        console.error('Error denying retake:', error);
        hideLoading();
        showToast('Erro ao negar solicitacao', 'error');
    }
}
