// ============================================
// WARD ACADEMY - SELF ASSESSMENT RESULTS
// Score calculation and performance analysis
// ============================================

let currentUser = null;
let enrollmentId = null;
let enrollmentData = null;
let assessmentData = null;
let userResponses = [];
let allQuestions = [];
let userScore = 0;
let userPercentage = 0;
let allScores = [];

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
        await loadResultsData();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar resultados', 'error');
    }
});

// Check authentication
async function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('ward_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Load results data
async function loadResultsData() {
    const urlParams = new URLSearchParams(window.location.search);
    enrollmentId = urlParams.get('enrollment_id');

    if (!enrollmentId) {
        showToast('Resultado nao encontrado', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
        return;
    }

    showLoading();

    try {
        // Load enrollment with assessment
        const { data: enrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .select(`
                *,
                self_assessments(*)
            `)
            .eq('id', enrollmentId)
            .eq('user_id', currentUser.id)
            .single();

        if (enrollmentError || !enrollment) {
            showToast('Resultado nao encontrado ou acesso negado', 'error');
            setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
            return;
        }

        enrollmentData = enrollment;
        assessmentData = enrollment.self_assessments;

        // Update assessment info in header
        updateAssessmentInfo();

        // Check if results are ready
        if (!enrollment.completed_at) {
            showToast('Este Self Assessment ainda nao foi concluido', 'error');
            setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
            return;
        }

        // Check if results can be viewed
        const manuallyReleased = !!enrollment.results_released_at;

        if (!manuallyReleased) {
            const releaseTime = new Date(enrollment.completed_at);
            releaseTime.setHours(releaseTime.getHours() + (assessmentData.release_results_after_hours || 24));
            const now = new Date();

            if (now < releaseTime) {
                const hoursLeft = Math.ceil((releaseTime - now) / (1000 * 60 * 60));
                showToast(`Resultado disponivel em ${hoursLeft}h`, 'error');
                setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
                return;
            }
        }

        // Load all questions for this assessment
        const { data: questions, error: questionsError } = await window.supabase
            .from('self_assessment_questions')
            .select('*')
            .eq('self_assessment_id', assessmentData.id);

        if (questionsError) throw questionsError;

        allQuestions = questions || [];

        // Load attempts for this enrollment
        const { data: attemptsData, error: attemptsError } = await window.supabase
            .from('self_assessment_attempts')
            .select('*')
            .eq('enrollment_id', enrollmentId)
            .order('started_at', { ascending: false });

        if (attemptsError) throw attemptsError;

        // Find the latest completed attempt
        const latestAttempt = attemptsData?.find(a => a.status === 'completed') ||
                              attemptsData?.find(a => a.status === 'in_progress') ||
                              attemptsData?.[0];

        // Load user's responses for the latest attempt only
        let responses = [];
        if (latestAttempt) {
            const { data: responsesData, error: responsesError } = await window.supabase
                .from('self_assessment_responses')
                .select('*')
                .eq('attempt_id', latestAttempt.id);

            if (responsesError) throw responsesError;
            responses = responsesData || [];
        }

        userResponses = responses;

        // Calculate and display results
        calculateResults();
        await loadAverages();
        renderPerformanceBySubject();
        renderPerformanceBySystem();
        await renderScoreDistribution();

        // Check retake request status
        checkRetakeStatus();

        hideLoading();
    } catch (error) {
        console.error('Error loading results:', error);
        hideLoading();
        showToast('Erro ao carregar resultados', 'error');
    }
}

// Update assessment info header
function updateAssessmentInfo() {
    const nameEl = document.getElementById('assessment-name');
    const dateEl = document.getElementById('assessment-date');

    if (nameEl && assessmentData) {
        nameEl.textContent = assessmentData.name || 'Self Assessment';
    }

    if (dateEl && enrollmentData?.completed_at) {
        const completedDate = new Date(enrollmentData.completed_at);
        dateEl.textContent = `Concluido em ${completedDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }
}

// Calculate results
function calculateResults() {
    const totalQuestions = allQuestions.length;
    const correctAnswers = userResponses.filter(r => r.is_correct).length;

    userPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Score formula: y = 1.8458x + 107.6 where x is percentage
    userScore = Math.round(1.8458 * userPercentage + 107.6);

    // Update UI elements
    document.getElementById('score-value').textContent = userScore;
    document.getElementById('correct-count').textContent = correctAnswers;
    document.getElementById('total-count').textContent = totalQuestions;
    document.getElementById('percentage').textContent = `${Math.round(userPercentage)}%`;

    // Animate score circle
    animateScoreCircle(userScore);

    // Pass/Fail status (196 is passing)
    const statusEl = document.getElementById('score-status');
    if (userScore >= 196) {
        statusEl.textContent = 'PASS';
        statusEl.className = 'score-status pass';
    } else {
        statusEl.textContent = 'FAIL';
        statusEl.className = 'score-status fail';
    }
}

// Animate the score circle
function animateScoreCircle(score) {
    const progressEl = document.getElementById('score-progress');
    if (!progressEl) return;

    // Calculate progress (score range is ~108 to ~292)
    const minScore = 108;
    const maxScore = 292;
    const normalizedScore = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));
    const degrees = normalizedScore * 360;

    // Determine color based on pass/fail
    const color = score >= 196 ? '#22c55e' : '#ef4444';

    // Animate after a short delay
    setTimeout(() => {
        progressEl.style.setProperty('--progress-deg', `${degrees}deg`);
        progressEl.style.setProperty('--score-color', color);
    }, 300);
}

// Load averages for comparison
let averagesBySubject = {};
let averagesBySystem = {};
let subjectPerformanceData = {};
let systemPerformanceData = {};

async function loadAverages() {
    try {
        // Load all responses for this assessment to calculate averages
        const { data: allResponses, error } = await window.supabase
            .from('self_assessment_responses')
            .select(`
                *,
                self_assessment_questions!inner(question_tags)
            `)
            .in('question_id', allQuestions.map(q => q.id));

        if (error) throw error;

        // Group by subject and system
        const subjectStats = {};
        const systemStats = {};

        allResponses?.forEach(response => {
            const tags = response.self_assessment_questions?.question_tags || '';
            const parts = tags.split('::');
            const subject = parts[0] || 'Unknown';
            const system = parts[1] || 'Unknown';

            // Subject stats
            if (!subjectStats[subject]) {
                subjectStats[subject] = { correct: 0, total: 0 };
            }
            subjectStats[subject].total++;
            if (response.is_correct) subjectStats[subject].correct++;

            // System stats
            if (!systemStats[system]) {
                systemStats[system] = { correct: 0, total: 0 };
            }
            systemStats[system].total++;
            if (response.is_correct) systemStats[system].correct++;
        });

        // Calculate averages
        Object.keys(subjectStats).forEach(subject => {
            averagesBySubject[subject] = subjectStats[subject].total > 0
                ? (subjectStats[subject].correct / subjectStats[subject].total) * 100
                : 0;
        });

        Object.keys(systemStats).forEach(system => {
            averagesBySystem[system] = systemStats[system].total > 0
                ? (systemStats[system].correct / systemStats[system].total) * 100
                : 0;
        });

    } catch (error) {
        console.error('Error loading averages:', error);
    }
}

// Render performance by subject
function renderPerformanceBySubject() {
    const container = document.getElementById('subject-performance');
    const insightsContainer = document.getElementById('subject-insights');

    // Group user responses by subject
    const subjectPerformance = {};

    userResponses.forEach(response => {
        const question = allQuestions.find(q => q.id === response.question_id);
        if (!question) return;

        const tags = question.question_tags || '';
        const subject = tags.split('::')[0] || 'Unknown';

        if (!subjectPerformance[subject]) {
            subjectPerformance[subject] = { correct: 0, total: 0 };
        }
        subjectPerformance[subject].total++;
        if (response.is_correct) subjectPerformance[subject].correct++;
    });

    subjectPerformanceData = subjectPerformance;

    // Sort by percentage (descending)
    const sortedSubjects = Object.entries(subjectPerformance)
        .map(([name, stats]) => ({
            name,
            stats,
            percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage);

    if (sortedSubjects.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Nenhum dado disponivel</p>';
        return;
    }

    container.innerHTML = sortedSubjects.map(item => {
        const avgPercentage = averagesBySubject[item.name] || 0;
        return renderPerformanceBar(item.name, item.stats, item.percentage, avgPercentage);
    }).join('');

    // Render insights
    renderInsights(insightsContainer, sortedSubjects);
}

// Render performance by system
function renderPerformanceBySystem() {
    const container = document.getElementById('system-performance');
    const insightsContainer = document.getElementById('system-insights');

    // Group user responses by system
    const systemPerformance = {};

    userResponses.forEach(response => {
        const question = allQuestions.find(q => q.id === response.question_id);
        if (!question) return;

        const tags = question.question_tags || '';
        const parts = tags.split('::');
        const system = parts[1] || 'Unknown';

        if (!systemPerformance[system]) {
            systemPerformance[system] = { correct: 0, total: 0 };
        }
        systemPerformance[system].total++;
        if (response.is_correct) systemPerformance[system].correct++;
    });

    systemPerformanceData = systemPerformance;

    // Sort by percentage (descending)
    const sortedSystems = Object.entries(systemPerformance)
        .map(([name, stats]) => ({
            name,
            stats,
            percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage);

    if (sortedSystems.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Nenhum dado disponivel</p>';
        return;
    }

    container.innerHTML = sortedSystems.map(item => {
        const avgPercentage = averagesBySystem[item.name] || 0;
        return renderPerformanceBar(item.name, item.stats, item.percentage, avgPercentage);
    }).join('');

    // Render insights
    renderInsights(insightsContainer, sortedSystems);
}

// Render a performance bar
function renderPerformanceBar(name, stats, percentage, avgPercentage) {
    let barClass = 'poor';
    let statsClass = 'poor';
    if (percentage >= 70) {
        barClass = 'good';
        statsClass = 'good';
    } else if (percentage >= 50) {
        barClass = 'medium';
        statsClass = 'medium';
    }

    const diff = percentage - avgPercentage;
    let vsAvgClass = 'equal';
    let vsAvgText = 'Na media';
    let vsAvgIcon = '➖';

    if (diff > 5) {
        vsAvgClass = 'above';
        vsAvgText = `+${Math.round(diff)}% acima da media`;
        vsAvgIcon = '📈';
    } else if (diff < -5) {
        vsAvgClass = 'below';
        vsAvgText = `${Math.round(diff)}% abaixo da media`;
        vsAvgIcon = '📉';
    }

    return `
        <div class="performance-item">
            <div class="performance-header">
                <span class="performance-name">${escapeHtml(name)}</span>
                <span class="performance-stats ${statsClass}">${stats.correct}/${stats.total} (${Math.round(percentage)}%)</span>
            </div>
            <div class="performance-bar-container">
                <div class="performance-bar ${barClass}" style="width: ${percentage}%"></div>
            </div>
            <div class="performance-comparison">
                <span>Media geral: ${Math.round(avgPercentage)}%</span>
                <span class="performance-vs-avg ${vsAvgClass}">${vsAvgIcon} ${vsAvgText}</span>
            </div>
        </div>
    `;
}

// Render insights (strengths and weaknesses)
function renderInsights(container, sortedData) {
    if (!container || sortedData.length < 2) {
        if (container) container.innerHTML = '';
        return;
    }

    // Get top 3 strengths and weaknesses
    const strengths = sortedData.slice(0, 3).filter(item => item.percentage >= 50);
    const weaknesses = [...sortedData].reverse().slice(0, 3).filter(item => item.percentage < 70);

    let html = '';

    if (strengths.length > 0) {
        html += `
            <div class="insight-card strengths">
                <div class="insight-title">
                    <span>💪</span> Pontos Fortes
                </div>
                <ul class="insight-list">
                    ${strengths.map(item => `
                        <li class="insight-item">
                            <span class="insight-name">${escapeHtml(item.name)}</span>
                            <span class="insight-percent">${Math.round(item.percentage)}%</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    if (weaknesses.length > 0) {
        html += `
            <div class="insight-card weaknesses">
                <div class="insight-title">
                    <span>📚</span> Precisa Melhorar
                </div>
                <ul class="insight-list">
                    ${weaknesses.map(item => `
                        <li class="insight-item">
                            <span class="insight-name">${escapeHtml(item.name)}</span>
                            <span class="insight-percent">${Math.round(item.percentage)}%</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Render score distribution chart
async function renderScoreDistribution() {
    const container = document.getElementById('distribution-chart');

    try {
        // Load all completed enrollments for this assessment
        const { data: enrollments, error } = await window.supabase
            .from('self_assessment_enrollments')
            .select('id')
            .eq('self_assessment_id', assessmentData.id)
            .eq('status', 'completed');

        if (error) throw error;

        // Calculate scores for all participants
        const scores = [];

        for (const enrollment of enrollments || []) {
            const { data: responses } = await window.supabase
                .from('self_assessment_responses')
                .select('is_correct')
                .eq('enrollment_id', enrollment.id);

            if (responses && responses.length > 0) {
                const correct = responses.filter(r => r.is_correct).length;
                const total = allQuestions.length;
                const pct = (correct / total) * 100;
                const score = Math.round(1.8458 * pct + 107.6);
                scores.push(score);
            }
        }

        allScores = scores;

        // Calculate percentile
        const percentile = calculatePercentile(userScore, scores);
        updatePercentile(percentile);

        // Create distribution buckets (intervals of 10)
        const buckets = {};
        const minBucket = 100;
        const maxBucket = 300;

        for (let i = minBucket; i <= maxBucket; i += 10) {
            buckets[i] = 0;
        }

        scores.forEach(score => {
            const bucket = Math.floor(score / 10) * 10;
            const clampedBucket = Math.max(minBucket, Math.min(maxBucket, bucket));
            buckets[clampedBucket]++;
        });

        // Find max count for scaling
        const maxCount = Math.max(...Object.values(buckets), 1);

        // Determine user's bucket
        const userBucket = Math.floor(userScore / 10) * 10;
        const clampedUserBucket = Math.max(minBucket, Math.min(maxBucket, userBucket));

        // Render chart
        const chartHtml = Object.entries(buckets).map(([bucket, count]) => {
            const height = maxCount > 0 ? (count / maxCount) * 180 : 0;
            const isUserBucket = parseInt(bucket) === clampedUserBucket;
            const isPassing = parseInt(bucket) >= 190;

            return `
                <div class="chart-bar-wrapper">
                    ${isUserBucket ? '<div class="your-score-indicator">Voce</div>' : ''}
                    ${count > 0 ? `<div class="chart-count">${count}</div>` : ''}
                    <div class="chart-bar ${isUserBucket ? 'highlighted' : ''}" style="height: ${Math.max(height, 4)}px"></div>
                    <div class="chart-label">${bucket}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="chart-container">
                ${chartHtml}
            </div>
        `;

    } catch (error) {
        console.error('Error rendering distribution:', error);
        container.innerHTML = '<p style="color: #666; text-align: center;">Erro ao carregar distribuicao</p>';
    }
}

// Calculate percentile
function calculatePercentile(score, scores) {
    if (scores.length === 0) return 0;

    const belowCount = scores.filter(s => s < score).length;
    return Math.round((belowCount / scores.length) * 100);
}

// Update percentile display
function updatePercentile(percentile) {
    const percentileEl = document.getElementById('percentile');
    const percentileInfoEl = document.getElementById('percentile-info');
    const percentileValueEl = document.getElementById('percentile-value');
    const percentileTextEl = document.getElementById('percentile-text');

    if (percentileEl) {
        percentileEl.textContent = `Top ${100 - percentile}%`;
    }

    if (percentileInfoEl && percentileValueEl && percentileTextEl) {
        percentileInfoEl.style.display = 'block';
        percentileValueEl.textContent = `Top ${100 - percentile}%`;
        percentileTextEl.textContent = `superior a ${percentile}%`;
    }
}

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Activate button (find the clicked button)
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.toLowerCase()) ||
            (tabName === 'subject' && btn.textContent.includes('Subject')) ||
            (tabName === 'system' && btn.textContent.includes('System')) ||
            (tabName === 'distribution' && btn.textContent.includes('Distribuicao'))) {
            btn.classList.add('active');
        }
    });
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Loading functions
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// RETAKE REQUEST FUNCTIONS
// ============================================

// Check and display retake section
function checkRetakeStatus() {
    const retakeSection = document.getElementById('retake-section');
    if (!retakeSection || !enrollmentData) return;

    // Show the section
    retakeSection.style.display = 'flex';

    const titleEl = document.getElementById('retake-title');
    const descEl = document.getElementById('retake-description');
    const actionEl = document.getElementById('retake-action');

    // Check current retake status
    if (enrollmentData.retake_requested_at && !enrollmentData.retake_approved_at && !enrollmentData.retake_denied_at) {
        // Pending request
        titleEl.textContent = 'Solicitacao Enviada';
        descEl.textContent = 'Sua solicitacao de nova tentativa esta sendo analisada pelo mentor.';
        actionEl.innerHTML = '<span class="retake-status pending">⏳ Aguardando Aprovacao</span>';
    } else if (enrollmentData.retake_approved_at) {
        // Approved
        titleEl.textContent = 'Nova Tentativa Aprovada!';
        descEl.textContent = 'Sua solicitacao foi aprovada. Voce pode refazer o Self Assessment.';
        actionEl.innerHTML = `
            <a href="self-assessment-inscricao.html?id=${assessmentData.id}" class="btn-retake" style="text-decoration: none;">
                🚀 Iniciar Nova Tentativa
            </a>
        `;
    } else if (enrollmentData.retake_denied_at) {
        // Denied
        titleEl.textContent = 'Solicitacao Negada';
        descEl.textContent = 'Infelizmente sua solicitacao de nova tentativa nao foi aprovada.';
        actionEl.innerHTML = '<span class="retake-status denied">❌ Solicitacao Negada</span>';
    } else {
        // No request yet - show button
        titleEl.textContent = 'Deseja refazer o Self Assessment?';
        descEl.textContent = 'Solicite uma nova tentativa ao mentor. Sua solicitacao sera analisada.';
        actionEl.innerHTML = `
            <button class="btn-retake" onclick="openRetakeModal()">
                🔄 Solicitar Nova Tentativa
            </button>
        `;
    }
}

// Open retake modal
function openRetakeModal() {
    const modal = document.getElementById('retake-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('retake-reason').value = '';
        document.getElementById('retake-reason').focus();
    }
}

// Close retake modal
function closeRetakeModal() {
    const modal = document.getElementById('retake-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Submit retake request
async function submitRetakeRequest() {
    const reason = document.getElementById('retake-reason').value.trim();

    if (!reason) {
        showToast('Por favor, informe o motivo da solicitacao', 'error');
        return;
    }

    const submitBtn = document.getElementById('btn-submit-retake');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
        const { error } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                retake_requested_at: new Date().toISOString(),
                retake_request_reason: reason,
                retake_approved_at: null,
                retake_denied_at: null
            })
            .eq('id', enrollmentId);

        if (error) throw error;

        // Update local data
        enrollmentData.retake_requested_at = new Date().toISOString();
        enrollmentData.retake_request_reason = reason;
        enrollmentData.retake_approved_at = null;
        enrollmentData.retake_denied_at = null;

        closeRetakeModal();
        checkRetakeStatus();
        showToast('Solicitacao enviada com sucesso!', 'success');

    } catch (error) {
        console.error('Error submitting retake request:', error);
        showToast('Erro ao enviar solicitacao', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Solicitacao';
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('retake-modal');
    if (e.target === modal) {
        closeRetakeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeRetakeModal();
    }
});
