// ========================================
// USMLE PRIVATEERS - Main Application
// We're all in the same boat!
// ========================================

// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// WhatsApp Community Link (only shown after all questions answered)
const WHATSAPP_COMMUNITY_LINK = 'https://chat.whatsapp.com/IMNMOxYJ1tfAXJAb3FsDPJ';

// ========================================
// USER SESSION MANAGEMENT
// ========================================

const USER_STORAGE_KEY = 'privateers_user';
const REJECTED_ANSWERS_KEY = 'privateers_rejected_answers';

function getCurrentUser() {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REJECTED_ANSWERS_KEY);
}

function getRejectedAnswers() {
    const data = localStorage.getItem(REJECTED_ANSWERS_KEY);
    return data ? JSON.parse(data) : {};
}

function setRejectedAnswer(questionId, wasRejected) {
    const rejected = getRejectedAnswers();
    rejected[questionId] = wasRejected;
    localStorage.setItem(REJECTED_ANSWERS_KEY, JSON.stringify(rejected));
}

// ========================================
// AUTHENTICATION
// ========================================

async function login(email, password) {
    try {
        const hashedPassword = btoa(password + '_privateers_salt_2024');

        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (error || !data) {
            showToast('error', 'Erro', 'Email ou senha incorretos');
            return null;
        }

        // Check password (supports both plain and hashed)
        if (data.password_hash !== password && data.password_hash !== hashedPassword) {
            showToast('error', 'Erro', 'Email ou senha incorretos');
            return null;
        }

        // Check if blocked
        if (data.status === 'blocked') {
            showToast('error', 'Conta Bloqueada', 'Sua conta foi bloqueada. Entre em contato com os administradores.');
            return null;
        }

        // Update last login
        await supabaseClient
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);

        // Set user session
        setCurrentUser(data);

        // Log activity
        await logActivity('login');

        // Redirect based on status and role
        if (!data.onboarding_completed) {
            window.location.href = 'onboarding.html';
        } else {
            redirectByRole(data.role);
        }

        return data;
    } catch (err) {
        console.error('Login error:', err);
        showToast('error', 'Erro', 'Ocorreu um erro ao fazer login');
        return null;
    }
}

async function register(fullName, email, whatsapp, password) {
    try {
        // Check if email already exists
        const { data: existing } = await supabaseClient
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existing) {
            showToast('error', 'Erro', 'Este email já está cadastrado');
            return null;
        }

        const hashedPassword = btoa(password + '_privateers_salt_2024');

        const { data, error } = await supabaseClient
            .from('users')
            .insert({
                full_name: fullName.trim(),
                email: email.toLowerCase().trim(),
                whatsapp: whatsapp.trim(),
                password_hash: hashedPassword,
                role: 'membro',
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Registration error:', error);
            showToast('error', 'Erro', 'Ocorreu um erro ao criar sua conta');
            return null;
        }

        // Set user session
        setCurrentUser(data);

        // Log activity
        await logActivity('register');

        showToast('success', 'Bem-vindo!', 'Conta criada com sucesso!');

        // Go to onboarding
        setTimeout(() => {
            window.location.href = 'onboarding.html';
        }, 1500);

        return data;
    } catch (err) {
        console.error('Registration error:', err);
        showToast('error', 'Erro', 'Ocorreu um erro ao criar sua conta');
        return null;
    }
}

async function logout() {
    await logActivity('logout');
    clearCurrentUser();
    window.location.href = 'index.html';
}

function redirectByRole(role) {
    switch (role) {
        case 'fundador':
            window.location.href = 'founder-dashboard.html';
            break;
        case 'adm':
            window.location.href = 'adm-dashboard.html';
            break;
        default:
            window.location.href = 'dashboard.html';
    }
}

// ========================================
// AUTH CHECK
// ========================================

async function checkAuth(requiredRoles = null) {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = 'index.html';
        return null;
    }

    // Check if user still exists and is active
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !data || data.status === 'blocked') {
        clearCurrentUser();
        window.location.href = 'index.html';
        return null;
    }

    // Update local user data
    setCurrentUser(data);

    // Check role if required
    if (requiredRoles && !requiredRoles.includes(data.role)) {
        showToast('error', 'Acesso Negado', 'Você não tem permissão para acessar esta página');
        redirectByRole(data.role);
        return null;
    }

    // Set RLS context
    await setRLSContext(data.id, data.role);

    return data;
}

async function setRLSContext(userId, userRole) {
    try {
        await supabaseClient.rpc('set_config', {
            setting: 'app.current_user_id',
            value: userId
        });
        await supabaseClient.rpc('set_config', {
            setting: 'app.current_user_role',
            value: userRole
        });
    } catch (err) {
        console.log('RLS context set (may not be available):', err);
    }
}

// ========================================
// RESPONSE VALIDATION
// ========================================

const INVALID_RESPONSE_PATTERNS = [
    /^[\.\-_\s]+$/, // Only dots, dashes, underscores, spaces
    /^\.{2,}$/,     // Multiple dots
    /^-{2,}$/,      // Multiple dashes
    /^_{2,}$/,      // Multiple underscores
    /^[a-z]$/i,     // Single letter
    /^(n\/a|na|nao|não|no|nada|nenhum|none)$/i, // Common non-answers
    /^(x|xx|xxx|xxxx)$/i, // X patterns
    /^[0-9]$/,      // Single digit
    /^(a|aa|aaa|aaaa)$/i, // Repeated letters
    /^(teste?|test)$/i, // Test
    /^(asdf|qwerty|zxcv)$/i, // Keyboard patterns
    /^(.)\1{2,}$/, // Same character repeated 3+ times
];

const MIN_MEANINGFUL_LENGTH = 3;

function validateResponse(value, questionType) {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return { valid: false, reason: 'empty' };
    }

    // Convert to string for text-based validation
    const strValue = String(value).trim();

    // Check for empty
    if (strValue === '') {
        return { valid: false, reason: 'empty' };
    }

    // For boolean/checkbox, any value is fine
    if (questionType === 'boolean' || questionType === 'checkbox') {
        return { valid: true };
    }

    // For select/multiselect/radio, any selection is valid
    if (['select', 'multiselect', 'radio', 'scale'].includes(questionType)) {
        return { valid: true };
    }

    // For number type
    if (questionType === 'number') {
        return isNaN(Number(value)) ? { valid: false, reason: 'invalid_number' } : { valid: true };
    }

    // For date type
    if (questionType === 'date') {
        return isNaN(Date.parse(value)) ? { valid: false, reason: 'invalid_date' } : { valid: true };
    }

    // For text and textarea - thorough validation
    if (['text', 'textarea'].includes(questionType)) {
        // Check minimum length
        if (strValue.length < MIN_MEANINGFUL_LENGTH) {
            return { valid: false, reason: 'too_short' };
        }

        // Check against invalid patterns
        for (const pattern of INVALID_RESPONSE_PATTERNS) {
            if (pattern.test(strValue)) {
                return { valid: false, reason: 'invalid_pattern' };
            }
        }

        // Check if mostly non-alphanumeric
        const alphanumericChars = strValue.replace(/[^a-zA-Z0-9]/g, '').length;
        if (alphanumericChars < MIN_MEANINGFUL_LENGTH) {
            return { valid: false, reason: 'not_meaningful' };
        }
    }

    return { valid: true };
}

function getValidationMessage(reason) {
    const messages = {
        empty: 'Por favor, preencha este campo.',
        too_short: 'A resposta é muito curta. Por favor, elabore mais.',
        invalid_pattern: 'Nossa equipe avaliou sua resposta anterior e precisa que você forneça uma resposta mais detalhada.',
        not_meaningful: 'Por favor, forneça uma resposta significativa.',
        invalid_number: 'Por favor, insira um número válido.',
        invalid_date: 'Por favor, insira uma data válida.',
        rejected: 'Nossa equipe avaliou sua resposta anterior. Por favor, forneça uma resposta mais completa e significativa.'
    };
    return messages[reason] || 'Por favor, verifique sua resposta.';
}

// ========================================
// QUESTIONNAIRE SYSTEM
// ========================================

let currentQuestions = [];
let currentQuestionIndex = 0;
let pendingQuestionModal = null;

async function loadQuestions(category = null) {
    let query = supabaseClient
        .from('questionnaire_questions')
        .select('*')
        .eq('is_active', true)
        .order('hierarchy_level', { ascending: true })
        .order('order_position', { ascending: true });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error loading questions:', error);
        return [];
    }

    return data;
}

async function getUserResponses() {
    const user = getCurrentUser();
    if (!user) return {};

    const { data, error } = await supabaseClient
        .from('questionnaire_responses')
        .select('question_id, response')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error loading responses:', error);
        return {};
    }

    // Convert to map
    const responses = {};
    data.forEach(r => {
        responses[r.question_id] = r.response;
    });

    return responses;
}

async function getNextUnansweredQuestion() {
    const user = getCurrentUser();
    if (!user) return null;

    const questions = await loadQuestions();
    const responses = await getUserResponses();
    const rejected = getRejectedAnswers();

    // Find questions without valid responses
    for (const question of questions) {
        const hasResponse = responses.hasOwnProperty(question.id);
        const wasRejected = rejected[question.id];

        // Check if show_condition is met
        if (question.show_condition) {
            const condition = question.show_condition;
            const dependentResponse = responses[condition.question_id];
            if (!dependentResponse || dependentResponse !== condition.value) {
                continue; // Skip this question
            }
        }

        // If no response or was rejected, show this question
        if (!hasResponse || wasRejected) {
            return { question, wasRejected };
        }
    }

    return null; // All questions answered
}

async function saveQuestionResponse(questionId, response, questionType) {
    const user = getCurrentUser();
    if (!user) return false;

    // Validate response
    const validation = validateResponse(response, questionType);
    if (!validation.valid) {
        // Mark as rejected for next time
        setRejectedAnswer(questionId, true);
        return { success: false, reason: validation.reason };
    }

    try {
        // Upsert response
        const { error } = await supabaseClient
            .from('questionnaire_responses')
            .upsert({
                user_id: user.id,
                question_id: questionId,
                response: response,
                answered_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,question_id'
            });

        if (error) {
            console.error('Error saving response:', error);
            return { success: false, reason: 'save_error' };
        }

        // Clear rejected flag
        setRejectedAnswer(questionId, false);

        // Log activity
        await logActivity('question_answered', { question_id: questionId });

        return { success: true };
    } catch (err) {
        console.error('Error saving response:', err);
        return { success: false, reason: 'save_error' };
    }
}

async function checkQuestionsCompleted() {
    const result = await getNextUnansweredQuestion();
    return result === null;
}

async function updateUserQuestionnaireStatus() {
    const user = getCurrentUser();
    if (!user) return;

    const completed = await checkQuestionsCompleted();

    if (completed && !user.questionnaire_completed) {
        const { error } = await supabaseClient
            .from('users')
            .update({
                questionnaire_completed: true,
                whatsapp_access_granted: true
            })
            .eq('id', user.id);

        if (!error) {
            user.questionnaire_completed = true;
            user.whatsapp_access_granted = true;
            setCurrentUser(user);
        }
    }
}

// ========================================
// QUESTION MODAL SYSTEM
// Lightweight question prompts during navigation
// ========================================

function createQuestionModal(question, wasRejected = false) {
    // Remove existing modal
    const existingModal = document.getElementById('question-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'question-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3 class="modal-title">
                    ${wasRejected ? '⚠️ Resposta Necessária' : '📝 Conte-nos mais sobre você'}
                </h3>
                <button class="modal-close" onclick="closeQuestionModal(true)">&times;</button>
            </div>
            <div class="modal-body">
                ${wasRejected ? `
                    <div class="alert alert-warning mb-3" style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                        <strong>Nossa equipe avaliou sua resposta anterior</strong><br>
                        Por favor, forneça uma resposta mais completa e significativa.
                    </div>
                ` : ''}

                <p class="mb-2" style="font-weight: 500; color: #333;">${question.question_text}</p>

                ${question.description ? `<p class="text-muted mb-3" style="font-size: 0.9rem;">${question.description}</p>` : ''}

                <div class="form-group mb-0">
                    ${renderQuestionInput(question)}
                </div>

                <p id="question-error" class="form-error" style="display: none;"></p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeQuestionModal(true)">Responder Depois</button>
                <button class="btn btn-primary" onclick="submitQuestionResponse('${question.id}', '${question.question_type}')">
                    Enviar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Show modal with animation
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    pendingQuestionModal = question;
}

function renderQuestionInput(question) {
    const type = question.question_type;
    const options = question.options || [];

    switch (type) {
        case 'text':
            return `<input type="text" id="question-input" class="form-input" placeholder="Digite sua resposta..." />`;

        case 'textarea':
            return `<textarea id="question-input" class="form-textarea" placeholder="Digite sua resposta..." rows="4"></textarea>`;

        case 'number':
            return `<input type="number" id="question-input" class="form-input" placeholder="Digite um número..." />`;

        case 'date':
            return `<input type="date" id="question-input" class="form-input" />`;

        case 'select':
            return `
                <select id="question-input" class="form-select">
                    <option value="">Selecione uma opção...</option>
                    ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
            `;

        case 'multiselect':
            return `
                <div class="checkbox-group" id="question-input">
                    ${options.map(opt => `
                        <label class="form-check mb-2">
                            <input type="checkbox" value="${opt.value}" />
                            <span class="form-check-label">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            `;

        case 'radio':
            return `
                <div class="radio-group" id="question-input">
                    ${options.map(opt => `
                        <label class="form-check mb-2">
                            <input type="radio" name="question-radio" value="${opt.value}" />
                            <span class="form-check-label">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            `;

        case 'scale':
            return `
                <div class="scale-input" id="question-input">
                    <div class="d-flex justify-between mb-2">
                        ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                            <label class="scale-option">
                                <input type="radio" name="question-scale" value="${n}" />
                                <span class="scale-number">${n}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="d-flex justify-between">
                        <span class="text-muted" style="font-size: 0.8rem;">Nenhum conhecimento</span>
                        <span class="text-muted" style="font-size: 0.8rem;">Expert</span>
                    </div>
                </div>
                <style>
                    .scale-option { text-align: center; }
                    .scale-option input { display: none; }
                    .scale-number {
                        display: inline-block;
                        width: 32px;
                        height: 32px;
                        line-height: 32px;
                        text-align: center;
                        border-radius: 50%;
                        border: 2px solid #dee2e6;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .scale-option input:checked + .scale-number {
                        background: #b8565c;
                        border-color: #b8565c;
                        color: white;
                    }
                    .scale-number:hover {
                        border-color: #b8565c;
                    }
                </style>
            `;

        case 'boolean':
            return `
                <div class="boolean-input" id="question-input">
                    <label class="form-check mb-2">
                        <input type="radio" name="question-boolean" value="true" />
                        <span class="form-check-label">Sim</span>
                    </label>
                    <label class="form-check mb-2">
                        <input type="radio" name="question-boolean" value="false" />
                        <span class="form-check-label">Não</span>
                    </label>
                </div>
            `;

        default:
            return `<input type="text" id="question-input" class="form-input" placeholder="Digite sua resposta..." />`;
    }
}

function getQuestionInputValue(type) {
    const input = document.getElementById('question-input');
    if (!input) return null;

    switch (type) {
        case 'multiselect':
            const checked = input.querySelectorAll('input:checked');
            return Array.from(checked).map(cb => cb.value);

        case 'radio':
        case 'scale':
        case 'boolean':
            const selected = input.querySelector('input:checked');
            return selected ? selected.value : null;

        default:
            return input.value;
    }
}

async function submitQuestionResponse(questionId, questionType) {
    const value = getQuestionInputValue(questionType);
    const errorEl = document.getElementById('question-error');

    // Validate
    const validation = validateResponse(value, questionType);
    if (!validation.valid) {
        errorEl.textContent = getValidationMessage(validation.reason);
        errorEl.style.display = 'block';
        return;
    }

    // Save response
    const result = await saveQuestionResponse(questionId, value, questionType);

    if (result.success) {
        showToast('success', 'Obrigado!', 'Sua resposta foi salva.');
        closeQuestionModal(false);
        pendingQuestionModal = null;

        // Check if more questions
        await updateUserQuestionnaireStatus();
    } else {
        // Mark as rejected for next time
        setRejectedAnswer(questionId, true);
        errorEl.textContent = getValidationMessage(result.reason);
        errorEl.style.display = 'block';
    }
}

function closeQuestionModal(skipForNow = false) {
    const modal = document.getElementById('question-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    // If skipped, mark for next time (will show rejection message)
    if (skipForNow && pendingQuestionModal) {
        // Don't mark as rejected if just closing, but next time same question will appear
    }
}

// Show question on page load if user hasn't completed all
async function maybeShowQuestionPrompt() {
    const user = getCurrentUser();
    if (!user || user.questionnaire_completed) return;

    // Small delay so page content loads first
    setTimeout(async () => {
        const nextQuestion = await getNextUnansweredQuestion();
        if (nextQuestion) {
            createQuestionModal(nextQuestion.question, nextQuestion.wasRejected);
        }
    }, 2000);
}

// ========================================
// ACTIVITY LOGGING
// ========================================

async function logActivity(actionType, details = {}) {
    const user = getCurrentUser();
    if (!user) return;

    try {
        await supabaseClient
            .from('user_activity_log')
            .insert({
                user_id: user.id,
                action_type: actionType,
                action_details: details,
                page_url: window.location.pathname
            });
    } catch (err) {
        console.log('Activity log error:', err);
    }
}

// ========================================
// STATS FUNCTIONS
// ========================================

async function loadMemberStats() {
    try {
        const { data, error } = await supabaseClient
            .from('member_stats')
            .select('*')
            .single();

        if (error) {
            console.error('Error loading stats:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Error loading stats:', err);
        return null;
    }
}

async function loadRecentPosts(limit = 5) {
    try {
        const { data, error } = await supabaseClient
            .from('active_blog_posts')
            .select('*')
            .limit(limit);

        if (error) {
            console.error('Error loading posts:', error);
            return [];
        }

        return data;
    } catch (err) {
        console.error('Error loading posts:', err);
        return [];
    }
}

// ========================================
// UI HELPERS
// ========================================

function showToast(type, title, message) {
    // Create toast container if not exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
        return 'agora';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} min atrás`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h atrás`;
    }

    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d atrás`;
    }

    // Otherwise show date
    return date.toLocaleDateString('pt-BR');
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getRoleBadge(role) {
    switch (role) {
        case 'fundador':
            return '<span class="founder-badge">👑 Fundador</span>';
        case 'adm':
            return '<span class="adm-badge">⚡ ADM</span>';
        default:
            return '<span class="member-badge">🏴‍☠️ Membro</span>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// NAVIGATION
// ========================================

function renderNavbar(activePage = '') {
    const user = getCurrentUser();
    const isFounder = user && user.role === 'fundador';
    const isAdm = user && user.role === 'adm';

    return `
        <header class="header">
            <a href="${user ? 'dashboard.html' : 'index.html'}" class="header-logo">
                <span>🏴‍☠️</span>
                <span>USMLE Privateers</span>
            </a>

            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">
                ☰
            </button>

            <nav class="nav-menu" id="nav-menu">
                ${user ? `
                    <a href="blog.html" class="nav-link ${activePage === 'blog' ? 'active' : ''}">
                        📰 Blog
                    </a>
                    <a href="wiki.html" class="nav-link ${activePage === 'wiki' ? 'active' : ''}">
                        📚 Wiki
                    </a>
                    <a href="whatsapp.html" class="nav-link ${activePage === 'whatsapp' ? 'active' : ''}">
                        💬 WhatsApp
                    </a>
                    <a href="profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">
                        👤 Perfil
                    </a>
                    ${isFounder || isAdm ? `
                        <a href="${isFounder ? 'founder-dashboard.html' : 'adm-dashboard.html'}" class="nav-link ${activePage === 'admin' ? 'active' : ''}">
                            ⚙️ Admin
                        </a>
                    ` : ''}
                ` : `
                    <a href="index.html" class="nav-link">🏠 Home</a>
                `}
            </nav>

            <div class="nav-user">
                ${user ? `
                    <div class="nav-user-avatar">${getInitials(user.full_name)}</div>
                    <div class="nav-user-info">
                        <span class="nav-user-name">${user.full_name.split(' ')[0]}</span>
                        <span class="nav-user-role">${user.role}</span>
                    </div>
                    <button class="btn-logout" onclick="logout()">Sair</button>
                ` : `
                    <a href="login.html" class="btn btn-outline-white btn-sm">Entrar</a>
                `}
            </div>
        </header>
    `;
}

function toggleMobileMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

function renderFooter() {
    return `
        <footer class="footer">
            <div class="container">
                <p class="footer-text">
                    © ${new Date().getFullYear()} USMLE Privateers. All rights reserved.
                </p>
                <p class="footer-text mt-2">
                    Engineered for Excellence • Built with <span class="footer-heart">❤️</span> for Future Physicians
                </p>
                <p class="footer-text mt-2" style="font-style: italic;">
                    We're all in the same boat! 🏴‍☠️
                </p>
            </div>
        </footer>
    `;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Add Google Fonts
    if (!document.querySelector('link[href*="Inter"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        document.head.appendChild(link);
    }
});

// Export for use in other scripts
window.PrivateersApp = {
    // Auth
    login,
    register,
    logout,
    checkAuth,
    getCurrentUser,

    // Questionnaire
    loadQuestions,
    getUserResponses,
    getNextUnansweredQuestion,
    saveQuestionResponse,
    checkQuestionsCompleted,
    maybeShowQuestionPrompt,
    createQuestionModal,
    validateResponse,

    // Stats
    loadMemberStats,
    loadRecentPosts,

    // UI
    showToast,
    formatDate,
    getInitials,
    getRoleBadge,
    escapeHtml,
    renderNavbar,
    renderFooter,

    // Activity
    logActivity,

    // Constants
    WHATSAPP_COMMUNITY_LINK
};
