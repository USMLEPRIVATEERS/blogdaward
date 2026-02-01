// Auth
async function secureLogin(cpf, password) {
    // Verificar rate limiting
    if (window.WardSecurity && !WardSecurity.canAttemptLogin()) {
        const remaining = WardSecurity.getLoginLockoutTime();
        showToast(`Muitas tentativas. Aguarde ${remaining} segundos.`, 'error');
        return false;
    }

    showLoading();

    try {
        // Validar CPF
        const cleanCPF = cpf.replace(/\D/g, '');

        if (window.WardSecurity && !WardSecurity.validateCPF(cleanCPF)) {
            hideLoading();
            showToast('CPF inválido', 'error');
            if (window.WardSecurity) WardSecurity.recordLoginAttempt(false);
            return false;
        }


        const { data: userData, error: userError } = await WardApp.db
            .from('users')
            .select('*')
            .eq('cpf', cleanCPF)
            .single();


        if (userError || !userData) {
            hideLoading();
            showToast('CPF ou senha incorretos', 'error');
            if (window.WardSecurity) WardSecurity.recordLoginAttempt(false);
            return false;
        }

        // Verificar se usuario esta inativo
        if (userData.status === 'inactive') {
            hideLoading();
            showToast('Esta conta está inativa. Entre em contato com o administrador.', 'error');
            return false;
        }


        if (userData.auth_id && userData.email) {

            const { data: authData, error: authError } = await WardApp.db.auth.signInWithPassword({
                email: userData.email,
                password: password
            });


            if (authError || !authData.user) {
                hideLoading();
                showToast('CPF ou senha incorretos', 'error');
                if (window.WardSecurity) WardSecurity.recordLoginAttempt(false);
                return false;
            }
        } else {


            const { data: loginResult, error: rpcError } = await WardApp.db
                .rpc('secure_login', {
                    p_cpf: cleanCPF,
                    p_password: password
                });


            if (rpcError) {
                hideLoading();
                showToast('Erro ao verificar credenciais', 'error');
                if (window.WardSecurity) WardSecurity.recordLoginAttempt(false);
                return false;
            }

            if (!loginResult || !loginResult.success) {
                hideLoading();
                showToast('CPF ou senha incorretos', 'error');
                if (window.WardSecurity) WardSecurity.recordLoginAttempt(false);
                return false;
            }

            // Atualizar userData com dados retornados do servidor
            Object.assign(userData, loginResult.user);
        }

        // Login bem sucedido
        if (window.WardSecurity) WardSecurity.recordLoginAttempt(true);

        // Normalizar dados do usuario
        const normalizedUser = {
            ...userData,
            name: userData.name || userData.full_name || userData.cpf
        };

        // Armazenar dados do usuario
        if (window.WardSecurity) {
            WardSecurity.storeUserSecurely(normalizedUser);
        } else {
            localStorage.setItem('ward_user', JSON.stringify(normalizedUser));
        }

        hideLoading();

        // Redirecionar baseado no estado do usuario
        redirectAfterLogin(normalizedUser);

        return true;
    } catch (err) {
        hideLoading();
        console.error('Login error:', err);
        showToast('Erro ao fazer login. Tente novamente.', 'error');
        if (window.WardSecurity) WardSecurity.recordLoginAttempt(false);
        return false;
    }
}

function redirectAfterLogin(user) {
    
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
        // Clear intended URL since user needs to complete questionnaire
        localStorage.removeItem('ward_intended_url');
        window.location.href = stepUrls[step] || stepUrls[0];
        return;
    }

    // Check if there's a saved intended URL from before login
    const intendedUrl = localStorage.getItem('ward_intended_url');
    if (intendedUrl) {
        
        localStorage.removeItem('ward_intended_url');
        // Make sure the intended URL is from the same origin (security check)
        try {
            const url = new URL(intendedUrl);
            if (url.origin === window.location.origin) {
                window.location.href = intendedUrl;
                return;
            }
        } catch (e) {
            // Invalid URL, ignore and redirect to dashboard
            console.warn('Invalid intended URL:', intendedUrl);
        }
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

async function secureLoadQuestionnaireData(step) {
    const user = WardSecurity.getStoredUser();
    if (!user) return null;

    
    let targetUserId = user.id;

    
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

async function secureSaveQuestionnaireData(step, formData) {
    const user = WardSecurity.getStoredUser();
    if (!user) return false;

    
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

function secureLogout() {
    WardSecurity.clearUserData();
    
    localStorage.removeItem('ward_intended_url');
    window.location.href = 'index.html';
}

function checkSecureAuth() {
    const user = WardSecurity.getStoredUser();
    if (!user) {
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            
            const intendedUrl = window.location.href;
            localStorage.setItem('ward_intended_url', intendedUrl);
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
    
    setTimeout(function() {
        if (window.WardApp) {
            
            window.WardApp.login = secureLogin;
            window.WardApp.logout = secureLogout;
            window.WardApp.checkAuth = checkSecureAuth;
            
        }
    }, 100);
});
