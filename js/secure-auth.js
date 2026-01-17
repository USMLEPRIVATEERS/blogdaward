// =============================================
// WARD ACADEMY - AUTENTICACAO SEGURA
// Substitui funcoes de login/registro por versoes seguras
// que usam RPC do Supabase com hash bcrypt no servidor
// =============================================

/**
 * Login seguro usando funcao RPC do Supabase
 * Hash bcrypt e verificado no servidor, nao no cliente
 */
async function secureLogin(cpf, password) {
    // Verificar rate limiting
    if (!WardSecurity.canAttemptLogin()) {
        const remaining = WardSecurity.getLoginLockoutTime();
        showToast(`Muitas tentativas. Aguarde ${remaining} segundos.`, 'error');
        return false;
    }

    showLoading();

    try {
        // Validar CPF
        const cleanCPF = cpf.replace(/\D/g, '');
        if (!WardSecurity.validateCPF(cleanCPF)) {
            hideLoading();
            showToast('CPF inválido', 'error');
            WardSecurity.recordLoginAttempt(false);
            return false;
        }

        // Chamar funcao RPC segura no Supabase
        const { data, error } = await window.supabase.rpc('secure_login', {
            p_cpf: cleanCPF,
            p_password: password
        });

        if (error) {
            console.error('Login RPC error:', error);
            hideLoading();
            showToast('Erro de conexão. Tente novamente.', 'error');
            WardSecurity.recordLoginAttempt(false);
            return false;
        }

        if (!data.success) {
            hideLoading();
            showToast(data.error || 'CPF ou senha incorretos', 'error');
            WardSecurity.recordLoginAttempt(false);
            return false;
        }

        // Login bem sucedido
        WardSecurity.recordLoginAttempt(true);

        // Armazenar dados do usuario de forma segura (sem password_hash)
        WardSecurity.storeUserSecurely(data.user);

        hideLoading();

        // Redirecionar baseado no estado do usuario
        redirectAfterLogin(data.user);

        return true;
    } catch (err) {
        hideLoading();
        console.error('Login error:', err);
        showToast('Erro ao fazer login. Tente novamente.', 'error');
        WardSecurity.recordLoginAttempt(false);
        return false;
    }
}

/**
 * Redireciona usuario apos login baseado em seu estado
 */
function redirectAfterLogin(user) {
    // Verificar se precisa completar questionario
    if (!user.first_login_completed) {
        const step = user.questionnaire_step || 0;
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
        return;
    }

    // Redirecionar baseado na role
    const dashboardMap = {
        'mentor_marcos': 'mentor-dashboard-marcos.html',
        'mentor_iria': 'mentor-dashboard-iria.html',
        'mentor_guilherme': 'mentor-dashboard-guilherme.html',
        'mentor_romulo': 'mentor-dashboard-romulo.html',
        'assessoria': 'dashboard-assessoria-avulsa.html',
        'externo': 'dashboard-externo.html'
    };

    window.location.href = dashboardMap[user.role] || 'dashboard.html';
}

/**
 * Registro seguro usando funcao RPC do Supabase
 */
async function secureRegister(cpf, email, password, fullName, role = 'aluno') {
    showLoading();

    try {
        // Validacoes
        const cleanCPF = cpf.replace(/\D/g, '');

        if (!WardSecurity.validateCPF(cleanCPF)) {
            hideLoading();
            showToast('CPF inválido', 'error');
            return false;
        }

        if (!WardSecurity.validateEmail(email)) {
            hideLoading();
            showToast('Email inválido', 'error');
            return false;
        }

        if (!WardSecurity.validatePassword(password)) {
            hideLoading();
            showToast('Senha deve ter no mínimo 8 caracteres', 'error');
            return false;
        }

        // Chamar funcao RPC segura
        const { data, error } = await window.supabase.rpc('secure_register', {
            p_cpf: cleanCPF,
            p_email: email,
            p_password: password,
            p_full_name: fullName,
            p_role: role
        });

        if (error) {
            console.error('Register RPC error:', error);
            hideLoading();
            showToast('Erro ao criar conta. Tente novamente.', 'error');
            return false;
        }

        if (!data.success) {
            hideLoading();
            showToast(data.error || 'Erro ao criar conta', 'error');
            return false;
        }

        hideLoading();
        showToast('Conta criada com sucesso! Faça login.', 'success');
        return true;
    } catch (err) {
        hideLoading();
        console.error('Register error:', err);
        showToast('Erro ao criar conta. Tente novamente.', 'error');
        return false;
    }
}

/**
 * Alterar senha de forma segura
 */
async function secureChangePassword(userId, oldPassword, newPassword) {
    showLoading();

    try {
        if (!WardSecurity.validatePassword(newPassword)) {
            hideLoading();
            showToast('Nova senha deve ter no mínimo 8 caracteres', 'error');
            return false;
        }

        const { data, error } = await window.supabase.rpc('change_password', {
            p_user_id: userId,
            p_old_password: oldPassword,
            p_new_password: newPassword
        });

        if (error) {
            console.error('Change password error:', error);
            hideLoading();
            showToast('Erro ao alterar senha', 'error');
            return false;
        }

        if (!data.success) {
            hideLoading();
            showToast(data.error || 'Erro ao alterar senha', 'error');
            return false;
        }

        hideLoading();
        showToast('Senha alterada com sucesso!', 'success');
        return true;
    } catch (err) {
        hideLoading();
        console.error('Change password error:', err);
        showToast('Erro ao alterar senha', 'error');
        return false;
    }
}

/**
 * Carregar dados do questionario com verificacao de permissao no servidor
 */
async function secureLoadQuestionnaireData(step) {
    const user = WardSecurity.getStoredUser();
    if (!user) return null;

    // Determinar usuario alvo (suporte a view_as para mentores)
    let targetUserId = user.id;

    // Verificar parametro URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlViewAs = urlParams.get('view_as');

    if (urlViewAs && user.role && user.role.startsWith('mentor')) {
        targetUserId = parseInt(urlViewAs);
    } else {
        // Verificar localStorage
        const viewAsData = JSON.parse(localStorage.getItem('view_as_student') || 'null');
        if (viewAsData && user.role && user.role.startsWith('mentor')) {
            targetUserId = parseInt(viewAsData.id || viewAsData.studentId);
        }
    }

    try {
        const { data, error } = await window.supabase.rpc('get_questionnaire_data', {
            p_requesting_user_id: user.id,
            p_target_user_id: targetUserId,
            p_step: step
        });

        if (error) {
            console.error('Load questionnaire error:', error);
            return null;
        }

        if (!data.success) {
            console.error('Access denied:', data.error);
            showToast('Acesso negado', 'error');
            return null;
        }

        return data.data;
    } catch (err) {
        console.error('Load questionnaire error:', err);
        return null;
    }
}

/**
 * Salvar dados do questionario com verificacao de permissao no servidor
 */
async function secureSaveQuestionnaireData(step, formData) {
    const user = WardSecurity.getStoredUser();
    if (!user) return false;

    // Determinar usuario alvo
    let targetUserId = user.id;

    const urlParams = new URLSearchParams(window.location.search);
    const urlViewAs = urlParams.get('view_as');

    if (urlViewAs && user.role && user.role.startsWith('mentor')) {
        targetUserId = parseInt(urlViewAs);
    } else {
        const viewAsData = JSON.parse(localStorage.getItem('view_as_student') || 'null');
        if (viewAsData && user.role && user.role.startsWith('mentor')) {
            targetUserId = parseInt(viewAsData.id || viewAsData.studentId);
        }
    }

    try {
        const { data, error } = await window.supabase.rpc('save_questionnaire_data', {
            p_requesting_user_id: user.id,
            p_target_user_id: targetUserId,
            p_step: step,
            p_data: formData
        });

        if (error) {
            console.error('Save questionnaire error:', error);
            showToast('Erro ao salvar dados', 'error');
            return false;
        }

        if (!data.success) {
            showToast(data.error || 'Erro ao salvar', 'error');
            return false;
        }

        showToast('Dados salvos com sucesso!', 'success');
        return true;
    } catch (err) {
        console.error('Save questionnaire error:', err);
        showToast('Erro ao salvar dados', 'error');
        return false;
    }
}

/**
 * Listar usuarios (apenas para mentores)
 */
async function secureListUsers() {
    const user = WardSecurity.getStoredUser();
    if (!user) return [];

    try {
        const { data, error } = await window.supabase.rpc('list_users', {
            p_requesting_user_id: user.id
        });

        if (error) {
            console.error('List users error:', error);
            return [];
        }

        if (!data.success) {
            console.error('Access denied:', data.error);
            return [];
        }

        return data.users || [];
    } catch (err) {
        console.error('List users error:', err);
        return [];
    }
}

/**
 * Logout seguro
 */
function secureLogout() {
    WardSecurity.clearUserData();
    window.location.href = 'index.html';
}

/**
 * Verificar autenticacao
 */
function checkSecureAuth() {
    const user = WardSecurity.getStoredUser();
    if (!user) {
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
        return null;
    }
    return user;
}

// Exportar funcoes para uso global
window.WardSecureAuth = {
    login: secureLogin,
    register: secureRegister,
    changePassword: secureChangePassword,
    loadQuestionnaireData: secureLoadQuestionnaireData,
    saveQuestionnaireData: secureSaveQuestionnaireData,
    listUsers: secureListUsers,
    logout: secureLogout,
    checkAuth: checkSecureAuth,
    redirectAfterLogin
};

// Compatibilidade com codigo existente
// Substitui funcoes do WardApp pelas versoes seguras quando disponivel
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar WardApp estar disponivel
    setTimeout(function() {
        if (window.WardApp) {
            // Substituir funcoes por versoes seguras
            window.WardApp.login = secureLogin;
            window.WardApp.logout = secureLogout;
            window.WardApp.checkAuth = checkSecureAuth;
            // Manter compatibilidade mas usar versoes seguras internamente
            console.log('WardSecureAuth: Funcoes de seguranca ativadas');
        }
    }, 100);
});
