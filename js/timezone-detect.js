/*
 * WardTZ — deteccao automatica de fuso horario (com fallback por offset).
 *
 * Objetivo: em qualquer seletor de fuso do app, pre-selecionar automaticamente
 * o fuso do proprio usuario (detectado pelo navegador), mas sempre permitindo
 * que ele troque manualmente. Dependency-free: basta incluir este arquivo antes
 * do script da pagina e usar window.WardTZ.
 */
(function () {
    'use strict';

    // Fuso IANA do navegador (ex.: "America/Sao_Paulo"); null se indisponivel.
    function detect() {
        try {
            var z = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (z && z.indexOf('/') > 0) return z;
        } catch (e) { /* navegador sem suporte */ }
        return null;
    }

    // Offset atual (em minutos; positivo = a leste de UTC) de um fuso IANA.
    // Usa o mesmo truque de toLocaleString ja empregado no resto do app.
    function offsetMinutes(zone) {
        try {
            var now = new Date();
            var local = new Date(now.toLocaleString('en-US', { timeZone: zone }));
            var utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
            return Math.round((local - utc) / 60000);
        } catch (e) { return null; }
    }

    // Escolhe o melhor valor dentro de uma lista de fusos conhecidos:
    //  1) match exato do fuso detectado;
    //  2) mesmo offset atual (prefere zona "real" nomeada a um bucket Etc/GMT);
    //  3) fallback informado.
    function resolve(knownValues, fallback) {
        fallback = fallback || 'America/Sao_Paulo';
        var detected = detect();
        if (!detected) return fallback;
        if (!knownValues || !knownValues.length) return detected;
        if (knownValues.indexOf(detected) !== -1) return detected;

        var off = offsetMinutes(detected);
        if (off === null) return knownValues.indexOf(fallback) !== -1 ? fallback : detected;

        var named = null, any = null;
        for (var i = 0; i < knownValues.length; i++) {
            var v = knownValues[i];
            if (offsetMinutes(v) === off) {
                if (any === null) any = v;
                if (named === null && v.indexOf('/') > 0 && v.indexOf('Etc/') !== 0) named = v;
            }
        }
        return named || any || (knownValues.indexOf(fallback) !== -1 ? fallback : detected);
    }

    // Aplica o fuso detectado a um <select>, respeitando um valor ja escolhido.
    //   opts.current  : fuso ja salvo pelo usuario (vence a deteccao se existir na lista)
    //   opts.fallback : usado quando nada casa (default America/Sao_Paulo)
    // Retorna o valor efetivamente aplicado (ou null se o select nao existe).
    function applyToSelect(selectEl, opts) {
        opts = opts || {};
        if (!selectEl) return null;
        var known = [];
        for (var i = 0; i < selectEl.options.length; i++) {
            var val = selectEl.options[i].value;
            if (val) known.push(val);
        }
        var chosen = opts.current || null;
        var value;
        if (chosen && known.indexOf(chosen) !== -1) {
            value = chosen;
        } else {
            value = resolve(known, opts.fallback || 'America/Sao_Paulo');
        }
        if (value && known.indexOf(value) !== -1) selectEl.value = value;
        return selectEl.value;
    }

    window.WardTZ = {
        detect: detect,
        offsetMinutes: offsetMinutes,
        resolve: resolve,
        applyToSelect: applyToSelect
    };
})();
