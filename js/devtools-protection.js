/**
 * DevTools Protection Script - Ward Academy
 * Bloqueia acesso às ferramentas de desenvolvedor do navegador.
 *
 * Técnicas utilizadas:
 * 1. Bloqueio de atalhos de teclado (F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U)
 * 2. Bloqueio do menu de contexto (clique direito)
 * 3. Detecção de DevTools aberto via diferença de dimensões da janela
 * 4. Detecção via console (getter trick)
 * 5. Anti-debug com debugger statements
 */
(function() {
    'use strict';

    // ========== 1. Bloqueio de atalhos de teclado ==========
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I (Inspecionar)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C (Selecionar elemento)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (Ver código fonte)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    }, true);

    // ========== 2. Bloqueio do clique direito ==========
    document.addEventListener('contextmenu', function(e) {
        // Permite clique direito em links para "abrir em nova aba"
        if (e.target && e.target.closest('a')) {
            return true;
        }
        e.preventDefault();
        return false;
    }, true);

    // ========== 3. Detecção via dimensões da janela ==========
    var devtoolsOpen = false;

    function checkWindowSize() {
        var widthThreshold = window.outerWidth - window.innerWidth > 160;
        var heightThreshold = window.outerHeight - window.innerHeight > 160;
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                onDevToolsDetected();
            }
        } else {
            devtoolsOpen = false;
        }
    }

    // ========== 4. Detecção via console (getter trick) ==========
    function checkConsole() {
        var element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtoolsOpen = true;
                onDevToolsDetected();
            }
        });
        console.log('%c', element);
    }

    // ========== 5. Anti-debug com debugger statements ==========
    function antiDebug() {
        (function() {
            try {
                (function check(a) {
                    if (('' + a / a).length !== 1 || a % 20 === 0) {
                        (function() {}).constructor('debugger')();
                    }
                    check(++a);
                })(0);
            } catch(e) {}
        })();
    }

    // ========== Ação ao detectar DevTools ==========
    function onDevToolsDetected() {
        // Limpa o conteúdo da página
        document.documentElement.innerHTML = '';
        document.title = '';
        // Redireciona para página em branco
        try {
            window.location.replace('about:blank');
        } catch(e) {
            document.write('');
            document.close();
        }
    }

    // ========== Iniciar verificações periódicas ==========
    setInterval(checkWindowSize, 500);
    setInterval(checkConsole, 1000);

    // Anti-debug: roda periodicamente
    setInterval(antiDebug, 3000);

    // Bloquear arrastar elementos (previne drag de imagens etc.)
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    }, true);

    // Bloquear seleção de texto (opcional - descomente se quiser)
    // document.addEventListener('selectstart', function(e) {
    //     if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return true;
    //     e.preventDefault();
    //     return false;
    // }, true);

})();
