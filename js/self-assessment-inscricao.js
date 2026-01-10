// ============================================
// WARD ACADEMY - SELF ASSESSMENT ENROLLMENT
// ============================================

let currentUser = null;
let assessmentId = null;
let assessmentData = null;
let enrollmentId = null; // For Ward Academy internal students
let activeEvent = null; // For event-based scheduling

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
        await loadAssessmentData();
        initializeForm();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar pagina', 'error');
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

// Load assessment data
async function loadAssessmentData() {
    const urlParams = new URLSearchParams(window.location.search);
    assessmentId = urlParams.get('id');
    enrollmentId = urlParams.get('enrollment_id'); // For Ward Academy internal students

    if (!assessmentId) {
        showToast('Self Assessment nao encontrado', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
        return;
    }

    showLoading();

    try {
        // Check if already enrolled in self_assessment_enrollments
        const { data: existingEnrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('self_assessment_id', assessmentId)
            .maybeSingle();

        if (existingEnrollment) {
            showToast('Voce ja esta inscrito neste Self Assessment', 'info');
            setTimeout(() => {
                // Redirect based on user type
                if (enrollmentId) {
                    window.location.href = 'assessments.html';
                } else {
                    window.location.href = 'dashboard-externo.html';
                }
            }, 2000);
            return;
        }

        // Load assessment
        const { data: assessment, error: assessmentError } = await window.supabase
            .from('self_assessments')
            .select('*')
            .eq('id', assessmentId)
            .single();

        if (assessmentError || !assessment) {
            throw new Error('Assessment not found');
        }

        assessmentData = assessment;

        // Check access type - 'i' means internal (Ward Academy members only)
        if (assessment.access_type === 'i') {
            // Check if user is a Ward Academy member (has role 'aluno' not 'externo')
            const isWardMember = currentUser.role === 'aluno' || currentUser.role === 'mentor' || currentUser.role === 'mentor_marcos';

            if (!isWardMember) {
                hideLoading();
                showToast('Este Self Assessment e exclusivo para membros da Ward Academy', 'error');
                setTimeout(() => window.location.href = 'dashboard-externo.html', 3000);
                return;
            }
        }

        // Update UI
        document.getElementById('assessment-name').textContent = assessment.name;
        document.getElementById('assessment-description').textContent = assessment.description || '';

        // Update inline assessment name references
        const nameInline = document.getElementById('assessment-name-inline');
        const nameInline2 = document.getElementById('assessment-name-inline2');
        if (nameInline) nameInline.textContent = assessment.name;
        if (nameInline2) nameInline2.textContent = assessment.name;

        const totalBlocks = Math.ceil(assessment.total_questions / assessment.questions_per_block);
        document.getElementById('total-questions').textContent = `${assessment.total_questions} questoes`;
        document.getElementById('total-blocks').textContent = `${totalBlocks} blocos`;
        document.getElementById('time-per-block').textContent = `${assessment.time_per_block_minutes}min por bloco`;

        // Check for active event for this assessment
        const { data: eventData, error: eventError } = await window.supabase
            .from('self_assessment_events')
            .select('*')
            .eq('self_assessment_id', assessmentId)
            .eq('is_active', true)
            .gte('event_date', new Date().toISOString().split('T')[0])
            .order('event_date', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (!eventError && eventData) {
            activeEvent = eventData;
            console.log('Active event found:', activeEvent);
        }

        hideLoading();
    } catch (error) {
        console.error('Error loading assessment:', error);
        hideLoading();
        showToast('Erro ao carregar Self Assessment', 'error');
        setTimeout(() => {
            if (enrollmentId) {
                window.location.href = 'assessments.html';
            } else {
                window.location.href = 'dashboard-externo.html';
            }
        }, 2000);
    }
}

// Initialize form
function initializeForm() {
    const form = document.getElementById('enrollment-form');

    // Populate percentage dropdowns (0-100%)
    populatePercentageDropdown('uworld-progress');
    populatePercentageDropdown('uworld-accuracy');

    // Set minimum date to tomorrow for scheduled date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledDateInput = document.getElementById('scheduled-date');
    const scheduledTimeInput = document.getElementById('scheduled-time');
    scheduledDateInput.min = tomorrow.toISOString().split('T')[0];

    // Try to detect user's timezone
    try {
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzSelect = document.getElementById('user-timezone');
        const tzOption = tzSelect.querySelector(`option[value="${userTz}"]`);
        if (tzOption) {
            tzSelect.value = userTz;
        }
    } catch (e) {
        console.log('Could not detect timezone');
    }

    // Handle active event - disable date/time selection
    if (activeEvent) {
        showEventNotification();
    }

    // Setup radio option styling
    setupRadioGroups();

    // Setup "Outro" field toggles
    setupOtherFieldToggles();

    // Form submission
    form.addEventListener('submit', handleSubmit);
}

// Show event notification when there's an active event
function showEventNotification() {
    const scheduledDateInput = document.getElementById('scheduled-date');
    const scheduledTimeInput = document.getElementById('scheduled-time');

    // Format event date and time for display
    const eventDate = new Date(activeEvent.event_date + 'T00:00:00');
    const formattedDate = eventDate.toLocaleDateString('pt-BR');
    const formattedTime = activeEvent.event_time.substring(0, 5);

    // Set date and time inputs to event values (they will be readonly)
    scheduledDateInput.value = activeEvent.event_date;
    scheduledTimeInput.value = activeEvent.event_time.substring(0, 5);

    // Disable date and time inputs
    scheduledDateInput.readOnly = true;
    scheduledTimeInput.readOnly = true;
    scheduledDateInput.style.backgroundColor = '#e5e7eb';
    scheduledTimeInput.style.backgroundColor = '#e5e7eb';
    scheduledDateInput.style.cursor = 'not-allowed';
    scheduledTimeInput.style.cursor = 'not-allowed';

    // Create and insert event notification
    const schedulingSection = scheduledDateInput.closest('.section-card');
    if (schedulingSection) {
        const eventNotification = document.createElement('div');
        eventNotification.className = 'event-notification';
        eventNotification.innerHTML = `
            <div class="event-notification-icon">📅</div>
            <div class="event-notification-content">
                <div class="event-notification-title">Evento Agendado!</div>
                <div class="event-notification-text">
                    Este Self Assessment tem um <strong>evento global</strong> marcado para
                    <strong>${formattedDate}</strong> às <strong>${formattedTime}</strong> (horario de Brasilia).
                </div>
                <div class="event-notification-note">
                    Todos os participantes iniciarão no mesmo momento.
                    Você só precisa selecionar seu fuso horário abaixo para que possamos mostrar o horário correto para você.
                </div>
            </div>
        `;

        // Insert before the date input's parent group
        const dateGroup = scheduledDateInput.closest('.form-group');
        if (dateGroup) {
            dateGroup.parentNode.insertBefore(eventNotification, dateGroup);
        }
    }
}

// Populate percentage dropdown
function populatePercentageDropdown(elementId) {
    const select = document.getElementById(elementId);
    select.innerHTML = '<option value="">Selecione...</option>';

    for (let i = 0; i <= 100; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}%`;
        select.appendChild(option);
    }
}

// Setup radio groups with click styling
function setupRadioGroups() {
    const radioGroups = document.querySelectorAll('.radio-group');

    radioGroups.forEach(group => {
        const options = group.querySelectorAll('.radio-option');

        options.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');

            option.addEventListener('click', () => {
                // Remove selected class from all options in this group
                options.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
                // Check the radio
                radio.checked = true;
                // Trigger change event for "Outro" field handling
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    });
}

// Setup "Outro" field toggles
function setupOtherFieldToggles() {
    // UWorld usage
    document.querySelectorAll('input[name="uworld_usage"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const otherField = document.getElementById('uworld-usage-other');
            otherField.style.display = radio.value === 'outro' && radio.checked ? 'block' : 'none';
            otherField.required = radio.value === 'outro' && radio.checked;
        });
    });

    // Anki usage
    document.querySelectorAll('input[name="anki_usage"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const otherField = document.getElementById('anki-usage-other');
            otherField.style.display = radio.value === 'outro' && radio.checked ? 'block' : 'none';
            otherField.required = radio.value === 'outro' && radio.checked;
        });
    });

    // Boards & Beyond usage
    document.querySelectorAll('input[name="bnb_usage"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const otherField = document.getElementById('bnb-usage-other');
            otherField.style.display = radio.value === 'outro' && radio.checked ? 'block' : 'none';
            otherField.required = radio.value === 'outro' && radio.checked;
        });
    });
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    // Get basic info fields
    const studyStage = document.querySelector('input[name="study_stage"]:checked')?.value;
    const graduationDate = document.getElementById('graduation-date').value;
    const currentInstitution = document.getElementById('current-institution').value.trim();
    const currentAddress = document.getElementById('current-address').value.trim();

    // Get form values
    const studyStartDate = document.getElementById('study-start-date').value;
    const plannedStep1Date = document.getElementById('planned-step1-date').value;
    const uworldProgress = parseInt(document.getElementById('uworld-progress').value);
    const uworldAccuracy = parseInt(document.getElementById('uworld-accuracy').value);

    // Get UWorld systems (checkboxes)
    const uworldSystems = Array.from(document.querySelectorAll('input[name="uworld_systems"]:checked'))
        .map(cb => cb.value);

    // Get resource usage values
    let uworldUsage = document.querySelector('input[name="uworld_usage"]:checked')?.value;
    let ankiUsage = document.querySelector('input[name="anki_usage"]:checked')?.value;
    let bnbUsage = document.querySelector('input[name="bnb_usage"]:checked')?.value;

    // Handle "Outro" values
    if (uworldUsage === 'outro') {
        uworldUsage = 'outro: ' + document.getElementById('uworld-usage-other').value.trim();
    }
    if (ankiUsage === 'outro') {
        ankiUsage = 'outro: ' + document.getElementById('anki-usage-other').value.trim();
    }
    if (bnbUsage === 'outro') {
        bnbUsage = 'outro: ' + document.getElementById('bnb-usage-other').value.trim();
    }

    // Scheduling fields
    const userTimezone = document.getElementById('user-timezone').value;
    const scheduledDate = document.getElementById('scheduled-date').value;
    const scheduledTime = document.getElementById('scheduled-time').value;

    // Validation - Basic info
    if (!studyStage) {
        showToast('Selecione em qual etapa do processo voce esta', 'error');
        return;
    }

    if (!graduationDate) {
        showToast('Informe a data de conclusao do curso de Medicina', 'error');
        return;
    }

    if (!currentInstitution) {
        showToast('Informe sua instituicao atual', 'error');
        return;
    }

    if (!currentAddress) {
        showToast('Informe seu endereco atual', 'error');
        return;
    }

    // Validation - Study timeline
    if (!studyStartDate) {
        showToast('Informe quando comecou a estudar para o Step 1', 'error');
        return;
    }

    if (!plannedStep1Date) {
        showToast('Informe a data aproximada do Step 1', 'error');
        return;
    }

    if (isNaN(uworldProgress)) {
        showToast('Selecione o progresso do UWorld', 'error');
        return;
    }

    if (isNaN(uworldAccuracy)) {
        showToast('Selecione a porcentagem de acertos do UWorld', 'error');
        return;
    }

    if (uworldSystems.length === 0) {
        showToast('Selecione pelo menos um sistema do UWorld', 'error');
        return;
    }

    if (!uworldUsage) {
        showToast('Informe como tem usado o UWorld', 'error');
        return;
    }

    if (!ankiUsage) {
        showToast('Informe como tem usado o Anki', 'error');
        return;
    }

    if (!bnbUsage) {
        showToast('Informe como tem usado o Boards & Beyond', 'error');
        return;
    }

    if (!scheduledDate || !scheduledTime) {
        showToast('Escolha a data e horario para realizar o Self Assessment', 'error');
        return;
    }

    // Validate scheduled datetime is in the future
    const scheduledDateTimeLocal = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    if (scheduledDateTimeLocal <= now) {
        showToast('O horario agendado deve ser no futuro', 'error');
        return;
    }

    // Convert to UTC for storage
    const scheduledDateTimeUTC = convertToUTC(scheduledDate, scheduledTime, userTimezone);

    showLoading();
    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.disabled = true;

    try {
        // Create enrollment with all fields
        const { data: enrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .insert({
                user_id: currentUser.id,
                self_assessment_id: assessmentId,
                // Basic info fields
                study_stage: studyStage,
                graduation_date: graduationDate,
                current_institution: currentInstitution,
                current_address: currentAddress,
                // Study timeline fields
                study_start_date: studyStartDate,
                planned_step1_date: plannedStep1Date,
                uworld_progress: uworldProgress,
                uworld_accuracy: uworldAccuracy,
                uworld_systems: uworldSystems,
                uworld_usage: uworldUsage,
                anki_usage: ankiUsage,
                bnb_usage: bnbUsage,
                // Scheduling fields
                scheduled_date: scheduledDate,
                scheduled_time: scheduledTime,
                user_timezone: userTimezone,
                scheduled_datetime_utc: scheduledDateTimeUTC,
                schedule_set_by: activeEvent ? 'event' : 'student',
                // Event fields (if applicable)
                event_id: activeEvent ? activeEvent.id : null,
                is_event_enrollment: activeEvent ? true : false,
                status: 'enrolled',
                enrolled_at: new Date().toISOString()
            })
            .select()
            .single();

        if (enrollmentError) {
            throw enrollmentError;
        }

        // If this is a Ward Academy internal student, also update the assessment_enrollments table
        if (enrollmentId) {
            const { error: wardEnrollError } = await window.supabase
                .from('assessment_enrollments')
                .update({
                    student_marked_registered: true,
                    registration_confirmed_by_mentor: true, // Auto-confirm for internal
                    is_unlocked: true, // Auto-unlock for internal
                    unlocked_at: new Date().toISOString()
                })
                .eq('id', enrollmentId);

            if (wardEnrollError) {
                console.error('Error updating Ward enrollment:', wardEnrollError);
            }
        }

        hideLoading();
        showToast('Inscricao realizada com sucesso!', 'success');

        // Redirect based on user type
        setTimeout(() => {
            if (enrollmentId) {
                window.location.href = 'assessments.html';
            } else {
                window.location.href = 'dashboard-externo.html';
            }
        }, 1500);

    } catch (error) {
        console.error('Enrollment error:', error);
        hideLoading();
        btnSubmit.disabled = false;
        showToast('Erro ao realizar inscricao. Tente novamente.', 'error');
    }
}

// Convert local date/time to UTC based on timezone
function convertToUTC(date, time, timezone) {
    try {
        // Create a date string in the local timezone format
        const localDateTimeStr = `${date}T${time}:00`;

        // Parse the local datetime
        const localDate = new Date(localDateTimeStr);

        // Get the timezone offset
        const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
        const offset = utcDate - tzDate;

        // Apply offset to get UTC
        const utcResult = new Date(localDate.getTime() + offset);

        return utcResult.toISOString();
    } catch (e) {
        console.error('Error converting to UTC:', e);
        // Fallback: just return the datetime as-is in ISO format
        return new Date(`${date}T${time}:00`).toISOString();
    }
}

// Show loading overlay
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
