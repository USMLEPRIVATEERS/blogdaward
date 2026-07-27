/* =========================================================================
   Ward Academy — Diário UWorld
   Gráfico de volume e desempenho por dia, com faixas por bloco de estudo.

   Uso:
     WardUWorld.render(document.getElementById('grafico'), sessoes, opcoes);

   sessoes: array de objetos
     { date: '2026-07-25', system: 'Dermatology', correct: 14, total: 20 }
     - date   string ISO (YYYY-MM-DD) ou objeto Date
     - system nome do bloco/system do UWorld (opcional; sem ele as faixas
              de fundo não são desenhadas)
     - correct / total  inteiros da sessão

   opcoes (todas opcionais):
     { titulo: 'Diário UWorld',
       aluno: 'Pedro Borelli',
       meta: 60,          // linha de referência de % de acerto
       janela: 7,         // dias estudados na média móvel de volume
       span: 0.55,        // suavização da tendência (0.2 a 1)
       abrev: { 'Nervous System': 'Neuro' } }

   Sem dependências externas. Renderiza SVG e redesenha no resize.
   ========================================================================= */
(function (global) {
  'use strict';

  /* ---------- abreviações padrão dos systems do UWorld ---------- */
  var ABREV_PADRAO = {
    'Cardiovascular System': 'Cardio',
    'Cardiovascular': 'Cardio',
    'Renal, Urinary Systems & Electrolytes': 'Renal',
    'Renal & Electrolytes': 'Renal',
    'Renal': 'Renal',
    'Pulmonary & Critical Care': 'Pulmo',
    'Gastrointestinal & Nutrition': 'GI',
    'Gastrointestinal': 'GI',
    'Endocrine, Diabetes & Metabolism': 'Endócrino',
    'Endocrine': 'Endócrino',
    'Female Reproductive System & Breast': 'Repro',
    'Male Reproductive System': 'Repro',
    'Pregnancy, Childbirth & Puerperium': 'Repro',
    'Reproductive & Pregnancy': 'Repro',
    'Psychiatric/Behavioral & Substance Use Disorder': 'Psiq',
    'Psychiatric & Behavioral': 'Psiq',
    'Social Sciences (Ethics/Legal/Professional)': 'Ética',
    'Social Sciences (Ethics)': 'Ética',
    'Nervous System': 'Neuro',
    'Rheumatology/Orthopedics & Sports': 'Reumato',
    'Rheumatology/Orthopedics': 'Reumato',
    'Dermatology': 'Derm',
    'Hematology & Oncology': 'Hemato',
    'Allergy & Immunology': 'Imuno',
    'Infectious Diseases': 'Infecto',
    'Biostatistics & Epidemiology': 'Bioestat',
    'Poisoning & Environmental Exposure': 'Toxico'
  };

  var DIA_MS = 86400000;

  /* ---------- utilidades ---------- */
  function paraData(v) {
    if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    var p = String(v).slice(0, 10).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function chaveDia(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
           '-' + ('0' + d.getDate()).slice(-2);
  }
  function ddmm(d) {
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function num(n, casas) {
    return n.toFixed(casas == null ? 0 : casas).replace('.', ',');
  }

  /* ---------- agrega sessões em dias ---------- */
  function agregarPorDia(sessoes) {
    var mapa = {};
    sessoes.forEach(function (s) {
      var d = paraData(s.date), k = chaveDia(d);
      if (!mapa[k]) mapa[k] = { data: d, acertos: 0, total: 0, systems: {} };
      var c = +s.correct || 0, t = +s.total || 0;
      mapa[k].acertos += c;
      mapa[k].total += t;
      if (s.system) mapa[k].systems[s.system] = (mapa[k].systems[s.system] || 0) + t;
    });
    return Object.keys(mapa).sort().map(function (k) {
      var d = mapa[k], dom = null, max = -1;
      for (var s in d.systems) if (d.systems[s] > max) { max = d.systems[s]; dom = s; }
      d.system = dom;
      d.pct = d.total ? (100 * d.acertos / d.total) : 0;
      return d;
    }).filter(function (d) { return d.total > 0; });
  }

  /* ---------- blocos: dias consecutivos com o mesmo system ---------- */
  function derivarBlocos(dias) {
    var blocos = [], atual = null;
    dias.forEach(function (d) {
      if (!d.system) { atual = null; return; }
      if (atual && atual.system === d.system) {
        atual.fim = d.data;
        atual.total += d.total;
        atual.acertos += d.acertos;
      } else {
        atual = { system: d.system, ini: d.data, fim: d.data,
                  total: d.total, acertos: d.acertos };
        blocos.push(atual);
      }
    });
    // fronteiras no ponto médio entre blocos vizinhos
    for (var i = 0; i < blocos.length; i++) {
      blocos[i].x0 = i === 0
        ? blocos[i].ini.getTime() - DIA_MS
        : (blocos[i - 1].fim.getTime() + blocos[i].ini.getTime()) / 2;
      blocos[i].x1 = i === blocos.length - 1
        ? blocos[i].fim.getTime() + DIA_MS
        : (blocos[i].fim.getTime() + blocos[i + 1].ini.getTime()) / 2;
    }
    return blocos;
  }

  /* ---------- média móvel sobre dias estudados ---------- */
  function mediaMovel(vals, janela) {
    return vals.map(function (_, i) {
      var ini = Math.max(0, i - janela + 1), soma = 0;
      for (var j = ini; j <= i; j++) soma += vals[j];
      return soma / (i - ini + 1);
    });
  }

  /* ---------- LOESS local linear com pesos tricube ---------- */
  function loess(xs, ys, span) {
    var n = xs.length;
    var q = Math.max(2, Math.min(n, Math.floor(span * n)));
    return xs.map(function (x0) {
      var dists = xs.map(function (x) { return Math.abs(x - x0); });
      var ord = dists.slice().sort(function (a, b) { return a - b; });
      var h = ord[q - 1] || 1;
      var sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
      for (var i = 0; i < n; i++) {
        var u = dists[i] / h;
        if (u >= 1) continue;
        var w = Math.pow(1 - u * u * u, 3);
        sw += w; swx += w * xs[i]; swy += w * ys[i];
        swxx += w * xs[i] * xs[i]; swxy += w * xs[i] * ys[i];
      }
      var den = sw * swxx - swx * swx;
      if (!sw) return ys[0];
      if (Math.abs(den) < 1e-12) return swy / sw;
      var b = (sw * swxy - swx * swy) / den;
      var a = (swy - b * swx) / sw;
      return a + b * x0;
    });
  }

  /* ---------- render ---------- */
  function render(alvo, sessoes, opcoes) {
    if (!alvo) throw new Error('Container não encontrado');
    var o = opcoes || {};
    var meta = o.meta == null ? 60 : o.meta;
    var janela = o.janela || 7;
    var span = o.span || 0.55;
    var abrev = Object.assign({}, ABREV_PADRAO, o.abrev || {});

    var dias = agregarPorDia(sessoes || []);
    if (!dias.length) {
      alvo.innerHTML = '<div class="wu-vazio">Nenhuma sessão registrada ainda. ' +
        'Assim que a primeira for lançada no diário, o gráfico aparece aqui.</div>';
      garantirEstilo();
      return;
    }

    var blocos = derivarBlocos(dias);
    var volMM = mediaMovel(dias.map(function (d) { return d.total; }), janela);
    var xsNum = dias.map(function (d) { return d.data.getTime() / DIA_MS; });
    var pctSuave = loess(xsNum, dias.map(function (d) { return d.pct; }), span);

    var totQ = dias.reduce(function (a, d) { return a + d.total; }, 0);
    var totA = dias.reduce(function (a, d) { return a + d.acertos; }, 0);
    var pctGeral = 100 * totA / totQ;
    var t0 = dias[0].data.getTime(), t1 = dias[dias.length - 1].data.getTime();
    var corridos = Math.round((t1 - t0) / DIA_MS) + 1;

    garantirEstilo();

    alvo.classList.add('wu');
    alvo.innerHTML =
      '<header class="wu-cab">' +
        '<h2 class="wu-titulo">' + esc(o.titulo || 'Diário UWorld') +
          (o.aluno ? '<span class="wu-aluno">' + esc(o.aluno) + '</span>' : '') +
        '</h2>' +
        '<p class="wu-meta">' +
          '<strong>' + totA + '/' + totQ + '</strong> questões · ' +
          '<strong>' + num(pctGeral, 1) + '%</strong> de acerto · ' +
          '<strong>' + dias.length + '</strong> dias estudados em ' + corridos + ' dias · ' +
          ddmm(dias[0].data) + ' a ' + ddmm(dias[dias.length - 1].data) +
        '</p>' +
      '</header>' +
      '<div class="wu-tela"></div>' +
      '<div class="wu-dica" hidden></div>';

    var tela = alvo.querySelector('.wu-tela');
    var dica = alvo.querySelector('.wu-dica');

    function desenhar() {
      var L = 44, R = 14, larg = Math.max(320, tela.clientWidth || alvo.clientWidth || 900);
      var estreito = larg < 620;
      var hVol = estreito ? 150 : 200;
      var hPct = estreito ? 130 : 170;
      var topo = 36, gap = 30, eixoX = 26;
      var alt = topo + hVol + gap + hPct + eixoX;
      var iw = larg - L - R;

      var pad = DIA_MS * 2;
      var xmin = t0 - pad, xmax = t1 + pad;
      var X = function (t) { return L + (t - xmin) / (xmax - xmin) * iw; };

      var maxVol = Math.max.apply(null, dias.map(function (d) { return d.total; }));
      var topoVol = Math.ceil(maxVol / 10) * 10;
      var YV = function (v) { return topo + hVol - (v / topoVol) * hVol; };
      var yPct0 = topo + hVol + gap;
      var YP = function (v) { return yPct0 + hPct - (v / 100) * hPct; };

      var largBarra = Math.max(2, Math.min(7, iw / corridos * 0.75));
      var s = [];

      s.push('<svg class="wu-svg" width="100%" height="' + alt + '" viewBox="0 0 ' +
             larg + ' ' + alt + '" role="img" aria-label="Volume de questões e ' +
             'percentual de acerto por dia, com faixas por bloco de estudo">');

      /* faixas por bloco (fundo dos dois painéis) */
      blocos.forEach(function (b, i) {
        var x0 = X(b.x0), x1 = X(b.x1);
        s.push('<rect class="wu-faixa wu-faixa--' + (i % 2 ? 'b' : 'a') + '" x="' +
               x0.toFixed(1) + '" y="' + topo + '" width="' + Math.max(0, x1 - x0).toFixed(1) +
               '" height="' + (hVol + gap + hPct) + '"/>');
        var rot = abrev[b.system] || b.system;
        // rotulos alternam entre duas alturas: blocos estreitos cabem sem colidir
        if ((x1 - x0) > 15) {
          s.push('<text class="wu-bloco" x="' + ((x0 + x1) / 2).toFixed(1) +
                 '" y="' + (topo - (i % 2 ? 22 : 8)) + '">' + esc(rot) + '</text>');
          if (i % 2) {
            s.push('<line class="wu-bloco-guia" x1="' + ((x0 + x1) / 2).toFixed(1) +
                   '" x2="' + ((x0 + x1) / 2).toFixed(1) + '" y1="' + (topo - 18) +
                   '" y2="' + (topo - 3) + '"/>');
          }
        }
      });

      /* painel 1 — volume */
      [0, topoVol / 2, topoVol].forEach(function (v) {
        s.push('<line class="wu-grade" x1="' + L + '" y1="' + YV(v).toFixed(1) +
               '" x2="' + (larg - R) + '" y2="' + YV(v).toFixed(1) + '"/>');
        s.push('<text class="wu-eixo" x="' + (L - 8) + '" y="' + (YV(v) + 4).toFixed(1) +
               '" text-anchor="end">' + v + '</text>');
      });
      dias.forEach(function (d, i) {
        var x = X(d.data.getTime()) - largBarra / 2;
        var yT = YV(d.total), yA = YV(d.acertos);
        s.push('<rect class="wu-erro" x="' + x.toFixed(1) + '" y="' + yT.toFixed(1) +
               '" width="' + largBarra.toFixed(1) + '" height="' +
               Math.max(0, yA - yT).toFixed(1) + '"/>');
        s.push('<rect class="wu-acerto" x="' + x.toFixed(1) + '" y="' + yA.toFixed(1) +
               '" width="' + largBarra.toFixed(1) + '" height="' +
               Math.max(0, YV(0) - yA).toFixed(1) + '"/>');
      });
      s.push('<path class="wu-linha-vol" d="' + dias.map(function (d, i) {
        return (i ? 'L' : 'M') + X(d.data.getTime()).toFixed(1) + ' ' + YV(volMM[i]).toFixed(1);
      }).join(' ') + '"/>');
      // em tela estreita o texto longo era cortado pela borda do SVG
      s.push('<text class="wu-rotulo wu-rotulo--vol" x="' + (L + 4) + '" y="' +
             (topo + 14) + '">' + (estreito
               ? 'Questões/dia · cheia = acertos'
               : 'Questões por dia · barra cheia = acertos, clara = erros · linha = média de ' +
                 janela + ' dias') + '</text>');

      /* painel 2 — desempenho */
      [0, 50, 100].forEach(function (v) {
        s.push('<line class="wu-grade" x1="' + L + '" y1="' + YP(v).toFixed(1) +
               '" x2="' + (larg - R) + '" y2="' + YP(v).toFixed(1) + '"/>');
        s.push('<text class="wu-eixo" x="' + (L - 8) + '" y="' + (YP(v) + 4).toFixed(1) +
               '" text-anchor="end">' + v + '%</text>');
      });
      s.push('<line class="wu-meta-linha" x1="' + L + '" y1="' + YP(meta).toFixed(1) +
             '" x2="' + (larg - R) + '" y2="' + YP(meta).toFixed(1) + '"/>');
      s.push('<text class="wu-meta-rot" x="' + (larg - R - 2) + '" y="' +
             (YP(meta) - 5).toFixed(1) + '" text-anchor="end">meta ' + meta + '%</text>');
      dias.forEach(function (d) {
        s.push('<circle class="wu-ponto" cx="' + X(d.data.getTime()).toFixed(1) +
               '" cy="' + YP(d.pct).toFixed(1) + '" r="2.6"/>');
      });
      s.push('<path class="wu-linha-pct" d="' + dias.map(function (d, i) {
        return (i ? 'L' : 'M') + X(d.data.getTime()).toFixed(1) + ' ' +
               YP(Math.max(0, Math.min(100, pctSuave[i]))).toFixed(1);
      }).join(' ') + '"/>');
      s.push('<text class="wu-rotulo wu-rotulo--pct" x="' + (L + 4) + '" y="' +
             (yPct0 + 14) + '">' + (estreito
               ? '% de acerto · tendência'
               : '% de acerto por dia · linha = tendência') + '</text>');

      /* eixo de datas */
      var passo = estreito ? 28 : 14, y = alt - 8;
      for (var t = t0; t <= t1 + DIA_MS; t += passo * DIA_MS) {
        s.push('<text class="wu-eixo" x="' + X(t).toFixed(1) + '" y="' + y +
               '" text-anchor="middle">' + ddmm(new Date(t)) + '</text>');
      }

      /* marcador do hover */
      s.push('<line class="wu-cursor" y1="' + topo + '" y2="' + (topo + hVol + gap + hPct) +
             '" x1="-99" x2="-99"/>');
      s.push('</svg>');
      tela.innerHTML = s.join('');

      /* interação */
      var svg = tela.querySelector('.wu-svg');
      var cursor = svg.querySelector('.wu-cursor');

      function maisProximo(clientX) {
        var cx = svg.getBoundingClientRect();
        var px = (clientX - cx.left) / cx.width * larg;
        var melhor = null, dist = Infinity;
        dias.forEach(function (d) {
          var dd = Math.abs(X(d.data.getTime()) - px);
          if (dd < dist) { dist = dd; melhor = d; }
        });
        return dist < 26 ? melhor : null;
      }
      function mostrar(ev) {
        var d = maisProximo(ev.clientX);
        if (!d) { esconder(); return; }
        cursor.setAttribute('x1', X(d.data.getTime()).toFixed(1));
        cursor.setAttribute('x2', X(d.data.getTime()).toFixed(1));
        dica.hidden = false;
        dica.innerHTML =
          '<span class="wu-dica-data">' + ddmm(d.data) + '</span>' +
          (d.system ? '<span class="wu-dica-sis">' + esc(abrev[d.system] || d.system) + '</span>' : '') +
          '<span class="wu-dica-n">' + d.acertos + '/' + d.total + ' questões</span>' +
          '<span class="wu-dica-pct">' + num(d.pct) + '%</span>';
        var cx = svg.getBoundingClientRect(), ax = alvo.getBoundingClientRect();
        var px = cx.left + X(d.data.getTime()) / larg * cx.width - ax.left;
        dica.style.left = Math.max(4, Math.min(alvo.clientWidth - dica.offsetWidth - 4,
                                               px - dica.offsetWidth / 2)) + 'px';
        dica.style.top = (topo / alt * cx.height + (cx.top - ax.top) - 6) + 'px';
      }
      function esconder() {
        dica.hidden = true;
        cursor.setAttribute('x1', -99);
        cursor.setAttribute('x2', -99);
      }
      svg.addEventListener('mousemove', mostrar);
      svg.addEventListener('mouseleave', esconder);
      svg.addEventListener('touchstart', function (e) {
        if (e.touches[0]) mostrar(e.touches[0]);
      }, { passive: true });
      svg.addEventListener('touchmove', function (e) {
        if (e.touches[0]) mostrar(e.touches[0]);
      }, { passive: true });
    }

    desenhar();
    var timer;
    var onResize = function () {
      clearTimeout(timer);
      timer = setTimeout(desenhar, 120);
    };
    if (global.ResizeObserver) {
      var ro = new ResizeObserver(onResize);
      ro.observe(alvo);
    } else {
      global.addEventListener('resize', onResize);
    }
    return { redesenhar: desenhar, dias: dias, blocos: blocos };
  }

  /* ---------- estilos injetados uma vez ---------- */
  function garantirEstilo() {
    if (document.getElementById('wu-estilo')) return;
    var css = document.createElement('style');
    css.id = 'wu-estilo';
    css.textContent = [
      '.wu{--wu-clay:#BF4E28;--wu-ink:#23201D;--wu-graf:#46545C;--wu-mist:#D3DBDF;',
      '--wu-areia-a:#FAF8F5;--wu-areia-b:#F1EDE7;--wu-regua:#E4E0DA;--wu-suave:#7C766E;',
      'position:relative;font-family:var(--wu-fonte-ui,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);',
      'color:var(--wu-ink);}',
      '.wu-cab{margin:0 0 14px;}',
      '.wu-titulo{font-family:var(--wu-fonte-titulo,Georgia,"Times New Roman",serif);',
      'font-size:22px;font-weight:600;margin:0;letter-spacing:-.01em;}',
      '.wu-aluno{display:block;font-family:inherit;font-size:13px;font-weight:400;',
      'color:var(--wu-clay);letter-spacing:.08em;text-transform:uppercase;margin-top:3px;}',
      '.wu-meta{margin:8px 0 0;font-size:12.5px;color:var(--wu-suave);line-height:1.5;}',
      '.wu-meta strong{color:var(--wu-ink);font-weight:600;}',
      '.wu-tela{width:100%;}',
      '.wu-svg{display:block;width:100%;height:auto;overflow:visible;}',
      '.wu-faixa--a{fill:var(--wu-areia-a);}',
      '.wu-faixa--b{fill:var(--wu-areia-b);}',
      '.wu-bloco{font-size:10.5px;font-weight:600;fill:var(--wu-suave);text-anchor:middle;',
      'letter-spacing:.02em;}',
      '.wu-bloco-guia{stroke:var(--wu-regua);stroke-width:1;}',
      '.wu-grade{stroke:var(--wu-regua);stroke-width:1;}',
      '.wu-eixo{font-size:10.5px;fill:var(--wu-suave);}',
      '.wu-erro{fill:var(--wu-mist);}',
      '.wu-acerto{fill:var(--wu-graf);}',
      '.wu-linha-vol{fill:none;stroke:var(--wu-ink);stroke-width:2;stroke-linejoin:round;',
      'stroke-linecap:round;}',
      '.wu-ponto{fill:var(--wu-clay);opacity:.3;}',
      '.wu-linha-pct{fill:none;stroke:var(--wu-clay);stroke-width:2.4;stroke-linejoin:round;',
      'stroke-linecap:round;}',
      '.wu-meta-linha{stroke:var(--wu-suave);stroke-width:1;stroke-dasharray:3 3;opacity:.7;}',
      '.wu-meta-rot{font-size:10px;fill:var(--wu-suave);}',
      '.wu-rotulo{font-size:11px;font-weight:600;}',
      '.wu-rotulo--vol{fill:var(--wu-ink);}',
      '.wu-rotulo--pct{fill:var(--wu-clay);}',
      '.wu-cursor{stroke:var(--wu-ink);stroke-width:1;opacity:.28;}',
      '.wu-dica{position:absolute;pointer-events:none;background:#fff;border:1px solid var(--wu-regua);',
      'border-left:3px solid var(--wu-clay);border-radius:3px;padding:7px 10px;',
      'box-shadow:0 4px 14px rgba(35,32,29,.10);font-size:12px;line-height:1.45;white-space:nowrap;z-index:5;}',
      '.wu-dica span{display:block;}',
      '.wu-dica-data{font-weight:600;}',
      '.wu-dica-sis{color:var(--wu-clay);font-size:11px;text-transform:uppercase;letter-spacing:.05em;}',
      '.wu-dica-n{color:var(--wu-suave);}',
      '.wu-dica-pct{font-weight:600;font-size:14px;}',
      '.wu-vazio{padding:28px;text-align:center;color:#7C766E;font-size:14px;',
      'border:1px dashed #E4E0DA;border-radius:4px;}',
      '@media (prefers-reduced-motion:reduce){.wu *{transition:none!important;animation:none!important;}}'
    ].join('');
    document.head.appendChild(css);
  }

  global.WardUWorld = { render: render, ABREV: ABREV_PADRAO };
})(window);
