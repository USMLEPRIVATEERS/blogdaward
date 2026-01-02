// ============================================
// FLASH QUESTIONS DASHBOARD
// ============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadUserName();
    await loadStatistics();
    await loadRecentTests();
});

// Check authentication
async function checkAuth() {
    if (!window.supabase) {
        showToast('Erro ao conectar com o servidor', 'error');
        return;
    }

    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
}

// Load user name
async function loadUserName() {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await window.supabase
        .from('students')
        .select('name')
        .eq('user_id', session.user.id)
        .single();

    if (profile && profile.name) {
        const nameElement = document.getElementById('user-name');
        if (nameElement) {
            nameElement.textContent = profile.name.split(' ')[0];
        }
    }
}

// Load statistics
async function loadStatistics() {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) return;

    try {
        // Total questions available
        const { count: totalQuestions } = await window.supabase
            .from('flash_questions')
            .select('*', { count: 'exact', head: true });

        document.getElementById('total-questions').textContent = totalQuestions || 0;

        // Questions answered by user
        const { count: questionsAnswered } = await window.supabase
            .from('flash_question_responses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);

        document.getElementById('questions-answered').textContent = questionsAnswered || 0;

        // Calculate accuracy rate
        const { data: responses } = await window.supabase
            .from('flash_question_responses')
            .select('is_correct')
            .eq('user_id', session.user.id);

        if (responses && responses.length > 0) {
            const correctCount = responses.filter(r => r.is_correct).length;
            const accuracy = Math.round((correctCount / responses.length) * 100);
            document.getElementById('accuracy-rate').textContent = `${accuracy}%`;
        } else {
            document.getElementById('accuracy-rate').textContent = '0%';
        }

        // Tests completed
        const { count: testsCompleted } = await window.supabase
            .from('flash_tests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('status', 'completed');

        document.getElementById('tests-completed').textContent = testsCompleted || 0;

    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Erro ao carregar estatísticas', 'error');
    }
}

// Load recent tests
async function loadRecentTests() {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) return;

    const listContainer = document.getElementById('recent-tests-list');

    try {
        const { data: tests, error } = await window.supabase
            .from('flash_tests')
            .select('*')
            .eq('user_id', session.user.id)
            .order('started_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!tests || tests.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>Nenhum teste realizado ainda</p>
                    <a href="flash-questions-create.html" style="color: #d97706; text-decoration: underline;">
                        Criar seu primeiro teste
                    </a>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = tests.map(test => {
            const percentage = test.total_questions > 0
                ? Math.round((test.correct_answers / test.total_questions) * 100)
                : 0;

            const date = new Date(test.started_at);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const statusBadge = test.status === 'completed'
                ? '<span style="color: #22c55e;">✓ Completo</span>'
                : '<span style="color: #f59e0b;">⏸ Pausado</span>';

            return `
                <div class="test-item">
                    <div class="test-info">
                        <h4>Flash Test - ${test.total_questions} questões</h4>
                        <p>${dateStr} às ${timeStr} | ${statusBadge}</p>
                    </div>
                    <div class="test-score">
                        <div class="percentage">${percentage}%</div>
                        <div class="details">
                            ${test.correct_answers}/${test.total_questions} corretas
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recent tests:', error);
        listContainer.innerHTML = `
            <div class="empty-state">
                <p style="color: #ef4444;">Erro ao carregar testes recentes</p>
            </div>
        `;
    }
}
