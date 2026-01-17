// =============================================
// WARD ACADEMY - SECURITY UTILITIES
// Funcoes de seguranca para o frontend
// =============================================

/**
 * Sanitiza string para prevenir XSS
 * Usa a abordagem de criar um elemento de texto e extrair o HTML escapado
 */
function sanitizeHTML(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitiza um objeto inteiro (recursivo)
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeHTML(obj);
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);

    const sanitized = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
    }
    return sanitized;
}

/**
 * Cria elemento HTML seguro a partir de template
 * Substitui ${varName} por valores sanitizados
 */
function createSafeElement(template, data) {
    let html = template;
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const value = sanitizeHTML(data[key]);
            html = html.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        }
    }
    return html;
}

/**
 * Define innerHTML de forma segura
 * Sanitiza todos os dados antes de inserir
 */
function setSafeHTML(element, template, data) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (!element) return;
    element.innerHTML = createSafeElement(template, data);
}

/**
 * Valida CPF (formato basico)
 */
function validateCPF(cpf) {
    // Remove caracteres nao numericos
    cpf = cpf.replace(/\D/g, '');

    // Verifica se tem 11 digitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os digitos sao iguais
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validacao dos digitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
}

/**
 * Valida email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida senha (minimo 8 caracteres)
 */
function validatePassword(password) {
    return password && password.length >= 8;
}

/**
 * Gera token CSRF
 */
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Armazena token CSRF de forma segura
 */
function setCSRFToken() {
    const token = generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);
    return token;
}

/**
 * Obtem token CSRF
 */
function getCSRFToken() {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
        token = setCSRFToken();
    }
    return token;
}

/**
 * Dados seguros para localStorage (sem informacoes sensiveis)
 */
function createSafeUserData(userData) {
    // Retorna apenas dados necessarios para o frontend
    // NUNCA armazena password_hash ou outros dados sensiveis
    return {
        id: userData.id,
        email: userData.email,
        cpf: userData.cpf,
        name: userData.name || userData.full_name || userData.cpf,
        full_name: userData.full_name || userData.name,
        role: userData.role,
        first_login_completed: userData.first_login_completed,
        questionnaire_step: userData.questionnaire_step || 0,
        status: userData.status
    };
}

/**
 * Armazena dados do usuario de forma segura
 */
function storeUserSecurely(userData) {
    const safeData = createSafeUserData(userData);
    localStorage.setItem('ward_user', JSON.stringify(safeData));
}

/**
 * Obtem dados do usuario do storage
 */
function getStoredUser() {
    try {
        const data = localStorage.getItem('ward_user');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error reading user data:', e);
        return null;
    }
}

/**
 * Limpa dados do usuario (logout)
 */
function clearUserData() {
    localStorage.removeItem('ward_user');
    localStorage.removeItem('view_as_student');
    sessionStorage.removeItem('csrf_token');
}

/**
 * Rate limiting simples para tentativas de login
 */
const loginAttempts = {
    count: 0,
    lastAttempt: 0,
    maxAttempts: 5,
    lockoutTime: 300000, // 5 minutos

    canAttempt() {
        const now = Date.now();

        // Reset se passou o tempo de lockout
        if (now - this.lastAttempt > this.lockoutTime) {
            this.count = 0;
        }

        return this.count < this.maxAttempts;
    },

    recordAttempt() {
        this.count++;
        this.lastAttempt = Date.now();
    },

    recordSuccess() {
        this.count = 0;
    },

    getRemainingTime() {
        const elapsed = Date.now() - this.lastAttempt;
        const remaining = this.lockoutTime - elapsed;
        return Math.max(0, Math.ceil(remaining / 1000));
    }
};

/**
 * Verifica se pode fazer login
 */
function canAttemptLogin() {
    return loginAttempts.canAttempt();
}

/**
 * Registra tentativa de login
 */
function recordLoginAttempt(success = false) {
    if (success) {
        loginAttempts.recordSuccess();
    } else {
        loginAttempts.recordAttempt();
    }
}

/**
 * Tempo restante de bloqueio
 */
function getLoginLockoutTime() {
    return loginAttempts.getRemainingTime();
}

// Exportar funcoes para uso global
window.WardSecurity = {
    sanitizeHTML,
    sanitizeObject,
    createSafeElement,
    setSafeHTML,
    validateCPF,
    validateEmail,
    validatePassword,
    generateCSRFToken,
    setCSRFToken,
    getCSRFToken,
    createSafeUserData,
    storeUserSecurely,
    getStoredUser,
    clearUserData,
    canAttemptLogin,
    recordLoginAttempt,
    getLoginLockoutTime
};
