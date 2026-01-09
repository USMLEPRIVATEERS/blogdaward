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

    // Combine address fields
    const address = complement
        ? `${city}, ${state}, ${country} - ${complement}`
        : `${city}, ${state}, ${country}`;

    showLoading();
    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.disabled = true;

    try {
        // Create enrollment
        const { data: enrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .insert({
                user_id: currentUser.id,
                self_assessment_id: assessmentId,
                study_stage: studyStage,
                graduation_date: graduationDate,
                current_institution: institution,
                current_address: address,
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
