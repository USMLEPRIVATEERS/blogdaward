/*
 * Ward Academy — horarios livres de um mentor (fonte unica)
 *
 * Usado pela pagina do aluno (landmarks) e pela do mentor (mentor-chamadas),
 * para as duas fazerem a mesma conta:
 *  - padrao: blocos fixos em cada janela (inicio, +duracao+intervalo, ...);
 *  - mentor que ligou "inicio livre" (mentor_settings.start_step_minutes):
 *    um inicio a cada N minutos, desde que a chamada inteira caiba na janela;
 *  - um horario esta ocupado quando a chamada inteira se cruza com uma ja
 *    marcada (antes so contava o horario de inicio exatamente igual).
 *
 * Horarios em 'HH:MM' ou 'HH:MM:SS', sempre no fuso do mentor.
 * Funcoes puras: nada aqui fala com o banco.
 */
(function () {
    function min(hora) {
        const [h, m] = String(hora).split(':').map(Number);
        return h * 60 + (m || 0);
    }

    function hhmm(mins) {
        return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    }

    // mentor_settings -> passo do inicio livre em minutos, ou null (blocos fixos)
    function passoLivre(config) {
        const n = Number(config && config.start_step_minutes);
        return n > 0 ? n : null;
    }

    // [{ inicio (minutos), duracao }] de uma janela de disponibilidade
    function horariosDaJanela(janela, passo) {
        const duracao = janela.duration_minutes || 60;
        const intervalo = janela.break_minutes || 0;
        const fim = min(janela.end_time);
        const lista = [];
        for (let t = min(janela.start_time); t + duracao <= fim; t += (passo || duracao + intervalo)) {
            lista.push({ inicio: t, duracao });
        }
        return lista;
    }

    // Janelas de um dia: as fixas do dia da semana + as especificas da data.
    // Um dia marcado como indisponivel nao tem janela nenhuma.
    function janelasDoDia(dateStr, regulares, especificas) {
        const doDia = (especificas || []).filter(e => e.available_date === dateStr);
        if (doDia.some(e => e.is_unavailable)) return [];
        const dow = new Date(dateStr + 'T12:00:00').getDay();
        const fixas = (regulares || []).filter(r => r.day_of_week === dow && r.is_active !== false);
        return [...fixas, ...doDia];
    }

    // Duracao de uma chamada que comeca nesse horario: a da janela em que ela
    // cai. O banco grava 30 por padrao, o que esconderia metade de uma de 60.
    function duracaoNaHora(janelas, hora, padrao) {
        const t = min(hora);
        const janela = (janelas || []).find(j => t >= min(j.start_time) && t < min(j.end_time));
        return (janela && janela.duration_minutes) || padrao || 30;
    }

    function intervaloDaReserva(reserva, janelas) {
        const t = min(reserva.scheduled_time);
        return [t, t + duracaoNaHora(janelas, reserva.scheduled_time, reserva.duration_minutes)];
    }

    // Chamadas marcadas que se cruzam com [hora, hora + duracao)
    function conflitos(janelas, reservas, hora, duracao) {
        const a = min(hora), b = a + duracao;
        return (reservas || []).filter(r => {
            const [c, d] = intervaloDaReserva(r, janelas);
            return a < d && c < b;
        });
    }

    // [{ hora: 'HH:MM', duracao }] livres, em ordem
    function horariosLivres(janelas, reservas, passo) {
        const ocupados = (reservas || []).map(r => intervaloDaReserva(r, janelas));
        const livres = new Map();
        (janelas || []).forEach(j => horariosDaJanela(j, passo).forEach(h => {
            const fim = h.inicio + h.duracao;
            if (ocupados.some(([a, b]) => h.inicio < b && a < fim)) return;
            const hora = hhmm(h.inicio);
            if (!livres.has(hora)) livres.set(hora, h.duracao);
        }));
        return [...livres.entries()].sort((x, y) => x[0].localeCompare(y[0]))
            .map(([hora, duracao]) => ({ hora, duracao }));
    }

    window.WardHorarios = { min, hhmm, passoLivre, horariosDaJanela, janelasDoDia, duracaoNaHora, conflitos, horariosLivres };
})();
