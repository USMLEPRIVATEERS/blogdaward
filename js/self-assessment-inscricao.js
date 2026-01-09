// ============================================
// WARD ACADEMY - SELF ASSESSMENT ENROLLMENT
// ============================================

let currentUser = null;
let assessmentId = null;
let assessmentData = null;

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

    if (!assessmentId) {
        showToast('Self Assessment nao encontrado', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
        return;
    }

    showLoading();

    try {
        // Check if already enrolled
        const { data: existingEnrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('self_assessment_id', assessmentId)
            .maybeSingle();

        if (existingEnrollment) {
            showToast('Voce ja esta inscrito neste Self Assessment', 'info');
            setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
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

        // Update UI
        document.getElementById('assessment-name').textContent = assessment.name;
        document.getElementById('assessment-description').textContent = assessment.description || '';

        const totalBlocks = Math.ceil(assessment.total_questions / assessment.questions_per_block);
        document.getElementById('total-questions').textContent = `${assessment.total_questions} questoes`;
        document.getElementById('total-blocks').textContent = `${totalBlocks} blocos`;
        document.getElementById('time-per-block').textContent = `${assessment.time_per_block_minutes}min por bloco`;

        hideLoading();
    } catch (error) {
        console.error('Error loading assessment:', error);
        hideLoading();
        showToast('Erro ao carregar Self Assessment', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
    }
}

// Initialize form
function initializeForm() {
    const form = document.getElementById('enrollment-form');
    const radioOptions = document.querySelectorAll('.radio-option');

    // Radio option selection styling
    radioOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');

        option.addEventListener('click', () => {
            // Remove selected class from all options
            radioOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
            // Check the radio
            radio.checked = true;
        });
    });

    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledDateInput = document.getElementById('scheduled-date');
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

    // Form submission
    form.addEventListener('submit', handleSubmit);
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    // Get form values
    const studyStage = document.querySelector('input[name="study_stage"]:checked')?.value;
    const graduationDate = document.getElementById('graduation-date').value;
    const institution = document.getElementById('institution').value.trim();
    const country = document.getElementById('country').value.trim();
    const state = document.getElementById('state').value.trim();
    const city = document.getElementById('city').value.trim();
    const complement = document.getElementById('complement').value.trim();

    // Scheduling fields
    const userTimezone = document.getElementById('user-timezone').value;
    const scheduledDate = document.getElementById('scheduled-date').value;
    const scheduledTime = document.getElementById('scheduled-time').value;

    // Validation
    if (!studyStage) {
        showToast('Selecione sua etapa de estudo', 'error');
        return;
    }

    if (!graduationDate) {
        showToast('Informe a data de conclusao do curso', 'error');
        return;
    }

    if (!institution) {
        showToast('Informe sua instituicao atual', 'error');
        return;
    }

    if (!country || !state || !city) {
        showToast('Preencha pais, estado e cidade', 'error');
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

    // Combine address fields
    const address = complement
        ? `${city}, ${state}, ${country} - ${complement}`
        : `${city}, ${state}, ${country}`;

    showLoading();
    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.disabled = true;

    try {
        // Create enrollment with scheduling
        const { data: enrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .insert({
                user_id: currentUser.id,
                self_assessment_id: assessmentId,
                study_stage: studyStage,
                graduation_date: graduationDate,
                current_institution: institution,
                current_address: address,
                scheduled_date: scheduledDate,
                scheduled_time: scheduledTime,
                user_timezone: userTimezone,
                scheduled_datetime_utc: scheduledDateTimeUTC,
                schedule_set_by: 'student',
                status: 'enrolled',
                enrolled_at: new Date().toISOString()
            })
            .select()
            .single();

        if (enrollmentError) {
            throw enrollmentError;
        }

        hideLoading();
        showToast('Inscricao realizada com sucesso!', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard-externo.html';
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

        // Create date in the specified timezone and get UTC
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

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
