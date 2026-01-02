// ============================================
// FLASH QUESTIONS CREATE TEST
// ============================================

let selectedStep = 1; // Default to Step 1
let selectedSubjects = new Set();
let selectedSystems = new Set();
let selectedCategories = new Set();
let availableQuestions = [];
let subjectSystemMap = {}; // Maps subjects to their systems/categories

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
        await loadStepCounts();
        await loadSubjects();
        updateAvailableCount();

        // Listen for input changes
        document.getElementById('num-questions').addEventListener('input', updateAvailableCount);
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar página', 'error');
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

// Load step counts
async function loadStepCounts() {
    try {
        for (let step = 1; step <= 3; step++) {
            const { count, error } = await window.supabase
                .from('flash_questions')
                .select('*', { count: 'exact', head: true })
                .eq('step', step);

            if (error) throw error;

            const countElement = document.getElementById(`step-${step}-count`);
            if (countElement) {
                countElement.textContent = `${count || 0} questões`;
            }
        }
    } catch (error) {
        console.error('Error loading step counts:', error);
    }
}

// Select step
function selectStep(step) {
    selectedStep = step;

    // Update radio button
    const radio = document.getElementById(`step-${step}`);
    if (radio) {
        radio.checked = true;
    }

    // Update visual selection
    for (let i = 1; i <= 3; i++) {
        const radio = document.getElementById(`step-${i}`);
        const item = radio?.closest('.subject-item');
        if (item) {
            if (i === step) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
    }

    // Clear selections and reload
    selectedSubjects.clear();
    selectedSystems.clear();
    selectedCategories.clear();

    // Reload subjects for selected step
    loadSubjects();
    updateAvailableCount();
}

// Load subjects from database
async function loadSubjects() {
    const grid = document.getElementById('subjects-grid');

    try {
        // Get all questions for selected step and parse tags
        const { data: questions, error } = await window.supabase
            .from('flash_questions')
            .select('question_id, question_tags')
            .eq('step', selectedStep);

        if (error) throw error;

        // Parse tags and organize by subject
        const subjectMap = {};

        questions.forEach(q => {
            const parts = q.question_tags.split('::');
            if (parts.length >= 1) {
                const subject = parts[0];
                const system = parts.length >= 2 ? parts[1] : null;
                const category = parts.length >= 3 ? parts[2] : null;

                // Add to subject map
                if (!subjectMap[subject]) {
                    subjectMap[subject] = {
                        count: 0,
                        systems: {}
                    };
                }
                subjectMap[subject].count++;

                // Add system and category
                if (system) {
                    if (!subjectMap[subject].systems[system]) {
                        subjectMap[subject].systems[system] = {
                            count: 0,
                            categories: {}
                        };
                    }
                    subjectMap[subject].systems[system].count++;

                    if (category) {
                        if (!subjectMap[subject].systems[system].categories[category]) {
                            subjectMap[subject].systems[system].categories[category] = 0;
                        }
                        subjectMap[subject].systems[system].categories[category]++;
                    }
                }
            }
        });

        // Store for later use
        subjectSystemMap = subjectMap;

        // Render subjects
        const subjects = Object.keys(subjectMap).sort();
        grid.innerHTML = subjects.map(subject => `
            <div class="subject-item" onclick="toggleSubject('${escapeHtml(subject)}')">
                <input
                    type="checkbox"
                    id="subject-${escapeHtml(subject)}"
                    onchange="event.stopPropagation(); toggleSubject('${escapeHtml(subject)}')"
                >
                <div class="subject-name">${escapeHtml(subject)}</div>
                <div class="subject-count">
                    <strong>${subjectMap[subject].count}</strong> questões
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading subjects:', error);
        grid.innerHTML = '<p style="color: #ef4444;">Erro ao carregar assuntos</p>';
    }
}

// Toggle subject selection
function toggleSubject(subject) {
    const checkbox = document.getElementById(`subject-${subject}`);
    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
        selectedSubjects.add(subject);
    } else {
        selectedSubjects.delete(subject);
    }

    // Update subject item styling
    const item = checkbox.closest('.subject-item');
    if (checkbox.checked) {
        item.classList.add('selected');
    } else {
        item.classList.remove('selected');
    }

    updateSystemsSection();
    updateAvailableCount();
}

// Select all subjects
function selectAllSubjects() {
    selectedSubjects.clear();

    Object.keys(subjectSystemMap).forEach(subject => {
        selectedSubjects.add(subject);
        const checkbox = document.getElementById(`subject-${subject}`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.closest('.subject-item').classList.add('selected');
        }
    });

    updateSystemsSection();
    updateAvailableCount();
}

// Update systems section based on selected subjects
function updateSystemsSection() {
    const section = document.getElementById('systems-section');
    const systemsList = document.getElementById('systems-list');

    if (selectedSubjects.size === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Collect all systems from selected subjects
    const systemsMap = {};

    selectedSubjects.forEach(subject => {
        const subjectData = subjectSystemMap[subject];
        if (subjectData && subjectData.systems) {
            Object.entries(subjectData.systems).forEach(([system, data]) => {
                if (!systemsMap[system]) {
                    systemsMap[system] = {
                        count: 0,
                        categories: {}
                    };
                }
                systemsMap[system].count += data.count;

                // Merge categories
                Object.entries(data.categories).forEach(([category, count]) => {
                    if (!systemsMap[system].categories[category]) {
                        systemsMap[system].categories[category] = 0;
                    }
                    systemsMap[system].categories[category] += count;
                });
            });
        }
    });

    // Render systems
    const systems = Object.keys(systemsMap).sort();
    systemsList.innerHTML = systems.map(system => {
        const categories = Object.keys(systemsMap[system].categories).sort();

        return `
            <div class="system-item">
                <div class="system-header" onclick="toggleSystem('${escapeHtml(system)}')">
                    <div>
                        <div class="system-name">${escapeHtml(system.replace(/_/g, ' '))}</div>
                        <div class="system-count">${systemsMap[system].count} questões</div>
                    </div>
                    <span id="system-arrow-${escapeHtml(system)}">▼</span>
                </div>
                <div class="categories-list" id="categories-${escapeHtml(system)}">
                    ${categories.map(category => `
                        <div class="category-item" onclick="toggleCategory('${escapeHtml(category)}')">
                            <label style="cursor: pointer;">
                                <input
                                    type="checkbox"
                                    id="category-${escapeHtml(category)}"
                                    onchange="event.stopPropagation(); toggleCategory('${escapeHtml(category)}')"
                                >
                                ${escapeHtml(category.replace(/_/g, ' '))}
                                <span style="color: #666; font-size: 0.85rem;">
                                    (${systemsMap[system].categories[category]} questões)
                                </span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle system expansion
function toggleSystem(system) {
    const categoriesList = document.getElementById(`categories-${system}`);
    const arrow = document.getElementById(`system-arrow-${system}`);
    const header = arrow.closest('.system-header');

    categoriesList.classList.toggle('expanded');
    arrow.textContent = categoriesList.classList.contains('expanded') ? '▲' : '▼';
}

// Toggle category selection
function toggleCategory(category) {
    const checkbox = document.getElementById(`category-${category}`);
    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
        selectedCategories.add(category);
    } else {
        selectedCategories.delete(category);
    }

    // Update category item styling
    const item = checkbox.closest('.category-item');
    if (checkbox.checked) {
        item.classList.add('selected');
    } else {
        item.classList.remove('selected');
    }

    updateAvailableCount();
}

// Update available questions count
async function updateAvailableCount() {
    try {
        // Build filter based on selections including step
        let query = window.supabase
            .from('flash_questions')
            .select('question_id, question_tags')
            .eq('step', selectedStep);

        const { data: questions, error } = await query;
        if (error) throw error;

        // Get user's answered questions if "only unseen" is checked
        let answeredQuestionIds = new Set();
        const onlyUnseen = document.getElementById('only-unseen')?.checked;

        if (onlyUnseen) {
            const user = JSON.parse(localStorage.getItem('ward_user'));
            if (user) {
                const { data: responses, error: responseError } = await window.supabase
                    .from('flash_question_responses')
                    .select('question_id')
                    .eq('user_id', user.id);

                if (!responseError && responses) {
                    answeredQuestionIds = new Set(responses.map(r => r.question_id));
                }
            }
        }

        // Filter questions based on selections
        availableQuestions = questions.filter(q => {
            // Exclude answered questions if "only unseen" is checked
            if (onlyUnseen && answeredQuestionIds.has(q.question_id)) {
                return false;
            }

            const parts = q.question_tags.split('::');
            const subject = parts[0];
            const system = parts.length >= 2 ? parts[1] : null;
            const category = parts.length >= 3 ? parts[2] : null;

            // If no subjects selected, show all
            if (selectedSubjects.size === 0) {
                return true;
            }

            // Check if subject matches
            if (!selectedSubjects.has(subject)) {
                return false;
            }

            // If categories are selected, filter by them
            if (selectedCategories.size > 0) {
                return category && selectedCategories.has(category);
            }

            return true;
        });

        const count = availableQuestions.length;
        document.getElementById('available-count').textContent = count;

        // Auto-update number of questions input
        const numQuestionsInput = document.getElementById('num-questions');
        const currentValue = parseInt(numQuestionsInput.value) || 10;

        // Set to available count or max 40, whichever is smaller
        const suggestedValue = Math.min(count, 40);

        // Update input value and max attribute
        numQuestionsInput.max = Math.min(count, 40);

        // Only auto-update if current value exceeds available or if it's the default (10)
        if (currentValue > count || currentValue === 10) {
            numQuestionsInput.value = suggestedValue;
        }

        // Enable/disable start button
        const numQuestions = parseInt(numQuestionsInput.value) || 0;
        const btnStart = document.getElementById('btn-start-test');

        if (count > 0 && numQuestions > 0 && numQuestions <= count && numQuestions <= 40) {
            btnStart.disabled = false;
        } else {
            btnStart.disabled = true;
        }

    } catch (error) {
        console.error('Error updating available count:', error);
    }
}

// Start flash test
async function startFlashTest() {
    const numQuestions = parseInt(document.getElementById('num-questions').value);

    if (numQuestions < 1 || numQuestions > 40) {
        showToast('Escolha entre 1 e 40 questões', 'error');
        return;
    }

    if (availableQuestions.length < numQuestions) {
        showToast(`Apenas ${availableQuestions.length} questões disponíveis`, 'error');
        return;
    }

    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Randomly select questions
        const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestionIds = shuffled.slice(0, numQuestions).map(q => q.question_id);

        // Create test record
        const { data: test, error } = await window.supabase
            .from('flash_tests')
            .insert({
                user_id: user.id,
                question_ids: selectedQuestionIds,
                total_questions: numQuestions,
                filters: {
                    step: selectedStep,
                    subjects: Array.from(selectedSubjects),
                    categories: Array.from(selectedCategories)
                },
                status: 'in_progress'
            })
            .select()
            .single();

        if (error) throw error;

        // Redirect to test page
        window.location.href = `flash-questions-test.html?test_id=${test.id}`;

    } catch (error) {
        console.error('Error starting test:', error);
        showToast('Erro ao iniciar teste', 'error');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
