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
    // Update results release countdowns
    const resultsContainers = document.querySelectorAll('.countdown-container:not(.scheduled-countdown)');

    resultsContainers.forEach(container => {
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

    // Update scheduled exam countdowns
    const scheduledContainers = document.querySelectorAll('.scheduled-countdown');

    scheduledContainers.forEach(container => {
        const scheduledTime = parseInt(container.dataset.scheduledTime);
        const countdownEl = container.querySelector('.scheduled-value');

        if (!countdownEl) return;

        const now = Date.now();
        const diff = scheduledTime - now;

        if (diff <= 0) {
            // Scheduled time reached - reload to show start button
            window.location.reload();
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            countdownEl.textContent = `${days}d ${hours}h ${String(minutes).padStart(2, '0')}min`;
        } else if (hours > 0) {
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
        // Enrolled but not started - check scheduled time
        if (enrollment.scheduled_datetime_utc) {
            const scheduledTime = new Date(enrollment.scheduled_datetime_utc);
            const now = new Date();
            const timeDiff = scheduledTime - now;

            if (timeDiff > 0) {
                // Scheduled time is in the future - show countdown
                statusBadge = '<span class="assessment-badge badge-enrolled">Agendado</span>';

                // Format scheduled date/time in user's timezone
                const userTz = enrollment.user_timezone || 'America/Sao_Paulo';
                const scheduledLocal = scheduledTime.toLocaleString('pt-BR', {
                    timeZone: userTz,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                actionsHtml = `
                    <div class="countdown-container scheduled-countdown" data-scheduled-time="${scheduledTime.getTime()}" data-enrollment-id="${enrollment.id}">
                        <div class="countdown-label">Prova agendada para ${scheduledLocal}</div>
                        <div class="countdown-label" style="margin-top: 0.5rem;">Comeca em:</div>
                        <div class="countdown-timer">
                            <span class="countdown-value scheduled-value">--:--:--</span>
                        </div>
                    </div>
                `;
            } else {
                // Scheduled time has passed - can start but time is being deducted
                const lateMinutes = Math.floor(-timeDiff / (1000 * 60));
                statusBadge = '<span class="assessment-badge badge-in-progress">Prova Disponivel</span>';

                if (lateMinutes < assessment.time_per_block_minutes) {
                    // Still has time to start (late but not too late)
                    actionsHtml = `
                        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; text-align: center;">
                            <div style="color: #92400e; font-weight: 600;">Voce esta ${lateMinutes} minutos atrasado!</div>
                            <div style="color: #78350f; font-size: 0.85rem;">O tempo sera descontado do primeiro bloco.</div>
                        </div>
                        <button class="btn-action btn-primary" onclick="startAssessment(${enrollment.id})" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
                            Iniciar Agora (${lateMinutes}min descontados)
                        </button>
                    `;
                } else {
                    // Too late - missed the exam
                    actionsHtml = `
                        <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 1rem; text-align: center;">
                            <div style="color: #991b1b; font-weight: 600;">Prova perdida</div>
                            <div style="color: #7f1d1d; font-size: 0.85rem;">Voce nao compareceu no horario agendado.</div>
                        </div>
                    `;
                }
            }
        } else {
            // No scheduled time - old behavior (shouldn't happen with new flow)
            statusBadge = '<span class="assessment-badge badge-enrolled">Inscrito</span>';
            actionsHtml = `
                <button class="btn-action btn-primary" onclick="startAssessment(${enrollment.id})">
                    Iniciar Prova
                </button>
            `;
        }
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

            // Check retake request status
            let retakeButton = '';
            if (enrollment.retake_requested_at && !enrollment.retake_approved_at && !enrollment.retake_denied_at) {
                // Pending request
                retakeButton = '<span class="retake-status-badge pending">Solicitacao Pendente</span>';
            } else if (enrollment.retake_approved_at) {
                // Approved - show button to start new attempt
                retakeButton = `
                    <button class="btn-action btn-primary" onclick="startNewAttempt(${enrollment.self_assessment_id})">
                        Iniciar Nova Tentativa
                    </button>
                `;
            } else if (enrollment.retake_denied_at) {
                // Denied
                retakeButton = '<span class="retake-status-badge denied">Solicitacao Negada</span>';
            } else {
                // No request yet
                retakeButton = `
                    <button class="btn-action btn-secondary" onclick="requestRetake(${enrollment.id})">
                        Solicitar Nova Tentativa
                    </button>
                `;
            }

            actionsHtml = `
                <div class="assessment-actions-row">
                    <button class="btn-action btn-success" onclick="viewResults(${enrollment.id})">
                        Ver Resultado
                    </button>
                    ${retakeButton}
                </div>
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

    // If mentor released results early, show immediately
    if (enrollment.results_released_at) return true;

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

// Request retake of assessment
async function requestRetake(enrollmentId) {
    const reason = prompt('Por que voce gostaria de refazer este Self Assessment?\n\n(Opcional - pressione OK para enviar sem motivo)');

    // If user clicks cancel, abort
    if (reason === null) return;

    showLoading();

    try {
        const { error } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                retake_requested_at: new Date().toISOString(),
                retake_request_reason: reason || null
            })
            .eq('id', enrollmentId);

        if (error) throw error;

        hideLoading();
        showToast('Solicitacao enviada! Aguarde a aprovacao do mentor.', 'success');

        // Reload to update UI
        await loadDashboard();
    } catch (error) {
        console.error('Error requesting retake:', error);
        hideLoading();
        showToast('Erro ao enviar solicitacao. Tente novamente.', 'error');
    }
}

// Start new attempt after retake approval
async function startNewAttempt(assessmentId) {
    showLoading();

    try {
        // Get the current enrollment
        const { data: enrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .select('*')
            .eq('self_assessment_id', assessmentId)
            .eq('user_id', currentUser.id)
            .single();

        if (enrollmentError) throw enrollmentError;

        // Increment retake count and reset enrollment for new attempt
        const { error: updateError } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                status: 'in_progress',
                completed_at: null,
                results_released_at: null,
                retake_requested_at: null,
                retake_request_reason: null,
                retake_approved_at: null,
                retake_denied_at: null,
                retake_response_by: null,
                retake_count: (enrollment.retake_count || 0) + 1
            })
            .eq('id', enrollment.id);

        if (updateError) throw updateError;

        hideLoading();

        // Redirect to the test page
        window.location.href = `self-assessment-test.html?enrollment_id=${enrollment.id}`;
    } catch (error) {
        console.error('Error starting new attempt:', error);
        hideLoading();
        showToast('Erro ao iniciar nova tentativa. Tente novamente.', 'error');
    }
}
