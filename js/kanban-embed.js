/**
 * Kanban dentro dos dashboards (iframe de /kanban).
 *
 * Antes o iframe tinha 900px fixos: em tela menor ele tomava a tela toda e a
 * rolagem ficava presa dentro dele, sem a pessoa conseguir voltar para o topo
 * da página. Agora:
 *  - a altura é a da tela, menos o cabeçalho fixo: descendo a página, o kanban
 *    encaixa e preenche a tela;
 *  - enquanto ele não está encaixado, rolar em cima dele move a página (para
 *    cima ou para baixo); encaixado, rola o conteúdo dele;
 *  - quando o conteúdo do kanban chega ao topo ou ao fim, a rolagem volta para
 *    a página (roda do mouse, touchpad e dedo);
 *  - com uma janela do kanban aberta, ele encaixa e a página não anda.
 *
 * Basta incluir o script: ele acha o iframe[src="/kanban"] sozinho.
 */
(function () {
    'use strict';

    var FOLGA = 8;      // px entre o cabeçalho e o kanban encaixado
    var TOLERANCIA = 2; // px de diferença que ainda contam como encaixado

    function alturaDoCabecalho() {
        var h = document.querySelector('.header');
        if (!h) return 0;
        var pos = getComputedStyle(h).position;
        return (pos === 'sticky' || pos === 'fixed') ? h.getBoundingClientRect().height : 0;
    }

    function paginaPode(dy) {
        var se = document.scrollingElement || document.documentElement;
        return dy < 0 ? se.scrollTop > 0 : se.scrollTop + window.innerHeight < se.scrollHeight - 1;
    }

    // O site tem rolagem suave: cada passo novo cortaria a animação do
    // anterior e a distância se perderia. Os passos do dedo/roda são imediatos.
    function rolarPagina(dy) {
        try { window.scrollBy({ top: dy, left: 0, behavior: 'instant' }); }
        catch (e) { window.scrollBy(0, dy); }
    }

    function preparar(iframe) {
        var topo = 0;
        function medir() {
            topo = alturaDoCabecalho() + FOLGA;
            iframe.style.setProperty('--kanban-topo', topo + 'px');
        }
        medir();
        window.addEventListener('resize', medir);
        iframe.classList.add('kanban-embed');

        // Quanto a página ainda precisa andar para o kanban encaixar:
        // > 0 ele está abaixo do ponto, < 0 já passou dele.
        function falta() { return iframe.getBoundingClientRect().top - topo; }

        function encaixar() {
            var f = falta();
            if (Math.abs(f) > TOLERANCIA) window.scrollBy({ top: f, behavior: 'smooth' });
        }

        function ligar() {
            var w, doc;
            try { w = iframe.contentWindow; doc = iframe.contentDocument; } catch (e) { return; }
            if (!w || !doc || !doc.body || doc.URL === 'about:blank' || doc.__kanbanEmbed) return;
            doc.__kanbanEmbed = true;

            function janelaAberta() { return !!doc.querySelector('.modal-overlay.active'); }

            // Algo com rolagem própria sob o cursor (ou o próprio kanban) ainda anda nessa direção?
            function kanbanPode(alvo, dy) {
                for (var el = alvo; el && el !== doc.body && el !== doc.documentElement; el = el.parentElement) {
                    if (el.nodeType !== 1) continue;
                    var oy = w.getComputedStyle(el).overflowY;
                    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
                        if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
                    }
                }
                var se = doc.scrollingElement || doc.documentElement;
                return dy < 0 ? se.scrollTop > 0 : se.scrollTop + w.innerHeight < se.scrollHeight - 1;
            }

            // Para um passo de rolagem dy feito sobre o kanban, devolve quanto a
            // página anda; 0 segura tudo; null deixa o kanban rolar sozinho.
            function decidir(alvo, dy) {
                if (janelaAberta()) return kanbanPode(alvo, dy) ? null : 0;
                var f = falta();
                // Encaixado = no ponto, ou o mais perto dele que a página deixa
                // (página curta acaba antes de o kanban chegar ao cabeçalho).
                var encaixado = Math.abs(f) <= TOLERANCIA ||
                    (f > 0 && !paginaPode(1)) || (f < 0 && !paginaPode(-1));
                if (!encaixado && paginaPode(dy)) {
                    if (dy > 0 && f > 0) return Math.min(dy, f);
                    if (dy < 0 && f < 0) return Math.max(dy, f);
                    return dy;
                }
                if (kanbanPode(alvo, dy)) return null;
                return paginaPode(dy) ? dy : null;
            }

            w.addEventListener('wheel', function (e) {
                if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
                var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
                var passo = decidir(e.target, dy);
                if (passo === null) return;
                e.preventDefault();
                if (passo) rolarPagina(passo);
            }, { passive: false });

            // Dedo: a posição é medida na página (e não no iframe, que anda junto).
            var ultimoY = null, alvoToque = null;
            function yNaPagina(t) { return t.clientY + iframe.getBoundingClientRect().top; }
            w.addEventListener('touchstart', function (e) {
                if (e.touches.length !== 1) { ultimoY = null; return; }
                ultimoY = yNaPagina(e.touches[0]);
                alvoToque = e.target;
            }, { passive: true });
            w.addEventListener('touchmove', function (e) {
                if (ultimoY === null || e.touches.length !== 1) return;
                var y = yNaPagina(e.touches[0]);
                var dy = ultimoY - y;
                ultimoY = y;
                if (!dy) return;
                var passo = decidir(alvoToque, dy);
                if (passo === null || !e.cancelable) return;
                e.preventDefault();
                if (passo) rolarPagina(passo);
            }, { passive: false });
            w.addEventListener('touchend', function () { ultimoY = null; }, { passive: true });

            // Abriu uma janela do kanban: encaixa para ela aparecer inteira.
            var aberta = false;
            new w.MutationObserver(function () {
                var agora = janelaAberta();
                if (agora && !aberta) encaixar();
                aberta = agora;
            }).observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
        }

        iframe.addEventListener('load', ligar);
        ligar();
    }

    function iniciar() {
        var iframes = document.querySelectorAll('iframe[src="/kanban"]');
        for (var i = 0; i < iframes.length; i++) preparar(iframes[i]);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
