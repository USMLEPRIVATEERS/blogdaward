// ============================================
// WARD ACADEMY - REGISTRATION
// Self Assessments Gratuitos
// ============================================

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
        initializeForm();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar pagina', 'error');
    }
});

function initializeForm() {
    const form = document.getElementById('register-form');
    const countryCodeInput = document.getElementById('country-code');
    const phoneInput = document.getElementById('phone-number');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Country code formatting
    countryCodeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d+]/g, '');
        if (!value.startsWith('+') && value.length > 0) {
            value = '+' + value;
        }
        e.target.value = value;
    });

    // Phone number formatting - allow digits, spaces, and hyphens
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d\s\-]/g, '');
        e.target.value = value;
        hideError('phone-error');
    });

    // Email validation
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            showError('email-error');
            emailInput.classList.add('error');
        } else {
            hideError('email-error');
            emailInput.classList.remove('error');
        }
    });

    // Password strength indicator
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        updatePasswordStrength(password);
    });

    // Confirm password validation
    confirmPasswordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (confirmPassword && password !== confirmPassword) {
            showError('password-match-error');
            confirmPasswordInput.classList.add('error');
        } else {
            hideError('password-match-error');
            confirmPasswordInput.classList.remove('error');
        }
    });

    // Form submission
    form.addEventListener('submit', handleSubmit);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(countryCode, phoneNumber) {
    // Remove spaces and hyphens from phone
    const cleanPhone = phoneNumber.replace(/[\s\-]/g, '');
    // Check if country code starts with + and has 1-3 digits
    const codeRegex = /^\+\d{1,3}$/;
    // Check if phone has at least 7 digits
    const phoneRegex = /^\d{7,15}$/;

    return codeRegex.test(countryCode) && phoneRegex.test(cleanPhone);
}

function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('password-strength-bar');

    if (password.length === 0) {
        strengthBar.className = 'password-strength-bar';
        return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;

    // Character variety
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
        strengthBar.className = 'password-strength-bar weak';
    } else if (strength <= 3) {
        strengthBar.className = 'password-strength-bar medium';
    } else {
        strengthBar.className = 'password-strength-bar strong';
    }
}

function showError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const countryCode = document.getElementById('country-code').value.trim();
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validation
    if (!name) {
        showToast('Digite seu nome completo', 'error');
        return;
    }

    if (!isValidPhone(countryCode, phoneNumber)) {
        showError('phone-error');
        showToast('Numero de WhatsApp invalido', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showError('email-error');
        showToast('Email invalido', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Senha deve ter no minimo 6 caracteres', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showError('password-match-error');
        showToast('As senhas nao coincidem', 'error');
        return;
    }

    // Combine phone number
    const fullPhone = `${countryCode} ${phoneNumber}`;

    // Show loading
    showLoading();
    const btnRegister = document.getElementById('btn-register');
    btnRegister.disabled = true;

    try {
        // Check if email already exists
        const { data: existingUser, error: checkError } = await window.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            hideLoading();
            btnRegister.disabled = false;
            showToast('Este email ja esta cadastrado', 'error');
            return;
        }

        // Hash password
        const hashedPassword = btoa(password + '_ward_salt_2024');

        // Generate a unique identifier for external users (using timestamp + random)
        const uniqueId = `EXT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

        // Create user
        const { data: newUser, error: insertError } = await window.supabase
            .from('users')
            .insert({
                cpf: uniqueId,  // Using unique ID since external users don't have CPF
                name: name,
                full_name: name,
                email: email,
                whatsapp: fullPhone,
                password_hash: hashedPassword,
                role: 'externo',
                status: 'active',
                first_login_completed: true,  // External users skip questionnaire
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        hideLoading();

        // Store user data and redirect
        localStorage.setItem('ward_user', JSON.stringify(newUser));

        showToast('Conta criada com sucesso!', 'success');

        // Redirect to external dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard-externo.html';
        }, 1000);

    } catch (error) {
        console.error('Registration error:', error);
        hideLoading();
        btnRegister.disabled = false;
        showToast('Erro ao criar conta. Tente novamente.', 'error');
    }
}
