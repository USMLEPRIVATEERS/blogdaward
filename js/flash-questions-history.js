// ===== FLASH QUESTIONS HISTORY =====

let allTests = [];
let filteredTests = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await ensureSupabase();
    await checkAuth();
    await loadUserName();
    await loadTests();
});

// Ensure Supabase is initialized
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

// Check authentication
async function checkAuth() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) {
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
        return null;
    }
    return user;
}

// Load user name
async function loadUserName() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    const nameElement = document.getElementById('user-name');
    if (nameElement) {
        const firstName = (user.name || user.full_name || user.cpf).split(' ')[0];
        nameElement.textContent = firstName;
    }
}

// Load all tests
async function loadTests() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    try {
        const { data: tests, error } = await window.supabase
            .from('flash_tests')
            .select('*')
            .eq('user_id', user.id)
            .order('started_at', { ascending: false });

        if (error) throw error;

        allTests = tests || [];
        filteredTests = allTests;
        renderTests();

    } catch (error) {
        console.error('Error loading tests:', error);
        showToast('Erro ao carregar histórico', 'error');
    }
}

// Filter and sort tests
function filterTests() {
    const statusFilter = document.getElementById('filter-status').value;
    const sortFilter = document.getElementById('filter-sort').value;

    // Filter by status
    filteredTests = allTests.filter(test => {
        if (statusFilter === 'all') return true;
        return test.status === statusFilter;
    });

    // Sort
    filteredTests.sort((a, b) => {
        switch (sortFilter) {
            case 'recent':
                return new Date(b.started_at) - new Date(a.started_at);
            case 'oldest':
                return new Date(a.started_at) - new Date(b.started_at);
            case 'best':
                const scoreA = a.total_questions > 0 ? (a.correct_answers / a.total_questions) : 0;
                const scoreB = b.total_questions > 0 ? (b.correct_answers / b.total_questions) : 0;
                return scoreB - scoreA;
            case 'worst':
                const scoreA2 = a.total_questions > 0 ? (a.correct_answers / a.total_questions) : 0;
                const scoreB2 = b.total_questions > 0 ? (b.correct_answers / b.total_questions) : 0;
                return scoreA2 - scoreB2;
            default:
                return 0;
        }
    });

    renderTests();
}

// Render tests
function renderTests() {
    const listContainer = document.getElementById('test-list');

    if (!filteredTests || filteredTests.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>Nenhum teste encontrado</h3>
                <p>Você ainda não fez nenhum Flash Test. Comece agora!</p>
                <a href="flash-questions-create.html" class="btn-action btn-primary">
                    🚀 Criar Primeiro Teste
                </a>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filteredTests.map(test => {
        const date = new Date(test.started_at);
        const dateStr = date.toLocaleDateString('pt-BR');
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const accuracy = test.total_questions > 0
            ? Math.round((test.correct_answers / test.total_questions) * 100)
            : 0;

        const statusInfo = getStatusInfo(test.status);
        const filters = test.filters || {};
        const step = filters.step || 1;

        return `
            <div class="test-item">
                <div class="test-header">
                    <div class="test-info">
                        <h3>Flash Test - ${test.total_questions} questões</h3>
                        <div class="test-meta">
                            <span>📅 ${dateStr} às ${timeStr}</span>
                            <span>📘 Step ${step}</span>
                        </div>
                        ${renderFilters(filters)}
                    </div>
                    <span class="test-status ${statusInfo.class}">
                        ${statusInfo.icon} ${statusInfo.label}
                    </span>
                </div>

                <div class="test-stats">
                    <div class="test-stat">
                        <div class="test-stat-value">${accuracy}%</div>
                        <div class="test-stat-label">Acertos</div>
                    </div>
                    <div class="test-stat">
                        <div class="test-stat-value">${test.correct_answers || 0}</div>
                        <div class="test-stat-label">Corretas</div>
                    </div>
                    <div class="test-stat">
                        <div class="test-stat-value">${test.incorrect_answers || 0}</div>
                        <div class="test-stat-label">Incorretas</div>
                    </div>
                    <div class="test-stat">
                        <div class="test-stat-value">${formatTime(test.total_time_seconds || 0)}</div>
                        <div class="test-stat-label">Tempo</div>
                    </div>
                </div>

                <div class="test-actions">
                    ${renderActions(test)}
                </div>
            </div>
        `;
    }).join('');
}

// Get status information
function getStatusInfo(status) {
    switch (status) {
        case 'completed':
            return { label: 'Completo', icon: '✓', class: 'status-completed' };
        case 'paused':
            return { label: 'Pausado', icon: '⏸', class: 'status-paused' };
        case 'in_progress':
            return { label: 'Em Progresso', icon: '▶', class: 'status-in-progress' };
        default:
            return { label: 'Desconhecido', icon: '?', class: 'status-paused' };
    }
}

// Render filters
function renderFilters(filters) {
    if (!filters.subjects || filters.subjects.length === 0) {
        return '';
    }

    const subjects = filters.subjects.slice(0, 3); // Show max 3
    const remaining = filters.subjects.length - 3;

    let html = '<div class="test-filters">';
    subjects.forEach(subject => {
        html += `<span class="filter-tag">${subject}</span>`;
    });
    if (remaining > 0) {
        html += `<span class="filter-tag">+${remaining} mais</span>`;
    }
    html += '</div>';

    return html;
}

// Render actions based on test status
function renderActions(test) {
    if (test.status === 'completed') {
        return `
            <a href="flash-questions-test.html?test_id=${test.id}" class="btn-action btn-secondary">
                👁️ Revisar Teste
            </a>
            <button onclick="retakeTest(${test.id})" class="btn-action btn-primary">
                🔄 Refazer Teste
            </button>
        `;
    } else {
        return `
            <a href="flash-questions-test.html?test_id=${test.id}" class="btn-action btn-primary">
                ▶️ Continuar Teste
            </a>
            <button onclick="deleteTest(${test.id})" class="btn-action btn-secondary">
                🗑️ Excluir
            </button>
        `;
    }
}

// Format time
function formatTime(seconds) {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Retake test (create new test with SAME questions for comparison)
async function retakeTest(testId) {
    try {
        const { data: originalTest, error } = await window.supabase
            .from('flash_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (error) throw error;

        const user = JSON.parse(localStorage.getItem('ward_user'));
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // Create new test with SAME question_ids
        const { data: newTest, error: createError } = await window.supabase
            .from('flash_tests')
            .insert({
                user_id: user.id,
                question_ids: originalTest.question_ids, // Same questions!
                total_questions: originalTest.total_questions,
                filters: originalTest.filters,
                status: 'in_progress',
                retake_of_test_id: testId // Track which test this is retaking
            })
            .select()
            .single();

        if (createError) throw createError;

        // Redirect to the new test
        window.location.href = `flash-questions-test.html?test_id=${newTest.id}`;

    } catch (error) {
        console.error('Error retaking test:', error);
        showToast('Erro ao refazer teste', 'error');
    }
}

// Delete test
async function deleteTest(testId) {
    if (!confirm('Tem certeza que deseja excluir este teste?')) {
        return;
    }

    try {
        // Delete responses first
        await window.supabase
            .from('flash_question_responses')
            .delete()
            .eq('test_id', testId);

        // Delete test
        const { error } = await window.supabase
            .from('flash_tests')
            .delete()
            .eq('id', testId);

        if (error) throw error;

        showToast('Teste excluído com sucesso', 'success');
        await loadTests(); // Reload list

    } catch (error) {
        console.error('Error deleting test:', error);
        showToast('Erro ao excluir teste', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    if (window.WardApp && window.WardApp.showToast) {
        window.WardApp.showToast(message, type);
    } else {
        alert(message);
    }
}
