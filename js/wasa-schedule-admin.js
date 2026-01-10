// ============================================
// WARD ACADEMY - WASA SCHEDULE ADMIN
// ============================================

let currentUser = null;
let assessments = [];
let enrollments = [];
let users = {};
let events = [];

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

        // Load events
        const { data: eventsData, error: eventsError } = await window.supabase
            .from('self_assessment_events')
            .select('*')
            .order('event_date', { ascending: true });

        if (!eventsError && eventsData) {
            events = eventsData;
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

    // Populate event assessment select
    const eventSelect = document.getElementById('event-assessment');
    eventSelect.innerHTML = '<option value="">Selecione...</option>';
    assessments.forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = a.name;
        eventSelect.appendChild(option);
    });

    // Set up filters
    document.getElementById('assessment-filter').addEventListener('change', renderStudents);
    document.getElementById('status-filter').addEventListener('change', renderStudents);

    // Set minimum date for bulk date and event date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    document.getElementById('bulk-date').min = tomorrowStr;
    document.getElementById('event-date').min = tomorrowStr;

    // Render students and events
    renderStudents();
    renderEvents();
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
        // Update all schedule-related fields to avoid trigger conflicts
        const updateData = {
            scheduled_date: date,
            scheduled_time: time + ':00',
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
        console.log('=== RELOADING DATA ===');
        await loadData();

        // Check what was loaded
        const reloadedEnrollment = enrollments.find(e => String(e.id) === String(enrollmentId));
        console.log('After reload, enrollment scheduled_datetime_utc:', reloadedEnrollment?.scheduled_datetime_utc);

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
        // Update all selected enrollments with all schedule fields
        const { error } = await window.supabase
            .from('self_assessment_enrollments')
            .update({
                scheduled_date: date,
                scheduled_time: time + ':00',
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

// ============================================
// EVENT MANAGEMENT
// ============================================

// Render events list
function renderEvents() {
    const section = document.getElementById('events-list-section');
    const list = document.getElementById('events-list');

    if (events.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    list.innerHTML = events.map(event => {
        const assessment = assessments.find(a => a.id === event.self_assessment_id);
        const assessmentName = assessment ? assessment.name : 'N/A';

        // Format date and time for display
        const eventDate = new Date(event.event_date + 'T00:00:00');
        const formattedDate = eventDate.toLocaleDateString('pt-BR');
        const formattedTime = event.event_time.substring(0, 5);

        const isActive = event.is_active;
        const isPast = new Date(event.event_date) < new Date().setHours(0, 0, 0, 0);

        return `
            <div class="event-card ${isActive ? 'active' : ''}">
                <div class="event-info">
                    <span class="event-assessment-name">${assessmentName}</span>
                    <span class="event-datetime">📅 ${formattedDate} às ${formattedTime} (Brasilia)</span>
                    <span class="event-badge ${isActive ? 'active' : 'inactive'}">
                        ${isActive ? '✓ Ativo' : 'Inativo'}
                    </span>
                    ${isPast ? '<span class="event-badge inactive">Passado</span>' : ''}
                </div>
                <div class="event-actions">
                    ${!isPast ? `
                        <button class="btn-event-toggle ${isActive ? 'deactivate' : 'activate'}"
                                onclick="toggleEvent(${event.id}, ${!isActive})">
                            ${isActive ? '⏸ Desativar' : '▶ Ativar'}
                        </button>
                    ` : ''}
                    <button class="btn-event-delete" onclick="deleteEvent(${event.id})">
                        🗑 Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Create a new event
async function createScheduledEvent() {
    const assessmentId = document.getElementById('event-assessment').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;

    if (!assessmentId) {
        showToast('Selecione um Self Assessment', 'warning');
        return;
    }

    if (!date) {
        showToast('Selecione uma data', 'warning');
        return;
    }

    if (!time) {
        showToast('Selecione um horario', 'warning');
        return;
    }

    // Check if there's already an active event for this assessment
    const existingActive = events.find(e =>
        e.self_assessment_id === parseInt(assessmentId) &&
        e.is_active &&
        new Date(e.event_date) >= new Date().setHours(0, 0, 0, 0)
    );

    if (existingActive) {
        showToast('Ja existe um evento ativo para este Self Assessment. Desative-o primeiro.', 'error');
        return;
    }

    // Convert Brasilia time to UTC
    const utcDateTime = convertBrasiliaToUTC(date, time);

    showLoading();

    try {
        const { data, error } = await window.supabase
            .from('self_assessment_events')
            .insert({
                self_assessment_id: parseInt(assessmentId),
                event_date: date,
                event_time: time + ':00',
                event_datetime_utc: utcDateTime,
                created_by: currentUser.id,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Add to local events
        events.push(data);

        // Clear form
        document.getElementById('event-assessment').value = '';
        document.getElementById('event-date').value = '';
        document.getElementById('event-time').value = '08:00';

        hideLoading();
        showToast('Evento criado com sucesso!', 'success');
        renderEvents();

    } catch (error) {
        console.error('Error creating event:', error);
        hideLoading();
        showToast('Erro ao criar evento: ' + error.message, 'error');
    }
}

// Toggle event active state
async function toggleEvent(eventId, newState) {
    showLoading();

    try {
        const { error } = await window.supabase
            .from('self_assessment_events')
            .update({ is_active: newState })
            .eq('id', eventId);

        if (error) throw error;

        // Update local events
        const idx = events.findIndex(e => e.id === eventId);
        if (idx !== -1) {
            events[idx].is_active = newState;
        }

        hideLoading();
        showToast(`Evento ${newState ? 'ativado' : 'desativado'}!`, 'success');
        renderEvents();

    } catch (error) {
        console.error('Error toggling event:', error);
        hideLoading();
        showToast('Erro ao alterar status do evento', 'error');
    }
}

// Delete an event
async function deleteEvent(eventId) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
        return;
    }

    showLoading();

    try {
        const { error } = await window.supabase
            .from('self_assessment_events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;

        // Remove from local events
        events = events.filter(e => e.id !== eventId);

        hideLoading();
        showToast('Evento excluido!', 'success');
        renderEvents();

    } catch (error) {
        console.error('Error deleting event:', error);
        hideLoading();
        showToast('Erro ao excluir evento', 'error');
    }
}
