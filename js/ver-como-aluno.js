/*
 * Ward Academy — "Ver como aluno" (fonte unica, carregado logo depois de js/app.js)
 *
 * O mentor abre /dashboard?view_as=<id do aluno> (botao nos dashboards dos
 * mentores) e, naquela aba, o site inteiro passa a se comportar como a conta
 * do aluno: toda pagina que pergunta "quem esta logado" (WardApp.checkAuth ou
 * localStorage 'ward_user') recebe o aluno. Por isso funciona em qualquer
 * pagina, inclusive nas que nunca tiveram suporte a view_as.
 *
 * - O estado fica em sessionStorage: vale so para esta aba. As outras abas do
 *   mentor continuam sendo dele, e nada fica "preso" depois de sair.
 * - O servidor continua vendo o mentor (o token e o dele): as permissoes nao
 *   mudam, so a tela.
 * - Uma faixa no topo mostra de quem e a conta, com o botao de sair.
 * - O codigo antigo de cada pagina (view_as na URL / 'view_as_student' no
 *   localStorage) fica parado: a pagina ja enxerga o aluno como usuario.
 */
(function () {
    var CHAVE = 'ward_ver_como';
    var LEGADO = 'view_as_student';
    var proto = Storage.prototype;
    var realGet = proto.getItem, realSet = proto.setItem, realRemove = proto.removeItem;

    function ler(store, k) {
        try { return JSON.parse(realGet.call(store, k) || 'null'); } catch (e) { return null; }
    }

    var usuarioReal = ler(localStorage, 'ward_user');
    var ehMentor = !!(usuarioReal && usuarioReal.role && usuarioReal.role.indexOf('mentor_') === 0);
    var caminho = location.pathname.replace(/\.html$/, '');
    var paginaDeMentor = /^\/(mentor-|admin-|relatorios|wasa-schedule-admin)/.test(caminho);
    var emIframe = window.top !== window;
    var url = new URL(location.href);
    var pedido = url.searchParams.get('view_as') || url.searchParams.get('ver_como');
    var estado = ler(sessionStorage, CHAVE);

    function painelDoMentor(role) {
        return role ? '/mentor-dashboard-' + role.replace('mentor_', '') : '/';
    }

    function sair() {
        var role = (estado && estado.mentorRole) || (usuarioReal && usuarioReal.role);
        realRemove.call(sessionStorage, CHAVE);
        realRemove.call(localStorage, LEGADO);
        location.href = painelDoMentor(role);
    }

    // Para os dashboards dos mentores: abre a conta do aluno numa aba nova.
    function abrir(alunoId) {
        window.open('/dashboard?view_as=' + encodeURIComponent(alunoId), '_blank');
    }

    window.WardVerComo = { ativo: false, abrir: abrir, sair: sair };

    // ---------- quem nao e mentor, ou pagina de mentor: nada de visualizar como
    if (!ehMentor || paginaDeMentor) {
        if (!emIframe && estado) realRemove.call(sessionStorage, CHAVE);
        // 'view_as_student' esquecido no localStorage fazia o mentor cair na
        // conta de um aluno ao abrir o blog, a wardpedia etc. como ele mesmo
        if (!emIframe) realRemove.call(localStorage, LEGADO);
        return;
    }

    function semParametro() {
        var u = new URL(location.href);
        u.searchParams.delete('view_as');
        u.searchParams.delete('ver_como');
        return u.pathname + (u.search || '') + u.hash;
    }

    // ---------- primeira pagina: busca o aluno e recarrega ja na conta dele
    if (pedido && !emIframe && (!estado || String(estado.id) !== String(pedido))) {
        WardApp.checkAuth = function () { return new Promise(function () {}); };
        var aviso = function () {
            var d = document.createElement('div');
            d.id = 'ver-como-carregando';
            d.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;font:600 1.05rem system-ui,sans-serif;color:#9A3412;';
            d.textContent = '👁️ Abrindo a conta do aluno...';
            document.body.appendChild(d);
        };
        if (document.body) aviso(); else document.addEventListener('DOMContentLoaded', aviso);

        WardApp.db.from('users').select('*').eq('id', pedido).maybeSingle().then(function (r) {
            var aluno = r && r.data;
            if (!aluno) {
                alert('Não foi possível abrir a conta deste aluno.');
                location.href = painelDoMentor(usuarioReal.role);
                return;
            }
            var limpo = WardApp._prsU ? WardApp._prsU(aluno) : aluno;
            ['password_hash', 'password', 'cpf'].forEach(function (k) { delete limpo[k]; });
            limpo.name = limpo.name || limpo.full_name || limpo.email;
            realSet.call(sessionStorage, CHAVE, JSON.stringify({
                id: aluno.id, aluno: limpo, mentorRole: usuarioReal.role, mentorId: usuarioReal.id
            }));
            realRemove.call(localStorage, LEGADO);
            location.replace(semParametro());
        });
        return;
    }

    if (!estado) {
        if (!emIframe) realRemove.call(localStorage, LEGADO);
        return;
    }

    // ---------- modo ativo: esta aba e a conta do aluno
    var aluno = estado.aluno;
    window.WardVerComo = { ativo: true, aluno: aluno, mentorRole: estado.mentorRole, abrir: abrir, sair: sair };

    // A URL fica limpa: o codigo antigo das paginas nao entra no seu proprio view_as
    if (pedido && !emIframe) history.replaceState(history.state, '', semParametro());

    // A data de nascimento e pedida ao proprio aluno, nunca na visita do mentor
    try { realSet.call(sessionStorage, 'ward_nasc_ok', '1'); } catch (e) {}

    proto.getItem = function (k) {
        if (this === window.localStorage) {
            if (k === 'ward_user') return JSON.stringify(aluno);
            if (k === LEGADO) return null;
        }
        return realGet.apply(this, arguments);
    };
    proto.setItem = function (k, v) {
        if (this === window.localStorage) {
            // a pagina atualizou o "usuario logado": vale para o aluno desta aba,
            // sem tocar na conta do mentor guardada no navegador
            if (k === 'ward_user') {
                try { aluno = JSON.parse(v) || aluno; estado.aluno = aluno; window.WardVerComo.aluno = aluno; realSet.call(sessionStorage, CHAVE, JSON.stringify(estado)); } catch (e) {}
                return;
            }
            if (k === LEGADO) return;
        }
        return realSet.apply(this, arguments);
    };
    proto.removeItem = function (k) {
        if (this === window.localStorage && k === LEGADO) return;
        return realRemove.apply(this, arguments);
    };

    // "Sair" do menu: sai da visualizacao, nao desloga o mentor
    WardApp.logout = function () { sair(); };

    if (emIframe) return; // o kanban do dashboard etc.: sem faixa propria

    // Abas novas (link com target=_blank, ctrl+clique, window.open) nao herdam o
    // sessionStorage: levam o aluno no endereco
    function comAluno(href) {
        try {
            var u = new URL(href, location.href);
            if (u.origin !== location.origin) return href;
            if (/^\/(mentor-|admin-)/.test(u.pathname)) return href;
            u.searchParams.set('ver_como', estado.id);
            return u.href;
        } catch (e) { return href; }
    }
    function aoClicar(ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
        if (!a) return;
        var novaAba = a.target === '_blank' || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button === 1;
        if (!novaAba) return;
        var h = a.getAttribute('href');
        if (!h || h.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(h)) return;
        a.setAttribute('href', comAluno(h));
    }
    document.addEventListener('click', aoClicar, true);
    document.addEventListener('auxclick', aoClicar, true);
    var abrirOriginal = window.open;
    window.open = function (u) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof u === 'string' && u) args[0] = comAluno(u);
        return abrirOriginal.apply(window, args);
    };

    // Faixa no topo
    function nomeDoAluno() {
        var n = aluno.full_name || aluno.name || aluno.email || 'Aluno';
        try { if (WardApp._prs) n = WardApp._prs(n) || n; } catch (e) {}
        return n;
    }
    function faixa() {
        if (document.getElementById('ver-como-faixa')) return;
        var f = document.createElement('div');
        f.id = 'ver-como-faixa';
        f.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;align-items:center;justify-content:center;gap:.75rem;flex-wrap:wrap;padding:.45rem 1rem;background:#BF4E28;color:#fff;font:500 .9rem system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.15);';
        var t = document.createElement('span');
        t.textContent = '👁️ Visualizando como: ';
        var b = document.createElement('strong');
        b.textContent = nomeDoAluno();
        t.appendChild(b);
        var s = document.createElement('button');
        s.type = 'button';
        s.textContent = '✕ Sair desta visualização';
        s.style.cssText = 'background:#fff;color:#BF4E28;border:0;border-radius:6px;padding:.25rem .7rem;font:600 .82rem system-ui,sans-serif;cursor:pointer;';
        s.onclick = sair;
        f.appendChild(t);
        f.appendChild(s);
        document.body.insertBefore(f, document.body.firstChild);
        var alt = f.offsetHeight || 40;
        document.body.style.paddingTop = (parseFloat(getComputedStyle(document.body).paddingTop) || 0) + alt + 'px';
        // barra de navegacao fixa no topo desce junto
        document.querySelectorAll('.navbar, nav.navbar, header.navbar').forEach(function (n) {
            var p = getComputedStyle(n).position;
            if (p === 'fixed' || p === 'sticky') n.style.top = alt + 'px';
        });
    }
    if (document.body) faixa(); else document.addEventListener('DOMContentLoaded', faixa);
})();
