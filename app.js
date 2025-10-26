/* ========================================
   VARIÁVEIS E PALETA DE CORES CLAUDE
   ======================================== */
:root {
    /* Paleta Claude */
    --primary-color: #c15f3c;
    --primary-hover: #a84e2d;
    --secondary-gray: #b1ada1;
    --off-white: #f4f3ee;
    --pure-white: #ffffff;
    
    /* Backgrounds */
    --dark-bg: #1a1a1a;
    --darker-bg: #0d0d0d;
    --card-bg: #252525;
    --hover-bg: #2d2d2d;
    
    /* Textos */
    --text-primary: #f4f3ee;
    --text-secondary: #b1ada1;
    --text-muted: #898989;
    
    /* Borders */
    --border-color: #3a3a3a;
    --border-light: #4a4a4a;
    
    /* Links */
    --link-color: #c15f3c;
    --link-hover: #d97a5a;
    --link-visited: #a84e2d;
    
    /* Raios e sombras */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
    
    /* Transições */
    --transition-fast: 150ms ease;
    --transition-normal: 250ms ease;
    
    /* Header height */
    --header-height: 60px;
}

/* ========================================
   RESET E BASE
   ======================================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: var(--darker-bg);
    color: var(--text-primary);
    line-height: 1.6;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Emojis - Fix para renderização */
.nav-icon, .feature-icon, .tip-icon, .home-icon, h1, h2, h3 {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
}

/* Proteção contra cópia */
body {
    -webkit-touch-callout: none;
}

::selection {
    background: var(--primary-color);
    color: var(--pure-white);
}

/* ========================================
   LINKS E HYPERLINKS
   ======================================== */
a {
    color: var(--link-color);
    text-decoration: none;
    transition: var(--transition-fast);
}

a:hover {
    color: var(--link-hover);
    text-decoration: underline;
}

a:visited {
    color: var(--link-visited);
}

a:active {
    color: var(--primary-hover);
}

/* ========================================
   TELA DE LOGIN
   ======================================== */
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--darker-bg) 0%, var(--dark-bg) 100%);
    padding: 20px;
}

.login-box {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 48px;
    max-width: 440px;
    width: 100%;
    box-shadow: var(--shadow-lg);
    animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.logo-container {
    text-align: center;
    margin-bottom: 32px;
}

.logo {
    font-size: 32px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.tagline {
    color: var(--text-secondary);
    font-size: 15px;
}

.input-group {
    margin-bottom: 24px;
}

.input-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
}

.input-group input {
    width: 100%;
    padding: 12px 16px;
    background: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 15px;
    transition: var(--transition-normal);
}

.input-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: var(--darker-bg);
}

.btn-primary {
    width: 100%;
    padding: 12px;
    background: var(--primary-color);
    color: var(--pure-white);
    border: none;
    border-radius: var(--radius-sm);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-normal);
}

.btn-primary:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.btn-primary:active {
    transform: translateY(0);
}

.error-message {
    color: #ef4444;
    font-size: 13px;
    margin-top: 12px;
    text-align: center;
    min-height: 20px;
}

.login-footer {
    margin-top: 24px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
}

/* ========================================
   HEADER
   ======================================== */
.platform-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.platform-header {
    background: var(--card-bg);
    border-bottom: 1px solid var(--border-color);
    padding: 12px 20px;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(10px);
    height: var(--header-height);
    display: flex;
    align-items: center;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1800px;
    margin: 0 auto;
    height: 100%;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}

.platform-logo {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary-color);
    transition: var(--transition-fast);
    cursor: pointer;
    letter-spacing: -0.5px;
    white-space: nowrap;
    line-height: 1;
}

.platform-logo:hover {
    color: var(--link-hover);
}

/* ========================================
   MENU HAMBÚRGUER MODERNO
   ======================================== */
.menu-hamburger {
    display: none; /* Oculto por padrão no desktop */
    flex-direction: column;
    justify-content: space-between;
    width: 30px;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    position: relative;
    z-index: 1100;
    transition: var(--transition-normal);
    flex-shrink: 0;
}

.menu-hamburger span {
    display: block;
    width: 100%;
    height: 3px;
    background: var(--primary-color);
    border-radius: 3px;
    transition: all 0.3s ease;
    transform-origin: center;
}

.menu-hamburger:hover span {
    background: var(--link-hover);
}

/* Animação do hambúrguer para X quando aberto */
.menu-hamburger.active span:nth-child(1) {
    transform: translateY(10.5px) rotate(45deg);
    background: var(--primary-color);
}

.menu-hamburger.active span:nth-child(2) {
    opacity: 0;
}

.menu-hamburger.active span:nth-child(3) {
    transform: translateY(-10.5px) rotate(-45deg);
    background: var(--primary-color);
}

/* ========================================
   BOTÃO HOME
   ======================================== */
.btn-home {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-normal);
    white-space: nowrap;
}

.btn-home:hover {
    background: var(--hover-bg);
    border-color: var(--primary-color);
}

.home-icon {
    font-size: 16px;
}

.home-text {
    display: inline;
}

/* ========================================
   HEADER ACTIONS
   ======================================== */
.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.search-container {
    position: relative;
}

.search-container input {
    padding: 9px 36px 9px 14px;
    background: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 14px;
    width: 280px;
    transition: var(--transition-normal);
}

.search-container input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: var(--darker-bg);
    width: 320px;
}

.search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    pointer-events: none;
    color: var(--text-muted);
}

.btn-logout {
    padding: 9px 16px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-normal);
    white-space: nowrap;
}

.btn-logout:hover {
    background: var(--dark-bg);
    color: var(--text-primary);
    border-color: var(--primary-color);
}

/* ========================================
   CONTAINER PRINCIPAL
   ======================================== */
.main-container {
    display: flex;
    flex: 1;
    max-width: 1800px;
    margin: 0 auto;
    width: 100%;
}

/* ========================================
   SIDEBAR
   ======================================== */
.sidebar {
    width: 300px;
    background: var(--card-bg);
    border-right: 1px solid var(--border-color);
    overflow-y: auto;
    transition: transform 0.3s ease;
    position: relative;
    z-index: 900;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--card-bg);
    z-index: 10;
}

.sidebar-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.toggle-btn {
    display: none;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 24px;
    cursor: pointer;
    padding: 4px;
    transition: var(--transition-fast);
}

.toggle-btn:hover {
    color: var(--primary-color);
}

/* ========================================
   TUTORIAL TIP
   ======================================== */
.tutorial-tip {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
    padding: 16px;
    margin: 16px;
    border-radius: var(--radius-md);
    display: flex;
    gap: 12px;
    align-items: flex-start;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.9; }
}

.tip-icon {
    font-size: 24px;
    flex-shrink: 0;
}

.tutorial-tip p {
    color: var(--pure-white);
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
}

.close-tip {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: var(--pure-white);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: var(--transition-fast);
}

.close-tip:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* ========================================
   NAVEGAÇÃO
   ======================================== */
.sidebar-nav {
    padding: 12px;
}

.nav-item {
    margin-bottom: 4px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--transition-fast);
    font-size: 14px;
}

.nav-link:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
}

.nav-link.active {
    background: var(--primary-color);
    color: var(--pure-white);
    font-weight: 500;
}

.nav-icon {
    font-size: 16px;
    flex-shrink: 0;
}

.nav-text {
    flex: 1;
}

.nav-arrow {
    font-size: 12px;
    transition: transform 0.2s ease;
}

.nav-link.expanded .nav-arrow {
    transform: rotate(90deg);
}

.nav-children {
    margin-left: 20px;
    margin-top: 4px;
}

/* ========================================
   ÁREA DE CONTEÚDO
   ======================================== */
.content-area {
    flex: 1;
    overflow-y: auto;
    background: var(--dark-bg);
    padding: 32px;
}

/* ========================================
   WELCOME SCREEN
   ======================================== */
.welcome-screen {
    max-width: 900px;
    margin: 0 auto;
}

.welcome-screen h1 {
    font-size: 36px;
    margin-bottom: 12px;
    color: var(--text-primary);
    text-align: center;
}

.welcome-subtitle {
    text-align: center;
    color: var(--text-secondary);
    font-size: 17px;
    margin-bottom: 48px;
}

.quick-start, .platform-features, .support-section {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
}

.quick-start h2, .platform-features h2, .support-section h2 {
    font-size: 22px;
    margin-bottom: 20px;
    color: var(--text-primary);
}

.steps-list {
    list-style: none;
    counter-reset: step-counter;
}

.steps-list li {
    counter-increment: step-counter;
    padding: 14px 0 14px 40px;
    position: relative;
    color: var(--text-secondary);
    line-height: 1.7;
    border-bottom: 1px solid var(--border-color);
}

.steps-list li:last-child {
    border-bottom: none;
}

.steps-list li::before {
    content: counter(step-counter);
    position: absolute;
    left: 0;
    top: 12px;
    background: var(--primary-color);
    color: var(--pure-white);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
}

.feature-card {
    background: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    transition: var(--transition-normal);
}

.feature-card:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.feature-icon {
    font-size: 32px;
    margin-bottom: 12px;
    display: block;
}

.feature-card h3 {
    font-size: 16px;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.suggestion-path {
    font-size: 12px;
    color: var(--primary-color);
    margin-top: 8px;
}

.support-section p {
    color: var(--text-secondary);
    line-height: 1.8;
}

/* ========================================
   CONTEÚDO DAS PÁGINAS
   ======================================== */
.page-content {
    max-width: 900px;
    margin: 0 auto;
}

.page-content h1 {
    font-size: 32px;
    margin-bottom: 24px;
    color: var(--text-primary);
    font-weight: 700;
}

.page-content h2 {
    font-size: 24px;
    margin-top: 32px;
    margin-bottom: 16px;
    color: var(--text-primary);
    font-weight: 600;
}

.page-content h3 {
    font-size: 19px;
    margin-top: 24px;
    margin-bottom: 12px;
    color: var(--text-primary);
    font-weight: 600;
}

.page-content p {
    color: var(--text-secondary);
    margin-bottom: 16px;
    line-height: 1.8;
    font-size: 15px;
}

.page-content strong {
    color: var(--text-primary);
    font-weight: 600;
}

.page-content em {
    color: var(--text-secondary);
    font-style: italic;
}

.page-content ul, .page-content ol {
    margin-left: 24px;
    margin-bottom: 16px;
    color: var(--text-secondary);
}

.page-content li {
    margin-bottom: 8px;
    line-height: 1.7;
}

.page-content code {
    background: var(--darker-bg);
    color: var(--primary-color);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 13px;
}

.page-content pre {
    background: var(--darker-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 16px;
    overflow-x: auto;
    margin-bottom: 16px;
}

.page-content pre code {
    background: none;
    padding: 0;
}

.page-content blockquote {
    border-left: 4px solid var(--primary-color);
    padding-left: 20px;
    margin: 20px 0;
    color: var(--text-secondary);
    font-style: italic;
}

/* ========================================
   TABELAS - MELHORADAS
   ======================================== */
.page-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    background: var(--card-bg);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
}

.page-content thead {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
}

.page-content thead th {
    color: var(--pure-white);
    font-weight: 600;
    text-align: left;
    padding: 14px 16px;
    font-size: 14px;
    letter-spacing: 0.3px;
}

.page-content tbody tr {
    border-bottom: 1px solid var(--border-color);
    transition: var(--transition-fast);
}

.page-content tbody tr:nth-child(odd) {
    background: var(--dark-bg);
}

.page-content tbody tr:nth-child(even) {
    background: var(--card-bg);
}

.page-content tbody tr:hover {
    background: var(--hover-bg);
}

.page-content tbody tr:last-child {
    border-bottom: none;
}

.page-content td {
    padding: 12px 16px;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
}

.page-content td strong {
    color: var(--text-primary);
}

/* ========================================
   RESULTADOS DE BUSCA
   ======================================== */
.search-results {
    position: fixed;
    top: var(--header-height);
    right: 0;
    width: 420px;
    height: calc(100vh - var(--header-height));
    background: var(--card-bg);
    border-left: 1px solid var(--border-color);
    box-shadow: var(--shadow-lg);
    z-index: 950;
    animation: slideInRight 0.3s ease;
    overflow-y: auto;
}

@keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

.search-results-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--card-bg);
    backdrop-filter: blur(10px);
    z-index: 10;
}

.search-results-header h2 {
    font-size: 18px;
    font-weight: 600;
}

.close-btn {
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 28px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: var(--transition-fast);
}

.close-btn:hover {
    background: var(--dark-bg);
}

#search-results-content {
    padding: 14px;
}

.search-result-item {
    padding: 14px;
    background: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    margin-bottom: 10px;
    cursor: pointer;
    transition: var(--transition-normal);
}

.search-result-item:hover {
    border-color: var(--primary-color);
    background: var(--hover-bg);
}

.search-result-title {
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 6px;
    font-size: 14px;
}

.search-result-path {
    color: var(--primary-color);
    font-size: 12px;
    margin-bottom: 8px;
}

.search-result-preview {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
}

.search-highlight {
    background: var(--primary-color);
    color: var(--pure-white);
    padding: 1px 3px;
    border-radius: 3px;
}

.no-results {
    text-align: center;
    padding: 48px 20px;
    color: var(--text-muted);
}

/* ========================================
   SIDEBAR OVERLAY (MOBILE)
   ======================================== */
.sidebar-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    z-index: 850;
    backdrop-filter: blur(2px);
}

.sidebar-overlay.active {
    display: block;
}

/* ========================================
   RESPONSIVIDADE
   ======================================== */
@media (max-width: 1024px) {
    .sidebar {
        width: 260px;
    }
    
    .search-container input {
        width: 200px;
    }
    
    .search-container input:focus {
        width: 240px;
    }
}

@media (max-width: 768px) {
    /* Mostrar menu hambúrguer */
    .menu-hamburger {
        display: flex !important;
    }
    
    /* Sidebar em mobile */
    .sidebar {
        position: fixed;
        left: -100%;
        top: var(--header-height);
        height: calc(100vh - var(--header-height));
        z-index: 900;
        box-shadow: var(--shadow-lg);
        width: 280px;
        transition: left 0.3s ease;
    }
    
    .sidebar.open {
        left: 0;
    }
    
    .toggle-btn {
        display: none;
    }
    
    .content-area {
        padding: 20px;
    }
    
    /* Header organizado em UMA linha */
    .header-content {
        gap: 8px;
        flex-wrap: nowrap;
    }
    
    .header-left {
        gap: 10px;
        flex: 0 1 auto;
        min-width: 0;
    }
    
    .platform-logo {
        font-size: 18px;
        white-space: nowrap;
    }
    
    .header-actions {
        gap: 6px;
        flex: 1 1 auto;
        justify-content: flex-end;
    }
    
    .home-text {
        display: none;
    }
    
    .btn-home {
        padding: 8px;
        min-width: 36px;
    }
    
    .home-icon {
        font-size: 18px;
    }
    
    .search-container {
        flex: 1 1 auto;
        max-width: 180px;
    }
    
    .search-container input {
        width: 100%;
        font-size: 13px;
        padding: 8px 32px 8px 10px;
    }
    
    .search-container input:focus {
        width: 100%;
    }
    
    .btn-logout {
        padding: 8px 10px;
        font-size: 12px;
        white-space: nowrap;
    }
    
    .welcome-screen h1 {
        font-size: 28px;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
    }
    
    /* Resultados de busca - ABAIXO DO HEADER */
    .search-results {
        width: 100%;
        top: var(--header-height);
        height: calc(100vh - var(--header-height));
    }
    
    .login-box {
        padding: 32px 24px;
    }
    
    .page-content {
        padding: 0 4px;
    }
    
    .page-content table {
        font-size: 13px;
    }
    
    .page-content thead th,
    .page-content td {
        padding: 10px 12px;
    }
}

@media (max-width: 480px) {
    :root {
        --header-height: 56px;
    }
    
    .platform-header {
        padding: 10px 12px;
    }
    
    .header-content {
        gap: 6px;
    }
    
    .header-left {
        gap: 8px;
    }
    
    .platform-logo {
        font-size: 16px;
    }
    
    .menu-hamburger {
        width: 26px;
        height: 22px;
    }
    
    .btn-home {
        padding: 6px;
        min-width: 32px;
    }
    
    .home-icon {
        font-size: 16px;
    }
    
    .search-container {
        max-width: 120px;
    }
    
    .search-container input {
        font-size: 12px;
        padding: 7px 28px 7px 8px;
    }
    
    .search-icon {
        font-size: 14px;
        right: 8px;
    }
    
    .btn-logout {
        padding: 7px 8px;
        font-size: 11px;
    }
    
    .sidebar {
        top: var(--header-height);
        height: calc(100vh - var(--header-height));
        width: 260px;
    }
    
    .search-results {
        top: var(--header-height);
        height: calc(100vh - var(--header-height));
    }
    
    .welcome-screen h1 {
        font-size: 24px;
    }
    
    .quick-start, .support-section {
        padding: 20px;
    }
    
    .page-content h1 {
        font-size: 26px;
    }
    
    .page-content h2 {
        font-size: 20px;
    }
    
    .page-content h3 {
        font-size: 17px;
    }
}

/* ========================================
   SCROLLBAR CUSTOMIZADA
   ======================================== */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--darker-bg);
}

::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
    transition: var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
    background: var(--primary-color);
}

/* Firefox */
* {
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) var(--darker-bg);
}
