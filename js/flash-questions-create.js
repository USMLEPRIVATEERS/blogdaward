// ============================================
// FLASH QUESTIONS CREATE TEST
// ============================================

let selectedStep = 1; // Default to Step 1
let selectedSubjects = new Set();
let selectedSystems = new Set();
let selectedCategories = new Set(); // Now stores "system::category" combinations
let availableQuestions = [];
let subjectSystemMap = {}; // Maps subjects to their systems/categories

// Wait for Supabase to be ready
async function ensureSupabase() {
    if (window.supabase && window.supabase.from) return;
    // Wait for app.js proxy to initialize
    let attempts = 0;
    while ((!window.supabase || !window.supabase.from) && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    if (!window.supabase || !window.supabase.from) {
        throw new Error('App not initialized');
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
        // Fetch in batches to avoid any limits
        let questions = [];
        let offset = 0;
        const batchSize = 1000;

        while (true) {
            const { data: batch, error } = await window.supabase
                .from('flash_questions')
                .select('question_id, question_tags')
                .eq('step', selectedStep)
                .range(offset, offset + batchSize - 1);

            if (error) throw error;

            if (!batch || batch.length === 0) break;

            questions = questions.concat(batch);

            // If we got fewer than batchSize, we've reached the end
            if (batch.length < batchSize) break;

            offset += batchSize;
        }

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
                    <div class="category-item select-all-category" onclick="selectAllCategoriesInSystem('${escapeHtml(system)}')">
                        <label style="cursor: pointer; font-weight: 600; color: #d97706;">
                            <input
                                type="checkbox"
                                id="select-all-${escapeHtml(system)}"
                                onchange="event.stopPropagation(); selectAllCategoriesInSystem('${escapeHtml(system)}')"
                            >
                            ✓ Selecionar Todas as Categorias
                        </label>
                    </div>
                    ${categories.map(category => {
                        const compositeKey = `${system}::${category}`;
                        return `
                        <div class="category-item" onclick="toggleCategory('${escapeHtml(system)}', '${escapeHtml(category)}')">
                            <label style="cursor: pointer;">
                                <input
                                    type="checkbox"
                                    id="category-${escapeHtml(compositeKey)}"
                                    onchange="event.stopPropagation(); toggleCategory('${escapeHtml(system)}', '${escapeHtml(category)}')"
                                >
                                ${escapeHtml(category.replace(/_/g, ' '))}
                                <span style="color: #666; font-size: 0.85rem;">
                                    (${systemsMap[system].categories[category]} questões)
                                </span>
                            </label>
                        </div>
                    `}).join('')}
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
function toggleCategory(system, category) {
    const compositeKey = `${system}::${category}`;
    const checkbox = document.getElementById(`category-${compositeKey}`);
    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
        selectedCategories.add(compositeKey);
    } else {
        selectedCategories.delete(compositeKey);
    }

    // Update category item styling
    const item = checkbox.closest('.category-item');
    if (checkbox.checked) {
        item.classList.add('selected');
    } else {
        item.classList.remove('selected');
    }

    // Update "select all" checkbox state for this system
    updateSelectAllCheckbox(system);

    updateAvailableCount();
}

// Select all categories in a system
function selectAllCategoriesInSystem(system) {
    const selectAllCheckbox = document.getElementById(`select-all-${system}`);
    const isChecking = !selectAllCheckbox.checked;
    selectAllCheckbox.checked = isChecking;

    // Get all categories for this system from the current systemsMap
    const systemsMap = {};
    selectedSubjects.forEach(subject => {
        const subjectData = subjectSystemMap[subject];
        if (subjectData && subjectData.systems && subjectData.systems[system]) {
            Object.keys(subjectData.systems[system].categories).forEach(category => {
                systemsMap[category] = true;
            });
        }
    });

    const categories = Object.keys(systemsMap);

    // Toggle all categories
    categories.forEach(category => {
        const compositeKey = `${system}::${category}`;
        const checkbox = document.getElementById(`category-${compositeKey}`);

        if (checkbox) {
            checkbox.checked = isChecking;
            const item = checkbox.closest('.category-item');

            if (isChecking) {
                selectedCategories.add(compositeKey);
                item.classList.add('selected');
            } else {
                selectedCategories.delete(compositeKey);
                item.classList.remove('selected');
            }
        }
    });

    // Update styling for select-all item
    const selectAllItem = selectAllCheckbox.closest('.category-item');
    if (isChecking) {
        selectAllItem.classList.add('selected');
    } else {
        selectAllItem.classList.remove('selected');
    }

    updateAvailableCount();
}

// Update "select all" checkbox state based on individual category selections
function updateSelectAllCheckbox(system) {
    const selectAllCheckbox = document.getElementById(`select-all-${system}`);
    if (!selectAllCheckbox) return;

    // Get all categories for this system
    const systemsMap = {};
    selectedSubjects.forEach(subject => {
        const subjectData = subjectSystemMap[subject];
        if (subjectData && subjectData.systems && subjectData.systems[system]) {
            Object.keys(subjectData.systems[system].categories).forEach(category => {
                systemsMap[category] = true;
            });
        }
    });

    const categories = Object.keys(systemsMap);

    // Check if all categories are selected
    const allSelected = categories.every(category => {
        const compositeKey = `${system}::${category}`;
        return selectedCategories.has(compositeKey);
    });

    selectAllCheckbox.checked = allSelected && categories.length > 0;

    const selectAllItem = selectAllCheckbox.closest('.category-item');
    if (allSelected && categories.length > 0) {
        selectAllItem.classList.add('selected');
    } else {
        selectAllItem.classList.remove('selected');
    }
}

// Update available questions count
async function updateAvailableCount() {
    try {
        // Fetch all questions for selected step in batches
        let questions = [];
        let offset = 0;
        const batchSize = 1000;

        while (true) {
            const { data: batch, error } = await window.supabase
                .from('flash_questions')
                .select('question_id, question_tags')
                .eq('step', selectedStep)
                .range(offset, offset + batchSize - 1);

            if (error) throw error;

            if (!batch || batch.length === 0) break;

            questions = questions.concat(batch);

            if (batch.length < batchSize) break;

            offset += batchSize;
        }

        // Get user's answered questions if "only unseen" is checked
        let answeredQuestionIds = new Set();
        let incorrectQuestionIds = new Set();
        const onlyUnseen = document.getElementById('only-unseen')?.checked;
        const onlyIncorrect = document.getElementById('only-incorrect')?.checked;

        const user = JSON.parse(localStorage.getItem('ward_user'));

        if (onlyUnseen && user) {
            const { data: responses, error: responseError } = await window.supabase
                .from('flash_question_responses')
                .select('question_id')
                .eq('user_id', user.id);

            if (!responseError && responses) {
                answeredQuestionIds = new Set(responses.map(r => r.question_id));
            }
        }

        if (onlyIncorrect && user) {
            const { data: incorrectResponses, error: incorrectError } = await window.supabase
                .from('flash_question_responses')
                .select('question_id')
                .eq('user_id', user.id)
                .eq('is_correct', false);

            if (!incorrectError && incorrectResponses) {
                incorrectQuestionIds = new Set(incorrectResponses.map(r => r.question_id));
            }
        }

        // Filter questions based on selections
        availableQuestions = questions.filter(q => {
            // Exclude answered questions if "only unseen" is checked
            if (onlyUnseen && answeredQuestionIds.has(q.question_id)) {
                return false;
            }

            // Include only incorrect questions if "only incorrect" is checked
            if (onlyIncorrect && !incorrectQuestionIds.has(q.question_id)) {
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

            // If categories are selected, filter by system::category combination
            if (selectedCategories.size > 0) {
                // Build the composite key from the question's system and category
                if (!system || !category) {
                    return false;
                }
                const compositeKey = `${system}::${category}`;
                return selectedCategories.has(compositeKey);
            }

            return true;
        });

        const count = availableQuestions.length;
        document.getElementById('available-count').textContent = count;

        // Enable/disable start button based on available questions
        const btnStart = document.getElementById('btn-start-test');
        if (count > 0) {
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
    const inputValue = document.getElementById('num-questions').value.trim();
    const numQuestions = parseInt(inputValue);

    // Validate number of questions
    if (!inputValue || isNaN(numQuestions) || numQuestions < 1) {
        showToast('Por favor, digite um número válido de questões (mínimo 1)', 'error');
        return;
    }

    if (numQuestions > 40) {
        // Show modal instead of toast
        document.getElementById('max-questions-modal').style.display = 'flex';
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
        // Randomly select questions using Fisher-Yates shuffle algorithm
        // This ensures true randomization and prevents repetition in small batches
        const shuffled = [...availableQuestions];

        // Fisher-Yates shuffle - more efficient and truly random than .sort()
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

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

// Close max questions modal
function closeMaxQuestionsModal() {
    document.getElementById('max-questions-modal').style.display = 'none';
    // Optionally reset to max value
    document.getElementById('num-questions').value = 40;
}
