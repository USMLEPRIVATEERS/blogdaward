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
        const user = users[enrollment.user_id];
        if (!user) return;

        if (!studentMap.has(enrollment.user_id)) {
            studentMap.set(enrollment.user_id, {
                user,
                enrollments: [],
                attempts: []
            });
        }

        studentMap.get(enrollment.user_id).enrollments.push(enrollment);
    });

    // Add attempts to students
    attempts.forEach(attempt => {
        const enrollment = enrollments.find(e => e.id === attempt.enrollment_id);
        if (enrollment && studentMap.has(enrollment.user_id)) {
            studentMap.get(enrollment.user_id).attempts.push(attempt);
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
            <td>${index + 1}</td>
            <td>${q.subject || '-'}</td>
            <td>${q.system || '-'}</td>
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

    const user = users[userId];
    if (!user) return;

    // Update profile header
    document.getElementById('detail-avatar').textContent = getInitials(user.name);
    document.getElementById('detail-name').textContent = user.name;
    document.getElementById('detail-email').textContent = user.email || 'Sem email';

    // Get student's enrollments
    const studentEnrollments = enrollments.filter(e => e.user_id === userId);

    // Build data grid
    const dataGrid = document.getElementById('student-data-grid');
    const enrollment = studentEnrollments[0];

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
        const assessment = assessments.find(a => a.id === enrollment.self_assessment_id);
        if (!assessment) return;

        // Get attempts for this enrollment
        const enrollmentAttempts = attempts.filter(a => a.enrollment_id === enrollment.id);

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

            if (latestAttempt.score !== null) {
                studentScore = latestAttempt.score;
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

        // Status badge
        let statusBadge = '';
        let releaseButton = '';
        if (enrollment.status === 'awaiting_results') {
            statusBadge = '<span class="badge badge-medium">Aguardando Resultado</span>';
            // Add release button if results not yet released
            if (!enrollment.results_released_at) {
                releaseButton = `
                    <button onclick="releaseResults(${enrollment.id})"
                            style="margin-left: 0.5rem; padding: 0.4rem 0.8rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                   color: white; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                        Liberar Resultado
                    </button>
                `;
            } else {
                releaseButton = '<span class="badge badge-easy" style="margin-left: 0.5rem;">Resultado Liberado</span>';
            }
        } else if (latestAttempt?.status === 'completed') {
            statusBadge = '<span class="badge badge-easy">Concluido</span>';
        } else if (latestAttempt?.status === 'in_progress') {
            statusBadge = '<span class="badge" style="background: #dbeafe; color: #1e40af;">Em Progresso</span>';
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
                <td>${index + 1}</td>
                <td>${q.subject || '-'}</td>
                <td>${q.system || '-'}</td>
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
