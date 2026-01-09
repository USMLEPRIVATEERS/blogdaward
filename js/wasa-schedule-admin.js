// ============================================
// WARD ACADEMY - WASA SCHEDULE ADMIN
// ============================================

let currentUser = null;
let assessments = [];
let enrollments = [];
let users = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureSupabase();
        await checkAuth();
        await loadData();
        initializeUI();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar dados', 'error');
    }
});

// Ensure Supabase is ready
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

// Check auth - only Marcos can access
async function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('ward_user'));
    if (!currentUser || currentUser.role !== 'mentor_marcos') {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Load data
async function loadData() {
    showLoading();

    try {
        // Load assessments
        const { data: assessmentsData, error: assessmentsError } = await window.supabase
            .from('self_assessments')
            .select('*')
            .order('created_at', { ascending: false });

        if (assessmentsError) throw assessmentsError;
        assessments = assessmentsData || [];

        // Load enrollments
        const { data: enrollmentsData, error: enrollmentsError } = await window.supabase
            .from('self_assessment_enrollments')
            .select('*')
            .order('enrolled_at', { ascending: false });

        if (enrollmentsError) throw enrollmentsError;
        enrollments = enrollmentsData || [];

        // Load users
        const userIds = [...new Set(enrollments.map(e => e.user_id))];
        if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await window.supabase
                .from('users')
                .select('id, name, email, whatsapp')
                .in('id', userIds);

            if (!usersError && usersData) {
                usersData.forEach(u => {
                    users[u.id] = u;
                });
            }
        }

        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        throw error;
    }
}

// Initialize UI
function initializeUI() {
    // Populate assessment filter
    const filter = document.getElementById('assessment-filter');
    filter.innerHTML = '<option value="all">Todos</option>';
    assessments.forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = a.name;
        filter.appendChild(option);
    });

    // Set up filters
    document.getElementById('assessment-filter').addEventListener('change', renderStudents);
    document.getElementById('status-filter').addEventListener('change', renderStudents);

    // Set minimum date for bulk date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('bulk-date').min = tomorrow.toISOString().split('T')[0];

    // Render students
    renderStudents();
}

// Render students table
function renderStudents() {
    const assessmentFilter = document.getElementById('assessment-filter').value;
    const statusFilter = document.getElementById('status-filter').value;

    let filtered = enrollments;

    if (assessmentFilter !== 'all') {
        const numericFilter = parseInt(assessmentFilter);
        filtered = filtered.filter(e => e.self_assessment_id === numericFilter || e.self_assessment_id === assessmentFilter);
    }

    if (statusFilter !== 'all') {
        filtered = filtered.filter(e => e.status === statusFilter);
    }

    const tbody = document.getElementById('students-tbody');
    document.getElementById('students-count').textContent = `${filtered.length} alunos`;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>Nenhum aluno encontrado com os filtros selecionados.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(enrollment => {
        const user = users[enrollment.user_id] || {};
        const assessment = assessments.find(a => a.id === enrollment.self_assessment_id) || {};

        // Convert UTC to Brasilia time for display
        let scheduledDisplay = '<span class="no-schedule">Nao agendado</span>';
        let scheduledDate = '';
        let scheduledTime = '';

        if (enrollment.scheduled_datetime_utc) {
            const utcDate = new Date(enrollment.scheduled_datetime_utc);
            const brasiliaDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

            scheduledDate = brasiliaDate.toLocaleDateString('pt-BR');
            scheduledTime = brasiliaDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            scheduledDisplay = `
                <div class="schedule-info">
                    <span class="schedule-date">${scheduledDate}</span>
                    <span class="schedule-time">${scheduledTime}</span>
                    <span class="schedule-timezone">Fuso aluno: ${enrollment.user_timezone || 'America/Sao_Paulo'}</span>
                </div>
            `;
        }

        const setByBadge = enrollment.schedule_set_by === 'mentor'
            ? '<span class="badge badge-mentor">Mentor</span>'
            : '<span class="badge badge-student">Aluno</span>';

        // Input values for editing (in Brasilia time)
        const editDateValue = enrollment.scheduled_datetime_utc
            ? new Date(new Date(enrollment.scheduled_datetime_utc).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).toISOString().split('T')[0]
            : '';
        const editTimeValue = enrollment.scheduled_datetime_utc
            ? new Date(new Date(enrollment.scheduled_datetime_utc).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).toTimeString().slice(0, 5)
            : '';

        return `
            <tr data-enrollment-id="${enrollment.id}">
                <td>
                    <input type="checkbox" class="student-checkbox" value="${enrollment.id}">
                </td>
                <td>
                    <div class="student-name">${user.name || 'Nome nao disponivel'}</div>
                    <div class="student-email">${user.email || ''}</div>
                </td>
                <td>${assessment.name || 'N/A'}</td>
                <td>${scheduledDisplay}</td>
                <td>${setByBadge}</td>
                <td>
                    <div class="edit-schedule">
                        <input type="date" class="edit-date" value="${editDateValue}" data-id="${enrollment.id}">
                        <input type="time" class="edit-time" value="${editTimeValue}" data-id="${enrollment.id}">
                        <button class="btn-save" onclick="saveSchedule('${enrollment.id}')">Salvar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Toggle select all
function toggleSelectAll() {
    const selectAll = document.getElementById('select-all').checked;
    document.querySelectorAll('.student-checkbox').forEach(cb => {
        cb.checked = selectAll;
    });
}

// Save individual schedule
async function saveSchedule(enrollmentId) {
    const dateInput = document.querySelector(`.edit-date[data-id="${enrollmentId}"]`);
    const timeInput = document.querySelector(`.edit-time[data-id="${enrollmentId}"]`);

    const date = dateInput.value;
    const time = timeInput.value;

    if (!date || !time) {
        showToast('Preencha data e horario', 'warning');
        return;
    }

    // Convert Brasilia time to UTC
    const utcDateTime = convertBrasiliaToUTC(date, time);

    console.log('=== SAVING SCHEDULE ===');
    console.log('enrollmentId:', enrollmentId, 'type:', typeof enrollmentId);
    console.log('date:', date, 'time:', time);
    console.log('utcDateTime:', utcDateTime);

    showLoading();

    try {
        // Use the ID directly as Supabase handles type conversion
        const updateData = {
            scheduled_datetime_utc: utcDateTime,
            schedule_set_by: 'mentor',
            mentor_override_at: new Date().toISOString()
        };
        console.log('Update payload:', updateData);

        const { data, error } = await window.supabase
            .from('self_assessment_enrollments')
            .update(updateData)
            .eq('id', enrollmentId)
            .select();

        console.log('=== UPDATE RESULT ===');
        console.log('error:', error);
        console.log('data:', JSON.stringify(data, null, 2));
        if (data && data[0]) {
            console.log('Saved scheduled_datetime_utc:', data[0].scheduled_datetime_utc);
        }

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error('Nenhum registro atualizado - verifique o ID');
        }

        // Update local data
        const idx = enrollments.findIndex(e => String(e.id) === String(enrollmentId));
        if (idx !== -1) {
            enrollments[idx].scheduled_datetime_utc = utcDateTime;
            enrollments[idx].schedule_set_by = 'mentor';
        }

        hideLoading();
        showToast('Agendamento atualizado!', 'success');

        // Reload data from server to ensure sync
        await loadData();
        renderStudents();

    } catch (error) {
        console.error('Error saving schedule:', error);
        hideLoading();
        showToast('Erro ao salvar: ' + error.message, 'error');
    }
}

// Apply bulk schedule
async function applyBulkSchedule() {
    const date = document.getElementById('bulk-date').value;
    const time = document.getElementById('bulk-time').value;

    if (!date || !time) {
        showToast('Preencha data e horario', 'warning');
        return;
    }

    // Convert string IDs to numbers
    const selectedIds = Array.from(document.querySelectorAll('.student-checkbox:checked'))
        .map(cb => parseInt(cb.value));

    if (selectedIds.length === 0) {
        showToast('Selecione pelo menos um aluno', 'warning');
        return;
    }

    // Convert Brasilia time to UTC
    const utcDateTime = convertBrasiliaToUTC(date, time);

    showLoading();

    try {
        // Update all selected enrollments
        const { error } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                scheduled_datetime_utc: utcDateTime,
                schedule_set_by: 'mentor',
                mentor_override_at: new Date().toISOString()
            })
            .in('id', selectedIds);

        if (error) throw error;

        // Update local data
        selectedIds.forEach(numericId => {
            const idx = enrollments.findIndex(e => e.id === numericId);
            if (idx !== -1) {
                enrollments[idx].scheduled_datetime_utc = utcDateTime;
                enrollments[idx].schedule_set_by = 'mentor';
            }
        });

        hideLoading();
        showToast(`Agendamento aplicado para ${selectedIds.length} aluno(s)!`, 'success');

        // Clear bulk inputs
        document.getElementById('bulk-date').value = '';
        document.getElementById('bulk-time').value = '';
        document.getElementById('select-all').checked = false;

        renderStudents();

    } catch (error) {
        console.error('Error applying bulk schedule:', error);
        hideLoading();
        showToast('Erro ao aplicar agendamento em massa', 'error');
    }
}

// Convert Brasilia time to UTC
function convertBrasiliaToUTC(date, time) {
    // Parse date and time components
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // Brasilia is UTC-3 (Brazil no longer observes DST since 2019)
    // To convert FROM Brasilia TO UTC, we ADD 3 hours
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours + 3, minutes, 0));

    return utcDate.toISOString();
}

// Helper functions
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

function showToast(message, type = 'info') {
    if (typeof WardApp !== 'undefined' && WardApp.showToast) {
        WardApp.showToast(message, type);
    } else {
        alert(message);
    }
}
