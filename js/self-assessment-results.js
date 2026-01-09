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

    console.log('Loading results for enrollment:', enrollmentId, 'user:', currentUser?.id);

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

        console.log('Enrollment data:', enrollment, 'Error:', enrollmentError);

        if (enrollmentError || !enrollment) {
            console.error('Enrollment not found or access denied:', enrollmentError);
            showToast('Resultado nao encontrado ou acesso negado', 'error');
            setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
            return;
        }

        enrollmentData = enrollment;
        assessmentData = enrollment.self_assessments;

        // Check if results are ready
        // Status can be 'completed' or 'awaiting_results' (completed but waiting for release)
        console.log('Checking results access - completed_at:', enrollment.completed_at,
                    'results_released_at:', enrollment.results_released_at,
                    'status:', enrollment.status);

        if (!enrollment.completed_at) {
            console.log('Assessment not completed yet');
            showToast('Este Self Assessment ainda nao foi concluido', 'error');
            setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
            return;
        }

        // Check if results can be viewed:
        // 1. If manually released (results_released_at is set), allow access
        // 2. If 24h have passed since completion, allow access
        const manuallyReleased = !!enrollment.results_released_at;
        console.log('Manually released:', manuallyReleased);

        if (!manuallyReleased) {
            const releaseTime = new Date(enrollment.completed_at);
            releaseTime.setHours(releaseTime.getHours() + (assessmentData.release_results_after_hours || 24));
            const now = new Date();

            console.log('Release time check - completed_at:', enrollment.completed_at,
                        'release_time:', releaseTime.toISOString(),
                        'now:', now.toISOString(),
                        'can_view:', now >= releaseTime);

            if (now < releaseTime) {
                const hoursLeft = Math.ceil((releaseTime - now) / (1000 * 60 * 60));
                showToast(`Resultado disponivel em ${hoursLeft}h`, 'error');
                setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
                return;
            }
        }

        console.log('Access granted, loading results...');

        // Load all questions for this assessment
        const { data: questions, error: questionsError } = await window.supabase
            .from('self_assessment_questions')
            .select('*')
            .eq('self_assessment_id', assessmentData.id);

        if (questionsError) throw questionsError;

        allQuestions = questions || [];

        // Load attempts for this enrollment to find the latest completed one
        const { data: attemptsData, error: attemptsError } = await window.supabase
            .from('self_assessment_attempts')
            .select('*')
            .eq('enrollment_id', enrollmentId)
            .order('started_at', { ascending: false });

        if (attemptsError) throw attemptsError;

        // Find the latest completed attempt, or any attempt if none completed
        const latestAttempt = attemptsData?.find(a => a.status === 'completed') ||
                              attemptsData?.find(a => a.status === 'in_progress') ||
                              attemptsData?.[0];

        console.log('Attempts found:', attemptsData?.length, 'Latest attempt:', latestAttempt?.id);

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

        console.log('Responses loaded for attempt', latestAttempt?.id, ':', responses.length);

        userResponses = responses;

        // Calculate and display results
        calculateResults();
        await loadAverages();
        renderPerformanceBySubject();
        renderPerformanceBySystem();
        await renderScoreDistribution();

        hideLoading();
    } catch (error) {
        console.error('Error loading results:', error);
        hideLoading();
        showToast('Erro ao carregar resultados', 'error');
    }
}

// Calculate results
function calculateResults() {
    // Total questions = all questions in the assessment
    // Score is based on correct answers out of total assessment questions
    const totalQuestions = allQuestions.length;
    const correctAnswers = userResponses.filter(r => r.is_correct).length;

    console.log('Calculating results:', {
        totalQuestionsInAssessment: totalQuestions,
        questionsAnswered: userResponses.length,
        correctAnswers: correctAnswers
    });

    userPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Score formula: y = 1.8458x + 107.6 where x is percentage
    userScore = Math.round(1.8458 * userPercentage + 107.6);

    // Update UI
    document.getElementById('score-value').textContent = userScore;
    document.getElementById('correct-count').textContent = correctAnswers;
    document.getElementById('total-count').textContent = totalQuestions;
    document.getElementById('percentage').textContent = `${Math.round(userPercentage)}%`;

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

// Load averages for comparison
let averagesBySubject = {};
let averagesBySystem = {};

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

    // Sort by total questions (descending)
    const sortedSubjects = Object.entries(subjectPerformance)
        .sort((a, b) => b[1].total - a[1].total);

    if (sortedSubjects.length === 0) {
        container.innerHTML = '<p style="color: #666;">Nenhum dado disponivel</p>';
        return;
    }

    container.innerHTML = sortedSubjects.map(([subject, stats]) => {
        const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        const avgPercentage = averagesBySubject[subject] || 0;

        return renderPerformanceBar(subject, stats, percentage, avgPercentage);
    }).join('');
}

// Render performance by system
function renderPerformanceBySystem() {
    const container = document.getElementById('system-performance');

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

    // Sort by total questions (descending)
    const sortedSystems = Object.entries(systemPerformance)
        .sort((a, b) => b[1].total - a[1].total);

    if (sortedSystems.length === 0) {
        container.innerHTML = '<p style="color: #666;">Nenhum dado disponivel</p>';
        return;
    }

    container.innerHTML = sortedSystems.map(([system, stats]) => {
        const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        const avgPercentage = averagesBySystem[system] || 0;

        return renderPerformanceBar(system, stats, percentage, avgPercentage);
    }).join('');
}

// Render a performance bar
function renderPerformanceBar(name, stats, percentage, avgPercentage) {
    let barClass = 'poor';
    if (percentage >= 70) barClass = 'good';
    else if (percentage >= 50) barClass = 'medium';

    return `
        <div class="performance-item">
            <div class="performance-header">
                <span class="performance-name">${escapeHtml(name)}</span>
                <span class="performance-stats">${stats.correct}/${stats.total} (${Math.round(percentage)}%)</span>
            </div>
            <div class="performance-bar-container">
                <div class="performance-bar ${barClass}" style="width: ${percentage}%"></div>
                <div class="average-marker" style="left: ${avgPercentage}%">
                    <span class="average-label">Media: ${Math.round(avgPercentage)}%</span>
                </div>
            </div>
        </div>
    `;
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
                const total = responses.length;
                const pct = (correct / total) * 100;
                const score = Math.round(1.8458 * pct + 107.6);
                scores.push(score);
            }
        }

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
            const height = maxCount > 0 ? (count / maxCount) * 200 : 0;
            const isUserBucket = parseInt(bucket) === clampedUserBucket;

            return `
                <div class="chart-bar-wrapper">
                    ${isUserBucket ? '<div class="your-score-indicator">Voce</div>' : ''}
                    <div class="chart-count">${count}</div>
                    <div class="chart-bar ${isUserBucket ? 'highlighted' : ''}" style="height: ${height}px"></div>
                    <div class="chart-label">${bucket}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="chart-container">
                ${chartHtml}
            </div>
            <div class="pass-line-container">
                <span class="pass-line-label">Passing Score: 196</span>
            </div>
        `;

    } catch (error) {
        console.error('Error rendering distribution:', error);
        container.innerHTML = '<p style="color: #666; text-align: center;">Erro ao carregar distribuicao</p>';
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

    // Activate button
    event.target.classList.add('active');
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
