// ============================================
// WARD ACADEMY - EXTERNAL USER DASHBOARD
// Self Assessments
// ============================================

let currentUser = null;

// Wait for Supabase to be ready
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureSupabase();
        await checkAuth();
        await loadDashboard();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar dashboard', 'error');
    }
});

// Check authentication
async function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('ward_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }

    // Update UI with user info
    const firstName = currentUser.name?.split(' ')[0] || currentUser.full_name?.split(' ')[0] || 'Usuario';
    document.getElementById('user-name').textContent = currentUser.name || currentUser.full_name || 'Usuario';
    document.getElementById('welcome-name').textContent = firstName;

    return currentUser;
}

// Load dashboard data
async function loadDashboard() {
    showLoading();

    try {
        // Load available self assessments
        const { data: assessments, error: assessmentsError } = await window.supabase
            .from('self_assessments')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (assessmentsError) throw assessmentsError;

        // Load user's enrollments
        const { data: enrollments, error: enrollmentsError } = await window.supabase
            .from('self_assessment_enrollments')
            .select('*')
            .eq('user_id', currentUser.id);

        if (enrollmentsError) throw enrollmentsError;

        // Create enrollment map for quick lookup
        const enrollmentMap = {};
        enrollments?.forEach(e => {
            enrollmentMap[e.self_assessment_id] = e;
        });

        // Render assessments
        renderAssessments(assessments || [], enrollmentMap);

        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        hideLoading();
        showToast('Erro ao carregar dados', 'error');
    }
}

// Render assessment cards
function renderAssessments(assessments, enrollmentMap) {
    const grid = document.getElementById('assessments-grid');

    if (!assessments || assessments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>Nenhum Self Assessment disponivel no momento.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = assessments.map(assessment => {
        const enrollment = enrollmentMap[assessment.id];
        return renderAssessmentCard(assessment, enrollment);
    }).join('');

    // Start countdown timers for waiting results
    startCountdownTimers();
}

// Start countdown timers
let countdownInterval = null;

function startCountdownTimers() {
    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // Update immediately
    updateCountdowns();

    // Update every second
    countdownInterval = setInterval(updateCountdowns, 1000);
}

function updateCountdowns() {
    const containers = document.querySelectorAll('.countdown-container');

    containers.forEach(container => {
        const releaseTime = parseInt(container.dataset.releaseTime);
        const countdownEl = container.querySelector('.countdown-value');

        if (!countdownEl) return;

        const now = Date.now();
        const diff = releaseTime - now;

        if (diff <= 0) {
            // Time's up - reload the page to show results button
            window.location.reload();
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
            countdownEl.textContent = `${hours}h ${String(minutes).padStart(2, '0')}min ${String(seconds).padStart(2, '0')}s`;
        } else {
            countdownEl.textContent = `${minutes}min ${String(seconds).padStart(2, '0')}s`;
        }
    });
}

// Render individual assessment card
function renderAssessmentCard(assessment, enrollment) {
    const totalBlocks = Math.ceil(assessment.total_questions / assessment.questions_per_block);

    // Determine status and actions
    let statusBadge = '';
    let progressHtml = '';
    let actionsHtml = '';

    if (!enrollment) {
        // Not enrolled - show enroll button
        statusBadge = '<span class="assessment-badge badge-available">Disponivel</span>';
        actionsHtml = `
            <button class="btn-action btn-primary" onclick="enrollAssessment(${assessment.id})">
                Inscrever-se
            </button>
        `;
    } else if (enrollment.status === 'enrolled') {
        // Enrolled but not started
        statusBadge = '<span class="assessment-badge badge-enrolled">Inscrito</span>';
        actionsHtml = `
            <button class="btn-action btn-primary" onclick="startAssessment(${enrollment.id})">
                Iniciar Prova
            </button>
        `;
    } else if (enrollment.status === 'in_progress') {
        // In progress
        statusBadge = '<span class="assessment-badge badge-in-progress">Em Andamento</span>';

        // Calculate progress
        const progressPercent = calculateProgress(enrollment);

        progressHtml = `
            <div class="assessment-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <span class="progress-text">${progressPercent}% concluido</span>
            </div>
        `;

        actionsHtml = `
            <button class="btn-action btn-primary" onclick="continueAssessment(${enrollment.id})">
                Continuar Prova
            </button>
        `;
    } else if (enrollment.status === 'completed') {
        // Completed - check if results are ready
        const resultsReady = checkResultsReady(enrollment, assessment);

        if (resultsReady) {
            statusBadge = '<span class="assessment-badge badge-results-ready">Resultado Disponivel</span>';
            actionsHtml = `
                <button class="btn-action btn-success" onclick="viewResults(${enrollment.id})">
                    Ver Resultado
                </button>
            `;
        } else {
            statusBadge = '<span class="assessment-badge badge-completed">Aguardando Resultado</span>';
            const releaseTime = new Date(enrollment.completed_at);
            releaseTime.setHours(releaseTime.getHours() + (assessment.release_results_after_hours || 24));
            const releaseTimestamp = releaseTime.getTime();

            actionsHtml = `
                <div class="countdown-container" data-release-time="${releaseTimestamp}">
                    <div class="countdown-label">Resultado disponivel em:</div>
                    <div class="countdown-timer">
                        <span class="countdown-value" id="countdown-${enrollment.id}">--:--</span>
                    </div>
                </div>
            `;
        }

        progressHtml = `
            <div class="assessment-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 100%"></div>
                </div>
                <span class="progress-text">Prova concluida</span>
            </div>
        `;
    }

    return `
        <div class="assessment-card">
            <div class="assessment-header">
                <h3 class="assessment-name">${escapeHtml(assessment.name)}</h3>
                ${statusBadge}
            </div>
            <p class="assessment-description">${escapeHtml(assessment.description || '')}</p>
            <div class="assessment-stats">
                <div class="stat-item">
                    <div class="stat-value">${assessment.total_questions}</div>
                    <div class="stat-label">Questoes</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalBlocks}</div>
                    <div class="stat-label">Blocos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${assessment.time_per_block_minutes}'</div>
                    <div class="stat-label">Por Bloco</div>
                </div>
            </div>
            ${progressHtml}
            <div class="assessment-actions">
                ${actionsHtml}
            </div>
        </div>
    `;
}

// Calculate progress percentage
function calculateProgress(enrollment) {
    // This would need to query the attempts to get accurate progress
    // For now, return a placeholder
    return 0;
}

// Check if results are ready
function checkResultsReady(enrollment, assessment) {
    if (!enrollment.completed_at) return false;

    const completedAt = new Date(enrollment.completed_at);
    const releaseTime = new Date(completedAt);
    releaseTime.setHours(releaseTime.getHours() + (assessment.release_results_after_hours || 24));

    return new Date() >= releaseTime;
}

// Format time remaining until results
function formatTimeRemaining(releaseTime) {
    const now = new Date();
    const diff = releaseTime - now;

    if (diff <= 0) return 'breve';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
}

// Enroll in assessment
function enrollAssessment(assessmentId) {
    window.location.href = `self-assessment-inscricao.html?id=${assessmentId}`;
}

// Start assessment
function startAssessment(enrollmentId) {
    window.location.href = `self-assessment-test.html?enrollment_id=${enrollmentId}`;
}

// Continue assessment
function continueAssessment(enrollmentId) {
    window.location.href = `self-assessment-test.html?enrollment_id=${enrollmentId}`;
}

// View results
function viewResults(enrollmentId) {
    window.location.href = `self-assessment-results.html?enrollment_id=${enrollmentId}`;
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
