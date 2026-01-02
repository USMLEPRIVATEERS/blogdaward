// ============================================
// FLASH QUESTIONS DASHBOARD
// ============================================

// Wait for Supabase to be ready
async function ensureSupabase() {
    // If already initialized, return
    if (window.supabase && typeof window.supabase.auth !== 'undefined') {
        return;
    }

    // Wait for library to load
    let attempts = 0;
    while (typeof window.supabase?.createClient !== 'function' && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
    }

    // If still not loaded, throw error
    if (typeof window.supabase?.createClient !== 'function') {
        throw new Error('Supabase library not loaded');
    }

    // Initialize if not already done
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
        await loadUserName();
        await loadStatistics();
        await loadPerformanceData();
        await loadRecentTests();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar dashboard', 'error');
    }
});

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

// Load statistics
async function loadStatistics() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

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
            .eq('user_id', user.id);

        document.getElementById('questions-answered').textContent = questionsAnswered || 0;

        // Calculate accuracy rate
        const { data: responses } = await window.supabase
            .from('flash_question_responses')
            .select('is_correct')
            .eq('user_id', user.id);

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
            .eq('user_id', user.id)
            .eq('status', 'completed');

        document.getElementById('tests-completed').textContent = testsCompleted || 0;

    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Erro ao carregar estatísticas', 'error');
    }
}

// Load recent tests
async function loadRecentTests() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    const listContainer = document.getElementById('recent-tests-list');

    try {
        const { data: tests, error } = await window.supabase
            .from('flash_tests')
            .select('*')
            .eq('user_id', user.id)
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

            const actionButton = test.status === 'completed'
                ? `<a href="flash-questions-test.html?test_id=${test.id}" style="padding: 0.5rem 1rem; background: white; color: #d97706; border: 2px solid #d97706; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600; display: inline-block; margin-right: 0.5rem;">👁️ Revisar</a>
                   <button onclick="retakeTest(${test.id})" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">🔄 Refazer</button>`
                : `<a href="flash-questions-test.html?test_id=${test.id}" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: white; border: none; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600; display: inline-block;">▶️ Continuar</a>`;

            return `
                <div class="test-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; margin-bottom: 1rem; background: white; border: 2px solid #f0f0f0; border-radius: 12px;">
                    <div class="test-info" style="flex: 1;">
                        <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">Flash Test - ${test.total_questions} questões</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">${dateStr} às ${timeStr} | ${statusBadge}</p>
                    </div>
                    <div class="test-score" style="text-align: center; margin: 0 2rem;">
                        <div class="percentage" style="font-size: 1.8rem; font-weight: 700; color: #d97706;">${percentage}%</div>
                        <div class="details" style="font-size: 0.85rem; color: #666;">
                            ${test.correct_answers || 0}/${test.total_questions} corretas
                        </div>
                    </div>
                    <div class="test-actions">
                        ${actionButton}
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
        alert('Erro ao refazer teste');
    }
}

// Switch performance tab
function switchPerformanceTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.performance-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update content visibility
    document.querySelectorAll('.performance-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`performance-${tab}`).classList.add('active');
}

// Load performance data
async function loadPerformanceData() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    try {
        // Get all user responses with question details
        const { data: responses, error } = await window.supabase
            .from('flash_question_responses')
            .select(`
                *,
                flash_questions!inner (
                    question_tags
                )
            `)
            .eq('user_id', user.id);

        if (error) throw error;

        if (!responses || responses.length === 0) {
            showNoData();
            return;
        }

        // Parse question tags and calculate performance
        const subjectsPerf = {};
        const systemsPerf = {};
        const categoriesPerf = {};

        responses.forEach(response => {
            const tags = response.flash_questions.question_tags;
            const parts = tags.split('::');

            // Parse: "Subjects::Anatomy::Systems::Cardiovascular::Categories::Embryology"
            let subject = null;
            let system = null;
            let category = null;

            for (let i = 0; i < parts.length; i++) {
                if (parts[i] === 'Subjects' && i + 1 < parts.length) {
                    subject = parts[i + 1];
                } else if (parts[i] === 'Systems' && i + 1 < parts.length) {
                    system = parts[i + 1];
                } else if (parts[i] === 'Categories' && i + 1 < parts.length) {
                    category = parts[i + 1];
                }
            }

            // Track subject performance
            if (subject) {
                if (!subjectsPerf[subject]) {
                    subjectsPerf[subject] = { correct: 0, total: 0 };
                }
                subjectsPerf[subject].total++;
                if (response.is_correct) subjectsPerf[subject].correct++;
            }

            // Track system performance
            if (system) {
                if (!systemsPerf[system]) {
                    systemsPerf[system] = { correct: 0, total: 0 };
                }
                systemsPerf[system].total++;
                if (response.is_correct) systemsPerf[system].correct++;
            }

            // Track category performance
            if (category) {
                if (!categoriesPerf[category]) {
                    categoriesPerf[category] = { correct: 0, total: 0 };
                }
                categoriesPerf[category].total++;
                if (response.is_correct) categoriesPerf[category].correct++;
            }
        });

        // Render performance data
        renderPerformanceData('subjects', subjectsPerf);
        renderPerformanceData('systems', systemsPerf);
        renderPerformanceData('categories', categoriesPerf);

    } catch (error) {
        console.error('Error loading performance data:', error);
        showNoData();
    }
}

// Render performance data
function renderPerformanceData(type, performanceData) {
    // Convert to array and calculate percentages
    const items = Object.entries(performanceData).map(([name, stats]) => ({
        name,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
    }));

    // Filter out items with less than 3 questions (not enough data)
    const filtered = items.filter(item => item.total >= 3);

    if (filtered.length === 0) {
        document.getElementById(`best-${type}`).innerHTML = '<div class="no-data">Dados insuficientes</div>';
        document.getElementById(`worst-${type}`).innerHTML = '<div class="no-data">Dados insuficientes</div>';
        return;
    }

    // Sort by percentage
    const sorted = [...filtered].sort((a, b) => b.percentage - a.percentage);

    // Get best (top 5)
    const best = sorted.slice(0, 5);
    const bestHTML = best.map(item => `
        <div class="performance-item">
            <div class="performance-item-name">${escapeHtml(item.name)}</div>
            <div class="performance-item-stats">
                <div class="performance-item-percentage">${item.percentage}%</div>
                <div class="performance-item-count">${item.correct}/${item.total}</div>
            </div>
        </div>
    `).join('');

    document.getElementById(`best-${type}`).innerHTML = bestHTML || '<div class="no-data">Sem dados</div>';

    // Get worst (bottom 5, reversed)
    const worst = sorted.slice(-5).reverse();
    const worstHTML = worst.map(item => `
        <div class="performance-item">
            <div class="performance-item-name">${escapeHtml(item.name)}</div>
            <div class="performance-item-stats">
                <div class="performance-item-percentage">${item.percentage}%</div>
                <div class="performance-item-count">${item.correct}/${item.total}</div>
            </div>
        </div>
    `).join('');

    document.getElementById(`worst-${type}`).innerHTML = worstHTML || '<div class="no-data">Sem dados</div>';
}

// Show no data message
function showNoData() {
    const types = ['subjects', 'systems', 'categories'];
    types.forEach(type => {
        document.getElementById(`best-${type}`).innerHTML = '<div class="no-data">Nenhuma questão respondida ainda</div>';
        document.getElementById(`worst-${type}`).innerHTML = '<div class="no-data">Nenhuma questão respondida ainda</div>';
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
