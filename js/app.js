// ===== WARD ACADEMY - MAIN APPLICATION =====

// Supabase Configuration
const SUPABASE_URL = 'https://yxtdesthusclivjdewfl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGRlc3RodXNjbGl2amRld2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDUzMzYsImV4cCI6MjA4MjcyMTMzNn0.OQgK2s8K7CKJKyIwx7I6jnExTdCBpgiM7KfZuqhbPbw';

// Initialize Supabase Client
let supabaseClient = null;

// Wait for supabase CDN to be loaded and initialize
function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Expose the initialized client globally so all pages can use supabase.from()
        window.supabase = supabaseClient;
        return true;
    }
    return false;
}

// Initialize supabase immediately if available, otherwise wait for DOM
if (!initSupabase()) {
    document.addEventListener('DOMContentLoaded', function() {
        // Retry initialization after DOM is ready
        setTimeout(initSupabase, 100);
    });
}

// ===== UTILITY FUNCTIONS =====

// Show toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : '!'}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Show loading overlay
function showLoading() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Format date to Brazilian format (DD/MM/YYYY)
// Handles date strings without timezone conversion issues
function formatDate(date) {
    if (!date) return '';

    // If it's a YYYY-MM-DD string, parse directly without timezone conversion
    const dateStr = typeof date === 'string' ? date : date.toString();
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        const [_, year, month, day] = match;
        return `${day}/${month}/${year}`;
    }

    // Fallback for other formats
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
}

// Format date to input format (YYYY-MM-DD)
// Returns date string without timezone conversion
function formatDateInput(date) {
    if (!date) return '';

    // If already in YYYY-MM-DD format, return as is
    const dateStr = typeof date === 'string' ? date : date.toString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // If it's an ISO string, extract date part
    if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
    }

    // Fallback
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get today's date in YYYY-MM-DD format (local timezone)
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Parse date string to Date object in local timezone
// Avoids timezone issues by treating YYYY-MM-DD as local date
function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [_, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateStr);
}

// Calculate days remaining
function daysRemaining(deadline) {
    const today = getTodayString();
    const todayDate = parseLocalDate(today);
    const deadlineDate = parseLocalDate(deadline);
    const diffTime = deadlineDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// ===== DATA FORMATTING HELPERS =====
// Internal string processing utilities for data normalization

const _dfh = {
    _s: [87,52,114,100,65,99,52,100,51,109,121,50,48,50,53,83,51,99,117,114,51,75,51,121,33,64,35,36,37,94,38,42],
    _g: function() { return this._s.map(c => String.fromCharCode(c)).join(''); }
};

// Format string for storage (normalize encoding)
function _fmtStr(t) {
    if (!t || typeof t !== 'string') return t;
    try {
        const k = _dfh._g();
        let r = '';
        for (let i = 0; i < t.length; i++) {
            r += String.fromCharCode(t.charCodeAt(i) ^ k.charCodeAt(i % k.length));
        }
        return btoa(unescape(encodeURIComponent(r)));
    } catch (e) { return t; }
}

// Parse formatted string (restore encoding)
// Auto-detects if string is formatted or plain
function _parseStr(t) {
    if (!t || typeof t !== 'string') return t;
    // Check if looks like base64 encoded (formatted data)
    if (!/^[A-Za-z0-9+/]+=*$/.test(t) || t.length < 8) return t;
    // Check if it looks like normal text (email, name, cpf pattern)
    if (t.includes('@') || t.includes('.') || /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(t)) return t;
    try {
        const k = _dfh._g();
        const d = decodeURIComponent(escape(atob(t)));
        let r = '';
        for (let i = 0; i < d.length; i++) {
            r += String.fromCharCode(d.charCodeAt(i) ^ k.charCodeAt(i % k.length));
        }
        // Validate result looks like readable text
        if (/^[\x20-\x7E\xA0-\xFF]+$/.test(r)) return r;
        return t; // Return original if decryption produced garbage
    } catch (e) { return t; }
}

// Batch format for objects
function _fmtObj(obj, fields) {
    if (!obj) return obj;
    const result = { ...obj };
    fields.forEach(f => {
        if (result[f]) result[f] = _fmtStr(result[f]);
    });
    return result;
}

// Batch parse for objects
function _parseObj(obj, fields) {
    if (!obj) return obj;
    const result = { ...obj };
    fields.forEach(f => {
        if (result[f]) result[f] = _parseStr(result[f]);
    });
    return result;
}

// Fields for data processing (non-searchable fields only)
// Note: cpf and email are used for login search, so handled separately
const _sflds = ['full_name', 'phone'];

// ===== AUTHENTICATION =====

// Check if user is logged in
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

// Login function - supports both old system and Supabase Auth
async function login(cpf, password) {
    showLoading();
    try {
        // Check credentials in Supabase
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                hideLoading();
                showToast('Erro de conexão. Recarregue a página.', 'error');
                return false;
            }
        }

        // First, find user by CPF
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('cpf', cpf)
            .single();

        if (error || !data) {
            hideLoading();
            showToast('CPF ou senha incorretos', 'error');
            return false;
        }

        // Check if user is inactive
        if (data.status === 'inactive') {
            hideLoading();
            showToast('Esta conta está inativa. Entre em contato com o administrador.', 'error');
            return false;
        }

        // If user has auth_id, use ONLY Supabase Auth (no fallback to legacy)
        if (data.auth_id && data.email) {
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                email: data.email,
                password: password
            });

            if (authError || !authData.user) {
                hideLoading();
                console.error('Supabase Auth error:', authError?.message);
                showToast('CPF ou senha incorretos', 'error');
                return false;
            }
            console.log('Login via Supabase Auth successful');
        } else {
            // Legacy login for users not yet migrated to Auth
            const hashedPassword = btoa(password + '_ward_salt_2024');
            if (data.password_hash !== password && data.password_hash !== hashedPassword) {
                hideLoading();
                showToast('CPF ou senha incorretos', 'error');
                return false;
            }
            console.log('Login via legacy system');
        }

        // Normalize and process user data
        const processedData = _parseObj(data, _sflds);
        const userData = {
            ...processedData,
            name: processedData.name || processedData.full_name || processedData.cpf
        };

        // Store user data
        localStorage.setItem('ward_user', JSON.stringify(userData));

        hideLoading();

        // Check if first login or questionnaire not complete
        if (!data.first_login_completed) {
            // Redirect to the correct questionnaire step based on progress
            const step = data.questionnaire_step || 0;
            const stepUrls = {
                0: 'questionnaire/step1-basic-data.html',
                1: 'questionnaire/step2-usmle-data.html',
                2: 'questionnaire/step3-uworld-prep.html',
                3: 'questionnaire/step4-uworld-progress.html',
                4: 'questionnaire/step5-english.html',
                5: 'questionnaire/step6-anki.html',
                6: 'questionnaire/step7-research-1.html',
                7: 'questionnaire/step8-research-2.html',
                8: 'questionnaire/step9-research-3.html',
                9: 'questionnaire/step10-observerships.html',
                10: 'questionnaire/step11-background.html',
                11: 'questionnaire/step11-background.html'
            };
            window.location.href = stepUrls[step] || stepUrls[0];
        } else {
            // Redirect based on role
            switch (data.role) {
                case 'mentor_marcos':
                    window.location.href = 'mentor-dashboard-marcos.html';
                    break;
                case 'mentor_iria':
                    window.location.href = 'mentor-dashboard-iria.html';
                    break;
                case 'mentor_guilherme':
                    window.location.href = 'mentor-dashboard-guilherme.html';
                    break;
                case 'mentor_romulo':
                    window.location.href = 'mentor-dashboard-romulo.html';
                    break;
                case 'assessoria':
                    window.location.href = 'dashboard-assessoria-avulsa.html';
                    break;
                case 'externo':
                    window.location.href = 'dashboard-externo.html';
                    break;
                default:
                    window.location.href = 'dashboard.html';
            }
        }
        return true;
    } catch (err) {
        hideLoading();
        console.error('Login error:', err);
        showToast('Erro ao fazer login. Tente novamente.', 'error');
        return false;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('ward_user');
    window.location.href = 'index.html';
}

// ===== QUESTIONNAIRE FUNCTIONS =====

// Save questionnaire progress
async function saveQuestionnaireProgress(step, data) {
    const user = await checkAuth();
    if (!user) return false;

    // Determine which user's data to save (support view_as mode for mentors)
    let targetUserId = user.id;

    // FIRST: Check URL parameter (takes priority)
    const urlParams = new URLSearchParams(window.location.search);
    const urlViewAs = urlParams.get('view_as');

    if (urlViewAs && user.role && user.role.startsWith('mentor')) {
        // Mentor accessing with ?view_as parameter
        targetUserId = parseInt(urlViewAs);
    } else {
        // SECOND: Check localStorage as fallback
        const viewAsData = JSON.parse(localStorage.getItem('view_as_student') || 'null');
        if (viewAsData && user.role && user.role.startsWith('mentor')) {
            targetUserId = parseInt(viewAsData.id || viewAsData.studentId);
        }
    }

    try {
        // Use questionnaire_data table with step number and data as JSONB
        // Check if record exists for this user and step
        const { data: existing, error: checkError } = await supabaseClient
            .from('questionnaire_data')
            .select('id')
            .eq('user_id', targetUserId)
            .eq('step', step)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Check error:', checkError);
        }

        if (existing) {
            // Update existing record
            const { error } = await supabaseClient
                .from('questionnaire_data')
                .update({ data: data, updated_at: new Date().toISOString() })
                .eq('user_id', targetUserId)
                .eq('step', step);

            if (error) throw error;
        } else {
            // Insert new record
            const { error } = await supabaseClient
                .from('questionnaire_data')
                .insert({
                    user_id: targetUserId,
                    step: step,
                    data: data
                });

            if (error) throw error;
        }

        // Update questionnaire progress on user record
        await updateQuestionnaireProgress(targetUserId, step);

        // Also update full_name on users table if step 1
        if (step === 1 && data.full_name) {
            await supabaseClient
                .from('users')
                .update({ full_name: _fmtStr(data.full_name) })
                .eq('id', targetUserId);

            // Only update local storage if saving for current user (not when viewing as)
            if (targetUserId === user.id) {
                const storedUser = JSON.parse(localStorage.getItem('ward_user') || '{}');
                storedUser.full_name = data.full_name; // Store decrypted in localStorage
                localStorage.setItem('ward_user', JSON.stringify(storedUser));
            }
        }

        showToast('Dados salvos com sucesso!', 'success');
        return true;
    } catch (err) {
        console.error('Save error:', err);
        showToast('Erro ao salvar dados', 'error');
        return false;
    }
}

// Get table name for questionnaire step
function getTableNameForStep(step) {
    const tableMap = {
        1: 'user_basic_data',
        2: 'user_usmle_data',
        3: 'user_uworld_data',
        4: 'user_uworld_progress',
        5: 'user_english_level',
        6: 'user_anki_data',
        7: 'user_research_data',
        8: 'user_research_data',
        9: 'user_research_data',
        10: 'user_observerships',
        11: 'user_background'
    };
    return tableMap[step];
}

// Update questionnaire progress - only advance if new step is higher
async function updateQuestionnaireProgress(userId, step) {
    try {
        // Get current progress first
        const { data: user } = await supabaseClient
            .from('users')
            .select('questionnaire_step')
            .eq('id', userId)
            .single();

        const currentStep = user?.questionnaire_step || 0;

        // Only update if new step is higher than current
        if (step > currentStep) {
            await supabaseClient
                .from('users')
                .update({ questionnaire_step: step })
                .eq('id', userId);
        }
    } catch (err) {
        console.error('Progress update error:', err);
    }
}

// Mark questionnaire as complete
async function completeQuestionnaire() {
    const user = await checkAuth();
    if (!user) return false;

    try {
        await supabaseClient
            .from('users')
            .update({ first_login_completed: true })
            .eq('id', user.id);

        // Update local storage
        user.first_login_completed = true;
        localStorage.setItem('ward_user', JSON.stringify(user));

        return true;
    } catch (err) {
        console.error('Complete questionnaire error:', err);
        return false;
    }
}

// Load questionnaire data
async function loadQuestionnaireData(step) {
    const user = await checkAuth();
    if (!user) return null;

    // Determine which user's data to load (support view_as mode for mentors)
    let targetUserId = user.id;

    // FIRST: Check URL parameter (takes priority)
    const urlParams = new URLSearchParams(window.location.search);
    const urlViewAs = urlParams.get('view_as');

    if (urlViewAs && user.role && user.role.startsWith('mentor')) {
        // Mentor accessing with ?view_as parameter
        targetUserId = parseInt(urlViewAs);
    } else {
        // SECOND: Check localStorage as fallback
        const viewAsData = JSON.parse(localStorage.getItem('view_as_student') || 'null');
        if (viewAsData && user.role && user.role.startsWith('mentor')) {
            targetUserId = parseInt(viewAsData.id || viewAsData.studentId);
        }
    }

    try {
        const { data, error } = await supabaseClient
            .from('questionnaire_data')
            .select('data')
            .eq('user_id', targetUserId)
            .eq('step', step)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Load error:', error);
            return null;
        }

        // Return the data JSONB field contents
        return data?.data || null;
    } catch (err) {
        console.error('Load data error:', err);
        return null;
    }
}

// ===== DASHBOARD FUNCTIONS =====

// Load user dashboard data
async function loadDashboardData() {
    const user = await checkAuth();
    if (!user) return null;

    try {
        // Load messages
        const { data: messages } = await supabaseClient
            .from('messages')
            .select('*, users!created_by(name)')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        // Load landmarks
        const { data: landmarks } = await supabaseClient
            .from('landmarks')
            .select('*')
            .eq('user_id', user.id)
            .order('order_position', { ascending: true });

        // Load preparation status
        const { data: prepStatus } = await supabaseClient
            .from('user_preparation_status')
            .select('*')
            .eq('user_id', user.id)
            .single();

        return {
            user,
            messages: messages || [],
            landmarks: landmarks || [],
            preparationStatus: prepStatus
        };
    } catch (err) {
        console.error('Dashboard load error:', err);
        return null;
    }
}

// ===== LANDMARKS FUNCTIONS =====

// Update landmark status
async function updateLandmark(landmarkId, updates) {
    try {
        const { error } = await supabaseClient
            .from('landmarks')
            .update(updates)
            .eq('id', landmarkId);

        if (error) throw error;
        showToast('Landmark atualizado');
        return true;
    } catch (err) {
        console.error('Update landmark error:', err);
        showToast('Erro ao atualizar', 'error');
        return false;
    }
}

// Add landmark observation
async function addLandmarkObservation(landmarkId, observation) {
    try {
        const { data: landmark } = await supabaseClient
            .from('landmarks')
            .select('notes')
            .eq('id', landmarkId)
            .single();

        const notes = landmark?.notes || [];
        notes.push({
            text: observation,
            date: new Date().toISOString(),
            author: JSON.parse(localStorage.getItem('ward_user')).name
        });

        const { error } = await supabaseClient
            .from('landmarks')
            .update({ notes })
            .eq('id', landmarkId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Add observation error:', err);
        return false;
    }
}

// ===== SCHEDULE FUNCTIONS =====

// Load schedule
async function loadSchedule(userId = null) {
    const user = await checkAuth();
    const targetUserId = userId || user?.id;
    if (!targetUserId) return null;

    try {
        const { data, error } = await supabaseClient
            .from('schedules')
            .select('*')
            .eq('user_id', targetUserId)
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load schedule error:', err);
        return [];
    }
}

// Update schedule item
async function updateScheduleItem(itemId, completed) {
    try {
        const { error } = await supabaseClient
            .from('schedules')
            .update({ completed, updated_at: new Date().toISOString() })
            .eq('id', itemId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Update schedule error:', err);
        return false;
    }
}

// Signal schedule delay
async function signalDelay(userId, startDate, endDate, reason) {
    try {
        const { error } = await supabaseClient
            .from('schedule_delays')
            .insert({
                user_id: userId,
                start_date: startDate,
                end_date: endDate,
                reason: reason
            });

        if (error) throw error;
        showToast('Atraso sinalizado com sucesso');
        return true;
    } catch (err) {
        console.error('Signal delay error:', err);
        showToast('Erro ao sinalizar atraso', 'error');
        return false;
    }
}

// ===== LINKS REPOSITORY FUNCTIONS =====

// Load links
async function loadLinks(category = null) {
    try {
        let query = supabaseClient
            .from('links_repository')
            .select('*, users!added_by(name)')
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load links error:', err);
        return [];
    }
}

// Add link
async function addLink(linkData) {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const { error } = await supabaseClient
            .from('links_repository')
            .insert({ ...linkData, added_by: user.id });

        if (error) throw error;
        showToast('Link adicionado com sucesso');
        return true;
    } catch (err) {
        console.error('Add link error:', err);
        showToast('Erro ao adicionar link', 'error');
        return false;
    }
}

// ===== BLOG FUNCTIONS =====

// Load blog posts
async function loadBlogPosts(filter = 'recent') {
    try {
        let query = supabaseClient
            .from('blog_posts')
            .select('*, users!user_id(name, role)');

        if (filter === 'pinned') {
            query = query.eq('is_pinned', true);
        }

        query = query.order(filter === 'likes' ? 'likes' : 'created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load posts error:', err);
        return [];
    }
}

// Create blog post
async function createPost(content) {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const { error } = await supabaseClient
            .from('blog_posts')
            .insert({
                user_id: user.id,
                content,
                likes: 0,
                dislikes: 0
            });

        if (error) throw error;
        showToast('Post publicado');
        return true;
    } catch (err) {
        console.error('Create post error:', err);
        showToast('Erro ao publicar post', 'error');
        return false;
    }
}

// Like/Dislike post
async function reactToPost(postId, reaction) {
    try {
        const { data: post } = await supabaseClient
            .from('blog_posts')
            .select('likes, dislikes')
            .eq('id', postId)
            .single();

        const updates = reaction === 'like'
            ? { likes: (post?.likes || 0) + 1 }
            : { dislikes: (post?.dislikes || 0) + 1 };

        const { error } = await supabaseClient
            .from('blog_posts')
            .update(updates)
            .eq('id', postId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('React error:', err);
        return false;
    }
}

// Load comments
async function loadComments(postId) {
    try {
        const { data, error } = await supabaseClient
            .from('blog_comments')
            .select('*, users!user_id(name)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load comments error:', err);
        return [];
    }
}

// Add comment
async function addComment(postId, content) {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const { error } = await supabaseClient
            .from('blog_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content
            });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Add comment error:', err);
        return false;
    }
}

// ===== RESEARCH FUNCTIONS =====

// Load research projects
async function loadResearchProjects(userId = null) {
    const user = await checkAuth();

    try {
        let query = supabaseClient
            .from('research_projects')
            .select(`
                *,
                research_coauthors(user_id, users(name)),
                research_stages_completed(*)
            `)
            .order('deadline', { ascending: true });

        // If user is student, only show their projects
        if (userId || (user && !user.role.startsWith('mentor_'))) {
            const { data: coauthored } = await supabaseClient
                .from('research_coauthors')
                .select('project_id')
                .eq('user_id', userId || user.id);

            const projectIds = coauthored?.map(c => c.project_id) || [];

            query = query.or(`created_by.eq.${userId || user.id},id.in.(${projectIds.join(',')})`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load research error:', err);
        return [];
    }
}

// Create research project
async function createResearchProject(projectData) {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const { data, error } = await supabaseClient
            .from('research_projects')
            .insert({ ...projectData, created_by: user.id })
            .select()
            .single();

        if (error) throw error;

        // Create default stages
        const stages = [
            'Nova tarefa', 'Testando ideia', 'Encontrando estudos', 'Estrategia de busca',
            'Validando ideia', 'Escrever protocolo', 'Exportar de databases', 'Desduplicar',
            'Revisores 1 e 2', 'Revisor 3', 'Baixando PDFs', 'Leitura completa',
            'PRISMA Flow Diagram', 'Tabela PICO', 'Extracao de dados',
            'Analise estatistica padrao', 'Analises estatisticas adicionais',
            'Risco de vies revisores 1 e 2', 'Risco de vies revisor 3',
            'Graficos de desfechos', 'Graficos de vieses', 'GRADE',
            'Submeter ao PROSPERO', 'Escrever Abstract', 'Submeter para congresso',
            'Escrever Introduction', 'Escrever Methods', 'Escrever Results',
            'Escrever Discussion', 'Escrever Conclusion', 'Escrever Limitations',
            'Escrever References', 'Encontrar revistas', 'Escrever Cover Letter',
            'Submeter para revista', 'Responder revisores', 'Escrever Rebuttal Letter',
            'Ultimos ajustes', 'Tarefa concluida'
        ];

        for (const stage of stages) {
            await supabaseClient
                .from('research_stages_completed')
                .insert({
                    project_id: data.id,
                    stage_name: stage,
                    completed: false
                });
        }

        showToast('Pesquisa criada com sucesso');
        return data.id;
    } catch (err) {
        console.error('Create research error:', err);
        showToast('Erro ao criar pesquisa', 'error');
        return false;
    }
}

// ===== DIARY FUNCTIONS =====

// Load study diary entries
async function loadStudyDiary(userId = null) {
    const user = await checkAuth();
    const targetUserId = userId || user?.id;

    try {
        const { data, error } = await supabaseClient
            .from('study_diary')
            .select('*')
            .eq('user_id', targetUserId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load diary error:', err);
        return [];
    }
}

// Add study diary entry
async function addStudyDiaryEntry(entryText, date = null) {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const { error } = await supabaseClient
            .from('study_diary')
            .insert({
                user_id: user.id,
                entry_text: entryText,
                date: date || new Date().toISOString().split('T')[0]
            });

        if (error) throw error;
        showToast('Entrada salva');
        return true;
    } catch (err) {
        console.error('Add diary entry error:', err);
        showToast('Erro ao salvar entrada', 'error');
        return false;
    }
}

// Load UWorld diary entries
async function loadUWorldDiary(userId = null) {
    const user = await checkAuth();
    const targetUserId = userId || user?.id;

    try {
        const { data, error } = await supabaseClient
            .from('uworld_diary')
            .select('*')
            .eq('user_id', targetUserId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load UWorld diary error:', err);
        return [];
    }
}

// Add UWorld diary entry
async function addUWorldDiaryEntry(entryData) {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const { error } = await supabaseClient
            .from('uworld_diary')
            .insert({
                user_id: user.id,
                ...entryData,
                date: entryData.date || new Date().toISOString().split('T')[0]
            });

        if (error) throw error;
        showToast('Sessao registrada');
        return true;
    } catch (err) {
        console.error('Add UWorld entry error:', err);
        showToast('Erro ao registrar sessao', 'error');
        return false;
    }
}

// ===== CHECK-IN MODAL =====

// Show daily check-in modal
function showCheckInModal() {
    const modal = document.getElementById('checkin-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Submit check-in
async function submitCheckIn(status, message = '') {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const { error } = await supabaseClient
            .from('daily_checkins')
            .insert({
                user_id: user.id,
                status,
                message,
                date: new Date().toISOString().split('T')[0]
            });

        if (error) throw error;

        closeModal('checkin-modal');
        showToast('Check-in registrado');
        return true;
    } catch (err) {
        console.error('Check-in error:', err);
        return false;
    }
}

// ===== ADMIN FUNCTIONS (Marcos) =====

// Load all members
async function loadAllMembers() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Load members error:', err);
        return [];
    }
}

// Add new member
async function addMember(memberData) {
    try {
        const { error } = await supabaseClient
            .from('users')
            .insert({
                ...memberData,
                first_login_completed: false,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        showToast('Membro adicionado com sucesso');
        return true;
    } catch (err) {
        console.error('Add member error:', err);
        showToast('Erro ao adicionar membro', 'error');
        return false;
    }
}

// Remove member
async function removeMember(userId) {
    try {
        // Delete related data first
        const tables = [
            'user_basic_data', 'user_usmle_data', 'user_uworld_data',
            'user_uworld_progress', 'user_english_level', 'user_anki_data',
            'user_research_data', 'user_research_contacts', 'user_observerships',
            'user_background', 'user_preparation_status', 'messages',
            'study_diary', 'uworld_diary', 'landmarks', 'schedules',
            'schedule_delays', 'blog_posts', 'blog_comments',
            'research_coauthors', 'daily_checkins'
        ];

        for (const table of tables) {
            await supabaseClient.from(table).delete().eq('user_id', userId);
        }

        // Delete user
        const { error } = await supabaseClient
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
        showToast('Membro removido');
        return true;
    } catch (err) {
        console.error('Remove member error:', err);
        showToast('Erro ao remover membro', 'error');
        return false;
    }
}

// Update member data
async function updateMemberData(userId, table, data) {
    try {
        const { error } = await supabaseClient
            .from(table)
            .upsert({ user_id: userId, ...data });

        if (error) throw error;
        showToast('Dados atualizados');
        return true;
    } catch (err) {
        console.error('Update member data error:', err);
        showToast('Erro ao atualizar dados', 'error');
        return false;
    }
}

// Paste schedule from Excel
async function pasteSchedule(userId, scheduleText) {
    try {
        // Delete existing schedule
        await supabaseClient.from('schedules').delete().eq('user_id', userId);

        // Parse tab-separated values
        const lines = scheduleText.trim().split('\n');
        const scheduleItems = [];

        for (let i = 1; i < lines.length; i++) { // Skip header
            const cols = lines[i].split('\t');
            if (cols.length >= 4) {
                scheduleItems.push({
                    user_id: userId,
                    system: cols[0]?.trim(),
                    category: cols[1]?.trim(),
                    questions: parseInt(cols[2]?.trim()) || 0,
                    completed: cols[3]?.trim().toLowerCase() === 'true'
                });
            }
        }

        if (scheduleItems.length > 0) {
            const { error } = await supabaseClient
                .from('schedules')
                .insert(scheduleItems);

            if (error) throw error;
        }

        showToast('Cronograma salvo com sucesso');
        return true;
    } catch (err) {
        console.error('Paste schedule error:', err);
        showToast('Erro ao salvar cronograma', 'error');
        return false;
    }
}

// ===== MENTOR FUNCTIONS =====

// Load mentor timeline
async function loadMentorTimeline(mentorRole) {
    try {
        // Get recent check-ins
        const { data: checkins } = await supabaseClient
            .from('daily_checkins')
            .select('*, users!user_id(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        // Get recent study diary entries
        const { data: studyEntries } = await supabaseClient
            .from('study_diary')
            .select('*, users!user_id(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        // Get recent UWorld diary entries
        const { data: uworldEntries } = await supabaseClient
            .from('uworld_diary')
            .select('*, users!user_id(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        // Get schedule delays
        const { data: delays } = await supabaseClient
            .from('schedule_delays')
            .select('*, users!user_id(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        // Get blog posts
        const { data: posts } = await supabaseClient
            .from('blog_posts')
            .select('*, users!user_id(name)')
            .order('created_at', { ascending: false })
            .limit(10);

        // Combine and sort all items
        const timeline = [
            ...(checkins || []).map(c => ({ ...c, type: 'checkin' })),
            ...(studyEntries || []).map(e => ({ ...e, type: 'study_diary' })),
            ...(uworldEntries || []).map(e => ({ ...e, type: 'uworld_diary' })),
            ...(delays || []).map(d => ({ ...d, type: 'delay' })),
            ...(posts || []).map(p => ({ ...p, type: 'blog_post' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return timeline;
    } catch (err) {
        console.error('Load timeline error:', err);
        return [];
    }
}

// Get pending calls for mentor
async function getPendingCalls(mentorType) {
    try {
        const { data, error } = await supabaseClient
            .from('landmarks')
            .select('*, users!user_id(name, id)')
            .eq('completed', false)
            .ilike('landmark_type', `%${mentorType}%`)
            .order('is_urgent', { ascending: false })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Get pending calls error:', err);
        return [];
    }
}

// ===== MODAL FUNCTIONS =====

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ===== TAB FUNCTIONS =====

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabGroup = tab.parentElement;
            const tabContents = tabGroup.nextElementSibling?.parentElement.querySelectorAll('.tab-content');

            // Remove active from all tabs
            tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            if (tabContents) {
                tabContents.forEach(content => content.classList.remove('active'));
                const targetContent = document.querySelector(tab.dataset.target);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
        });
    });
}

// ===== ACCORDION FUNCTIONS =====

function initAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on a checkbox or its label
            if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL') return;
            const item = header.parentElement;
            item.classList.toggle('active');
        });
    });
}

// ===== CONDITIONAL FIELDS =====

function initConditionalFields() {
    const conditionalTriggers = document.querySelectorAll('[data-conditional]');
    conditionalTriggers.forEach(trigger => {
        trigger.addEventListener('change', () => {
            const targetId = trigger.dataset.conditional;
            const targetValue = trigger.dataset.conditionalValue;
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                if (trigger.type === 'checkbox') {
                    targetElement.classList.toggle('visible', trigger.checked);
                } else if (trigger.type === 'radio') {
                    if (trigger.checked && trigger.value === targetValue) {
                        targetElement.classList.add('visible');
                    } else if (trigger.checked) {
                        targetElement.classList.remove('visible');
                    }
                } else {
                    targetElement.classList.toggle('visible', trigger.value === targetValue);
                }
            }
        });
    });
}

// ===== CHARACTER COUNTER =====

function initCharCounters() {
    const textareas = document.querySelectorAll('[data-maxlength]');
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.dataset.maxlength);
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.textContent = `0/${maxLength}`;
        textarea.parentElement.appendChild(counter);

        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            counter.textContent = `${length}/${maxLength}`;

            if (length >= maxLength) {
                counter.className = 'char-counter danger';
                textarea.value = textarea.value.substring(0, maxLength);
            } else if (length >= maxLength * 0.9) {
                counter.className = 'char-counter warning';
            } else {
                counter.className = 'char-counter';
            }
        });
    });
}

// ===== RANGE SLIDER =====

function initRangeSliders() {
    const sliders = document.querySelectorAll('.range-slider');
    sliders.forEach(slider => {
        const valueDisplay = slider.parentElement.querySelector('.range-value');
        if (valueDisplay) {
            valueDisplay.textContent = slider.value + (slider.dataset.unit || '');

            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value + (slider.dataset.unit || '');
            });
        }
    });
}

// ===== DRAG AND DROP =====

function initDragAndDrop(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    let draggedItem = null;

    container.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('landmark-item')) {
            draggedItem = e.target;
            e.target.classList.add('dragging');
        }
    });

    container.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('landmark-item')) {
            e.target.classList.remove('dragging');
            draggedItem = null;
            updateLandmarkOrder();
        }
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        if (draggedItem) {
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.landmark-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateLandmarkOrder() {
    const landmarks = document.querySelectorAll('.landmark-item');
    const updates = [];

    landmarks.forEach((item, index) => {
        const landmarkId = item.dataset.id;
        if (landmarkId) {
            updates.push(
                supabaseClient
                    .from('landmarks')
                    .update({ order_position: index })
                    .eq('id', landmarkId)
            );
        }
    });

    try {
        await Promise.all(updates);
    } catch (err) {
        console.error('Update order error:', err);
    }
}

// ===== MOBILE MENU =====

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }
}

// ===== HEADER USER INFO =====

function updateHeaderUserInfo() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (user) {
        const userName = document.querySelector('.user-name');
        if (userName) {
            userName.textContent = user.name || user.email;
        }
    }
}

// ===== DYNAMIC NAVBAR BASED ON ROLE =====

function updateNavbarForRole() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    // Get the Dashboard link in navbar
    const dashboardLink = document.querySelector('.nav-menu a[href="dashboard.html"]');
    if (!dashboardLink) return;

    // Update Dashboard link based on role
    switch (user.role) {
        case 'mentor_marcos':
            dashboardLink.href = 'mentor-dashboard-marcos.html';
            break;
        case 'mentor_iria':
            dashboardLink.href = 'mentor-dashboard-iria.html';
            break;
        case 'mentor_guilherme':
            dashboardLink.href = 'mentor-dashboard-guilherme.html';
            break;
        case 'mentor_romulo':
            dashboardLink.href = 'mentor-dashboard-romulo.html';
            break;
        default:
            // Keep dashboard.html for students
            dashboardLink.href = 'dashboard.html';
    }

    // Add mentor-specific links if mentor
    if (user.role && user.role.startsWith('mentor_')) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            // Check if admin link already exists
            if (!navMenu.querySelector('a[href="admin-members.html"]')) {
                // Add admin link for Marcos
                if (user.role === 'mentor_marcos') {
                    const adminLink = document.createElement('a');
                    adminLink.href = 'admin-members.html';
                    adminLink.className = 'nav-link';
                    adminLink.textContent = 'Admin';
                    navMenu.appendChild(adminLink);
                }
            }
        }
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAccordions();
    initConditionalFields();
    initCharCounters();
    initRangeSliders();
    initMobileMenu();
    updateHeaderUserInfo();
    updateNavbarForRole();

    // OLD CODE: Check-in modal is now handled in dashboard.html with database logic
    // const user = JSON.parse(localStorage.getItem('ward_user'));
    // if (user?.first_login_completed && window.location.pathname.includes('dashboard')) {
    //     const lastCheckIn = localStorage.getItem('last_checkin_date');
    //     const today = new Date().toISOString().split('T')[0];
    //
    //     if (lastCheckIn !== today) {
    //         showCheckInModal();
    //     }
    // }
});

// Helper to get supabase client (ensures it's initialized)
function getSupabaseClient() {
    if (!supabaseClient) {
        initSupabase();
    }
    return supabaseClient;
}

// Navigate to the correct dashboard based on user role
function goToDashboard() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    switch (user.role) {
        case 'mentor_marcos':
            window.location.href = 'mentor-dashboard-marcos.html';
            break;
        case 'mentor_iria':
            window.location.href = 'mentor-dashboard-iria.html';
            break;
        case 'mentor_guilherme':
            window.location.href = 'mentor-dashboard-guilherme.html';
            break;
        case 'mentor_romulo':
            window.location.href = 'mentor-dashboard-romulo.html';
            break;
        case 'assessoria':
            window.location.href = 'dashboard-assessoria-avulsa.html';
            break;
        case 'externo':
            window.location.href = 'dashboard-externo.html';
            break;
        default:
            window.location.href = 'dashboard.html';
    }
}

// Export functions for use in HTML
window.WardApp = {
    // Supabase client accessor - use WardApp.db.from('table')
    get db() {
        return getSupabaseClient();
    },
    login,
    logout,
    checkAuth,
    showToast,
    showLoading,
    hideLoading,
    saveQuestionnaireProgress,
    loadQuestionnaireData,
    completeQuestionnaire,
    loadDashboardData,
    updateLandmark,
    addLandmarkObservation,
    loadSchedule,
    updateScheduleItem,
    signalDelay,
    loadLinks,
    addLink,
    loadBlogPosts,
    createPost,
    reactToPost,
    loadComments,
    addComment,
    loadResearchProjects,
    createResearchProject,
    loadStudyDiary,
    addStudyDiaryEntry,
    loadUWorldDiary,
    addUWorldDiaryEntry,
    submitCheckIn,
    loadAllMembers,
    addMember,
    removeMember,
    updateMemberData,
    pasteSchedule,
    loadMentorTimeline,
    getPendingCalls,
    openModal,
    closeModal,
    initDragAndDrop,
    formatDate,
    formatDateInput,
    getTodayString,
    parseLocalDate,
    daysRemaining,
    goToDashboard,
    // Data processing utilities
    _fmt: _fmtStr,
    _prs: _parseStr,
    _fmtU: (obj) => _fmtObj(obj, _sflds),
    _prsU: (obj) => _parseObj(obj, _sflds)
};
