// ========================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ========================================

// CPFs autorizados
const AUTHORIZED_CPFS = [
    '70929488199',
    '01206376260'
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
    
    if (AUTHORIZED_CPFS.includes(cleanCPF)) {
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

// ========================================
// NAVEGAÇÃO E ESTRUTURA DE ARQUIVOS
// ========================================

async function loadNavigationStructure() {
    try {
        // Buscar todos os arquivos HTML na pasta pages
        const response = await fetch('pages/');
        const text = await response.text();
        
        // Parser básico para pegar os arquivos (em produção, use uma API)
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = doc.querySelectorAll('a');
        
        const files = [];
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.endsWith('.html')) {
                files.push(href);
            }
        });
        
        // Se não conseguir listar, usar lista estática
        if (files.length === 0) {
            files.push('Sobre_a_Ward_Academy.html');
        }
        
        allPages = files;
        navigationTree = buildNavigationTree(files);
        renderNavigation();
        buildSearchIndex();
        
    } catch (error) {
        console.error('Erro ao carregar estrutura:', error);
        // Usar estrutura de fallback
        allPages = ['Sobre_a_Ward_Academy.html'];
        navigationTree = buildNavigationTree(allPages);
        renderNavigation();
    }
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
            text.textContent = item.name;
            
            link.appendChild(icon);
            link.appendChild(text);
            
            // Se tem filhos, adicionar toggle
            if (Object.keys(item.children).length > 0) {
                const toggle = document.createElement('span');
                toggle.className = 'nav-toggle';
                toggle.textContent = '▶';
                link.appendChild(toggle);
                
                link.addEventListener('click', () => {
                    const children = navItem.querySelector('.nav-children');
                    if (children) {
                        children.classList.toggle('show');
                        toggle.classList.toggle('expanded');
                    }
                });
            } else if (item.file) {
                // É uma folha, carregar conteúdo
                link.addEventListener('click', () => {
                    loadPage(item.file);
                    
                    // Atualizar active
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Fechar sidebar em mobile
                    if (window.innerWidth <= 768) {
                        document.getElementById('sidebar').classList.remove('open');
                    }
                });
            }
            
            navItem.appendChild(link);
            
            // Renderizar filhos
            if (Object.keys(item.children).length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'nav-children';
                renderLevel(item.children, childrenContainer, level + 1);
                navItem.appendChild(childrenContainer);
            }
            
            parent.appendChild(navItem);
        });
    }
    
    renderLevel(navigationTree, nav);
}

// ========================================
// CARREGAMENTO DE PÁGINAS
// ========================================

async function loadPage(filename) {
    try {
        const response = await fetch(`pages/${filename}`);
        if (!response.ok) throw new Error('Página não encontrada');
        
        const html = await response.text();
        const contentArea = document.getElementById('content-area');
        
        // Criar container para o conteúdo
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        pageContent.innerHTML = html;
        
        // Limpar e adicionar novo conteúdo
        contentArea.innerHTML = '';
        contentArea.appendChild(pageContent);
        
        currentPage = filename;
        
        // Scroll para o topo
        contentArea.scrollTop = 0;
        
    } catch (error) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="page-content">
                <h1>⚠️ Erro ao carregar conteúdo</h1>
                <p>Não foi possível carregar esta página. Por favor, tente novamente ou entre em contato com o suporte.</p>
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
// INICIALIZAÇÃO
// ========================================

function initializePlatform() {
    loadNavigationStructure();
    
    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Toggle sidebar em mobile
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    
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
    
    // Fechar sidebar ao clicar fora (mobile)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

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
