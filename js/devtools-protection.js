(function() {
    'use strict';

    try {
        var _t = localStorage.getItem('_wd_dev');
        if (_t) {
            var _h = 0;
            for (var i = 0; i < _t.length; i++) {
                _h = ((_h << 5) - _h + _t.charCodeAt(i)) | 0;
            }
            if (_h === -1737859892) return;
        }
    } catch(_e) {}

    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 123) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
    }, true);

    document.addEventListener('contextmenu', function(e) {
        if (e.target && e.target.closest('a')) return true;
        e.preventDefault();
        return false;
    }, true);

    var _o = false;
    function _m() {
        return /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent) ||
            ('ontouchstart' in window && window.innerWidth < 1024);
    }
    function _cw() {
        if (_m()) return;
        var w = window.outerWidth - window.innerWidth > 160;
        var h = window.outerHeight - window.innerHeight > 160;
        if (w || h) { if (!_o) { _o = true; _x(); } } else { _o = false; }
    }
    function _cc() {
        var el = new Image();
        Object.defineProperty(el, 'id', { get: function() { _o = true; _x(); } });
        console.log('%c', el);
    }
    function _ad() {
        (function() {
            try {
                (function c(a) {
                    if (('' + a / a).length !== 1 || a % 20 === 0) {
                        (function() {}).constructor('debugger')();
                    }
                    c(++a);
                })(0);
            } catch(e) {}
        })();
    }
    function _x() {
        document.documentElement.innerHTML = '';
        document.title = '';
        try { window.location.replace('about:blank'); }
        catch(e) { document.write(''); document.close(); }
    }

    setInterval(_cw, 500);
    setInterval(_cc, 1000);
    if (!_m()) { setInterval(_ad, 3000); }

    document.addEventListener('dragstart', function(e) { e.preventDefault(); return false; }, true);

})();
