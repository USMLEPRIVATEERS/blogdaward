// ========================================
// 📝 LISTA DE ARQUIVOS - ÚNICO LUGAR!
// ========================================
// ⚠️ ATENÇÃO: Este é o ÚNICO lugar onde você adiciona páginas!
// Não precisa editar mais nada - o resto é automático!

const PAGE_FILES = [
    'Sobre_a_Ward_Academy.html',
    'Ferramentas_de_Estudo;Anki;Guia_Completo.html',
    'Estagios_Internacionais;USA;Observerships;Mapa_de_Observerships.html',
    'Conteudos;Step_1;Boards_and_Beyond.html',
    'Templates;Letter_of_Intent.html',
    'Templates;Deans_Letter.html',
    'Templates;Curriculum_Vitae.html',
    'Templates;Personal_Statement.html',
    'Noticias;Vistos;Taxa_de_100.000_para_visto_H1B.html',
];

// Estado da aplicação
let currentPage = null;
let navigationTree = null;
let allPages = [];
let searchIndex = [];

// ========================================
// PROTEÇÃO CONTRA CÓPIA
// ========================================

// Prevenir ações do teclado
document.addEventListener('keydown', function(e) {
    // Bloquear Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+S, Ctrl+U, F12, Ctrl+Shift+I
    if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'v' || e.key === 'a' || e.key === 's' || e.key === 'u')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        e.key === 'F12'
    ) {
        e.preventDefault();
        return false;
    }
});

// Prevenir clique direito
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Prevenir arrastar e soltar
document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});

// Proteção adicional contra DevTools
setInterval(function() {
    debugger;
}, 100);

// ========================================
// AUTENTICAÇÃO
// ========================================

function checkAuth() {
    const loggedIn = localStorage.getItem('wardAcademyAuth');
    return loggedIn === 'true';
}

function login(cpf) {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (colours.includes(cleanCPF)) {
        localStorage.setItem('wardAcademyAuth', 'true');
        localStorage.setItem('wardAcademyCPF', cleanCPF);
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('wardAcademyAuth');
    localStorage.removeItem('wardAcademyCPF');
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-platform').style.display = 'none';
}

function showPlatform() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-platform').style.display = 'flex';
    initializePlatform();
}

function showWelcomeScreen() {
    // Selecionar 6 páginas aleatórias para sugerir
    const shuffled = [...allPages].sort(() => 0.5 - Math.random());
    const suggested = shuffled.slice(0, 6);
    
    // Gerar HTML dos cards de sugestão
    const suggestionCards = suggested.map(file => {
        const displayName = file
            .replace('.html', '')
            .split(';')
            .map(part => part.replace(/_/g, ' '))
            .join(' > ');
        
        // Ícones aleatórios variados
        const icons = ['📖', '🎯', '💡', '🔬', '📚', '✨', '🚀', '💪', '🎓', '📝', '🏆', '⚡'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        
        return `
            <div class="feature-card suggestion-card" data-file="${file}" style="cursor: pointer;">
                <span class="feature-icon">${randomIcon}</span>
                <h3>${displayName.split(' > ').pop()}</h3>
                <p class="suggestion-path">${displayName}</p>
            </div>
        `;
    }).join('');
    
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="welcome-screen">
            <h1>Bem-vindo à Ward Academy! 🎓</h1>
            <p class="welcome-subtitle">Sua jornada rumo à equivalência médica nos EUA começa aqui</p>
            
            <div class="quick-start">
                <h2>🚀 Primeiros Passos</h2>
                <ol class="steps-list">
                    <li>Explore o menu lateral para ver todos os conteúdos disponíveis</li>
                    <li>Use a barra de busca para encontrar tópicos específicos</li>
                    <li>Clique nos tópicos para expandir e acessar as aulas</li>
                    <li>Você pode acessar de qualquer dispositivo - celular, tablet ou computador</li>
                </ol>
            </div>

            <div class="platform-features">
                <h2>💫 Sugestões para você (atualize para ver outras)</h2>
                <div class="features-grid">
                    ${suggestionCards}
                </div>
            </div>

            <div class="support-section">
                <h2>💬 Precisa de Ajuda?</h2>
                <p>Nossa equipe está disponível através do grupo de WhatsApp exclusivo. A Dra. Iria responde dúvidas diariamente, inclusive aos finais de semana!</p>
            </div>
        </div>
    `;
    
    // Adicionar event listeners nos cards de sugestão
    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', () => {
            const file = card.getAttribute('data-file');
            loadPage(file);
            
            // Destacar no menu se possível
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        });
    });
    
    // Remove active de todos os links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    // Scroll para o topo
    contentArea.scrollTop = 0;
}

// ========================================
// NAVEGAÇÃO E ESTRUTURA DE ARQUIVOS
// ========================================

async function loadNavigationStructure() {
    // Usa a lista PAGE_FILES definida no topo do arquivo
    allPages = PAGE_FILES;
    navigationTree = buildNavigationTree(PAGE_FILES);
    renderNavigation();
    await buildSearchIndex();
    
    console.log(`✅ ${PAGE_FILES.length} páginas carregadas com sucesso!`);
    
    // Mostrar tela de boas-vindas com sugestões aleatórias
    showWelcomeScreen();
}

function buildNavigationTree(files) {
    const tree = {};
    
    files.forEach(file => {
        // Remove .html
        const name = file.replace('.html', '');
        
        // Divide por ; para obter hierarquia
        const parts = name.split(';');
        
        let current = tree;
        parts.forEach((part, index) => {
            // Substitui _ por espaço
            const displayName = part.replace(/_/g, ' ');
            
            if (!current[part]) {
                current[part] = {
                    name: displayName,
                    fullPath: parts.slice(0, index + 1).join(';'),
                    children: {},
                    isLeaf: index === parts.length - 1,
                    file: index === parts.length - 1 ? file : null
                };
            }
            current = current[part].children;
        });
    });
    
    return tree;
}

function renderNavigation() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';
    
    function renderLevel(items, parent, level = 0) {
        Object.keys(items).forEach(key => {
            const item = items[key];
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            
            const link = document.createElement('div');
            link.className = 'nav-link';
            
            // Ícone baseado no nível
            const icons = ['📁', '📄', '📋', '📝'];
            const icon = document.createElement('span');
            icon.className = 'nav-icon';
            icon.textContent = item.isLeaf ? '📄' : icons[Math.min(level, icons.length - 1)];
            
            const text = document.createElement('span');
            text.className = 'nav-text';
            text.textContent = item.name;
            
            link.appendChild(icon);
            link.appendChild(text);
            
            // Se tem filhos, adicionar seta
            if (Object.keys(item.children).length > 0) {
                const arrow = document.createElement('span');
                arrow.className = 'nav-arrow';
                arrow.textContent = '▶';
                link.appendChild(arrow);
                
                // Click para expandir/colapsar
                link.addEventListener('click', function(e) {
                    e.stopPropagation();
                    this.classList.toggle('expanded');
                    const children = this.parentElement.querySelector('.nav-children');
                    if (children) {
                        children.style.display = children.style.display === 'none' ? 'block' : 'none';
                    }
                });
            } else {
                // É uma folha (página), carregar ao clicar
                link.addEventListener('click', function() {
                    loadPage(item.file);
                    
                    // Remover active de todos
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    
                    // Adicionar active neste
                    this.classList.add('active');
                    
                    // Fechar sidebar em mobile
                    if (window.innerWidth <= 768) {
                        closeSidebar();
                    }
                });
            }
            
            navItem.appendChild(link);
            
            // Se tem filhos, renderizar recursivamente
            if (Object.keys(item.children).length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'nav-children';
                childrenContainer.style.display = 'none';
                renderLevel(item.children, childrenContainer, level + 1);
                navItem.appendChild(childrenContainer);
            }
            
            parent.appendChild(navItem);
        });
    }
    
    renderLevel(navigationTree, nav);
}

async function loadPage(file) {
    try {
        const response = await fetch(`pages/${file}`);
        if (!response.ok) throw new Error('Página não encontrada');
        
        const html = await response.text();
        
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `<div class="page-content">${html}</div>`;
        contentArea.scrollTop = 0;
        
        currentPage = file;
    } catch (error) {
        console.error('Erro ao carregar página:', error);
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="welcome-screen">
                <h1>Erro ao Carregar 😕</h1>
                <p class="welcome-subtitle">A página solicitada não foi encontrada</p>
            </div>
        `;
    }
}

// ========================================
// BUSCA
// ========================================

async function buildSearchIndex() {
    searchIndex = [];
    
    for (const file of allPages) {
        try {
            const response = await fetch(`pages/${file}`);
            const html = await response.text();
            
            // Extrair texto do HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const text = doc.body.textContent || '';
            
            // Extrair título
            const h1 = doc.querySelector('h1');
            const title = h1 ? h1.textContent : file.replace('.html', '').replace(/_/g, ' ').split(';').pop();
            
            searchIndex.push({
                file: file,
                title: title,
                content: text.toLowerCase(),
                path: file.replace('.html', '').replace(/_/g, ' ').replace(/;/g, ' > ')
            });
        } catch (error) {
            console.error(`Erro ao indexar ${file}:`, error);
        }
    }
}

function performSearch(query) {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    searchIndex.forEach(item => {
        const titleMatch = item.title.toLowerCase().includes(lowerQuery);
        const contentMatch = item.content.includes(lowerQuery);
        
        if (titleMatch || contentMatch) {
            // Encontrar contexto
            let preview = '';
            if (contentMatch) {
                const index = item.content.indexOf(lowerQuery);
                const start = Math.max(0, index - 50);
                const end = Math.min(item.content.length, index + lowerQuery.length + 50);
                preview = '...' + item.content.substring(start, end) + '...';
            } else {
                preview = item.content.substring(0, 150) + '...';
            }
            
            results.push({
                file: item.file,
                title: item.title,
                path: item.path,
                preview: preview,
                relevance: titleMatch ? 2 : 1
            });
        }
    });
    
    // Ordenar por relevância
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results;
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    const resultsContent = document.getElementById('search-results-content');
    
    if (results.length === 0) {
        resultsContent.innerHTML = `
            <div class="no-results">
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente usar palavras-chave diferentes</p>
            </div>
        `;
    } else {
        resultsContent.innerHTML = results.map(result => {
            const highlightedPreview = highlightSearchTerms(result.preview, query);
            
            return `
                <div class="search-result-item" data-file="${result.file}">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-path">${result.path}</div>
                    <div class="search-result-preview">${highlightedPreview}</div>
                </div>
            `;
        }).join('');
        
        // Adicionar event listeners
        resultsContent.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const file = item.getAttribute('data-file');
                loadPage(file);
                searchResults.style.display = 'none';
            });
        });
    }
    
    searchResults.style.display = 'block';
}

function highlightSearchTerms(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// ========================================
// SIDEBAR CONTROLS
// ========================================

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    
    sidebar.classList.add('open');
    overlay.classList.add('active');
    menuToggle.classList.add('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.classList.remove('active');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================

function initializePlatform() {
    loadNavigationStructure();
    
    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Botão home - volta para tela inicial
    document.getElementById('home-button').addEventListener('click', showWelcomeScreen);
    document.getElementById('home-btn').addEventListener('click', showWelcomeScreen);
    
    // Menu hambúrguer
    document.getElementById('menu-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });
    
    // Overlay - fechar sidebar ao clicar
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
    
    // Busca
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                const results = performSearch(query);
                displaySearchResults(results, query);
            } else {
                document.getElementById('search-results').style.display = 'none';
            }
        }, 300);
    });
    
    // Fechar resultados de busca
    document.getElementById('close-search').addEventListener('click', () => {
        document.getElementById('search-results').style.display = 'none';
        searchInput.value = '';
    });
    
    // Fechar sidebar ao clicar fora (apenas se estiver aberta)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menu-toggle');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            closeSidebar();
        }
    });
    
    // Fechar sidebar ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            }
            
            const searchResults = document.getElementById('search-results');
            if (searchResults.style.display === 'block') {
                searchResults.style.display = 'none';
                document.getElementById('search-input').value = '';
            }
        }
    });
}

const colours = [
            '70929488199',
            '48741361091',
            '48955983816',
            '18198442774',
            '01206376260',
            '41658278860',
            '29430736876',
            '00998228494',
            '08370747701',
            '01032019204',
            '85321281220',
            '34497825841',
            '00844384445', 
];

// ========================================
// EVENT LISTENERS DO LOGIN
// ========================================

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cpfInput = document.getElementById('cpf-input');
    const errorMessage = document.getElementById('error-message');
    const cpf = cpfInput.value.trim();
    
    if (login(cpf)) {
        errorMessage.textContent = '';
        showPlatform();
    } else {
        errorMessage.textContent = 'CPF não autorizado. Verifique com a equipe Ward Academy.';
        cpfInput.value = '';
    }
});

// Permitir apenas números no campo CPF
document.getElementById('cpf-input').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '');
});

// ========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        showPlatform();
    } else {
        showLoginScreen();
    }
});

// Prevenir inspeção em produção
(function() {
    const devtools = /./;
    devtools.toString = function() {
        this.opened = true;
    }
    
    const checkDevTools = setInterval(function() {
        if (devtools.opened) {
            window.location.reload();
        }
    }, 1000);
})();
