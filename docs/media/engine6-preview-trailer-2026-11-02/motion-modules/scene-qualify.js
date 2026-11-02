const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('qualify', {
  init(kit) {
    kit.css('.qa-st{top:430px;height:140px;align-items:center;text-align:center;padding:0 16px}' +
      '.qa-ck{display:flex;align-items:center;gap:18px;font-size:34px;font-weight:600;color:var(--ground);margin:0}' +
      '.qa-ck svg{width:44px;height:44px;flex:none}' +
      '.qa-ck circle{fill:none;stroke:color-mix(in srgb, var(--ground) 30%, var(--second));stroke-width:4}' +
      '.qa-ck path{fill:none;stroke:var(--accent);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}' +
      '.qa-an{border-style:dashed;background:transparent;box-shadow:none}');
    this.bd = UI.backdrop(kit);
    const st = (x, w, a, b, cls) => '<div class="node qa-st ' + (cls || '') + '" style="left:' + x + 'px;width:' + w + 'px"><p class="big" style="margin:0;letter-spacing:.06em">' + a + '</p>' + (b ? '<p class="label dim" style="margin:0;font-weight:400">' + b + '</p>' : '') + '</div>';
    const ck = s => '<p class="qa-ck"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19"/><path class="qa-tk" d="M12 23 L19 30 L32 15"/></svg>' + s + '</p>';
    const c = kit.h('<div class="layer qa-c">' +
      '<svg class="art" viewBox="0 0 1920 1080">' +
      '<path class="thread qa-l" d="M420 500 H500"/><path class="thread qa-l" d="M800 500 H880"/>' +
      '<path class="thread qa-run" d="M270 500 H1030" style="stroke:none"/>' +
      '<path class="thread qa-pass" d="M1180 500 H1380"/>' +
      '<path class="qa-br" d="M120 395 V375 H1180 V395" style="fill:none;stroke:var(--accent);stroke-width:3"/>' +
      '<path class="thread qa-cl" d="M1030 570 C 1030 620, 940 620, 900 640"/>' +
      '<path class="thread-a qa-am" d="M1130 570 C 1130 690, 1250 690, 1250 760"/>' +
      '<path class="qa-stop" d="M1212 736 L1288 736" style="stroke:var(--amber);stroke-width:8;stroke-linecap:round"/>' +
      '<g class="qa-sp"></g></svg>' +
      '<div class="words qa-bl" style="left:120px;top:322px;width:1060px;align-items:center"><p class="kicker">Before any AI</p></div>' +
      st(120, 300, 'ACQUIRE', '<span class="qa-dl">Download is only the start</span>') + st(500, 300, 'EXTRACT') + st(880, 300, 'QUALIFY', '', 'n-cyan') +
      st(1380, 420, 'ANALYSIS', 'Qualified material only', 'qa-an') +
      '<div class="sheet qa-card" style="left:120px;top:640px;width:820px;height:360px;padding:36px 44px;display:flex;flex-direction:column;gap:22px">' +
      '<p class="label" style="margin:0;letter-spacing:.16em;color:color-mix(in srgb, var(--ground) 70%, var(--second))">SOURCE CONTRACT</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px 24px">' + ck('Document identity') + ck('Language') + ck('Required sections') + ck('End of policy') + '</div></div>' +
      '<div class="node n-amber qa-rv" style="left:1100px;top:760px;width:600px;height:160px"><p class="big amber" style="margin:0">Held for review</p><p class="label" style="margin:0;font-weight:400">Incomplete or ambiguous material</p></div>' +
      '</div>');
    kit.stage.append(c);
    this.ttl = UI.title(kit, '04', 'First, qualify the source.');
    const q = s => kit.stage.querySelector(s), qa = s => [...kit.stage.querySelectorAll(s)];
    this.c = c.style;
    this.st = qa('.qa-st').map(e => e.style);
    this.ls = qa('.qa-l').map(e => UI.draw(e));
    this.br = UI.draw(q('.qa-br')); this.bl = q('.qa-bl').style;
    this.card = q('.qa-card').style; this.cl = UI.draw(q('.qa-cl'));
    this.tk = qa('.qa-tk').map(e => UI.draw(e)); this.cks = qa('.qa-ck').map(e => e.style);
    this.dl = q('.qa-dl').style; this.dl.opacity = 0;
    this.run = UI.draw(q('.qa-run')); this.pass = UI.draw(q('.qa-pass'));
    this.am = UI.draw(q('.qa-am')); this.stop = q('.qa-stop').style; this.rv = q('.qa-rv').style;
    const sp = q('.qa-sp');
    this.s1 = UI.sparks(kit, sp, 4, 'spark', 7);
    this.s2 = UI.sparks(kit, sp, 3, 'spark', 7);
    this.s3 = UI.sparks(kit, sp, 1, 'spark-a', 9);
  },
  render(t) {
    this.bd.render(t);
    this.ttl.k.style.opacity = eo(seg(t, 0.3, 0.8));
    TextFx.fadeFromRight(this.ttl.h, t, 0.4);
    const pop = (s, a, dy, full) => { const p = seg(t, a, a + 0.6); s.opacity = Math.min(full || 1, p * 2.5); s.transform = 'translateY(' + ((dy || 36) * (1 - eo(p))) + 'px) scale(' + (0.94 + 0.06 * eob(p, 1.6)) + ')'; };
    [1.6, 2.2, 2.8].forEach((a, i) => pop(this.st[i], a));
    pop(this.st[3], 3.4, 36, lerp(0.4, 1, eio(seg(t, 17.2, 18.0))));
    this.ls[0].set(eio(seg(t, 2.0, 2.5))); this.ls[1].set(eio(seg(t, 2.6, 3.1)));
    this.br.set(eio(seg(t, 2.4, 3.4))); this.bl.opacity = eo(seg(t, 3.0, 3.6));
    pop(this.card, 5.0, 50); this.cl.set(eio(seg(t, 4.8, 5.6)));
    [6.6, 8.1, 9.4, 10.6].forEach((a, i) => { this.tk[i].set(eo(seg(t, a, a + 0.35))); this.cks[i].opacity = lerp(0.45, 1, eo(seg(t, a - 0.2, a + 0.2))); });
    this.dl.opacity = eo(seg(t, 12.0, 12.6));
    this.s1.ride(this.run, t, 0.35, seg(t, 12.2, 12.6) * (1 - seg(t, 14.4, 14.8)));
    this.am.set(eio(seg(t, 14.6, 15.4)));
    pop(this.rv, 15.0, 30);
    const ap = eio(seg(t, 15.5, 16.6));
    this.s3.ride({ at: () => this.am.at(ap) }, 0.5, 1, seg(t, 15.4, 15.6) * (1 - 0.5 * seg(t, 16.6, 17.1)));
    const sp = eob(seg(t, 16.5, 16.9), 1.8); this.stop.opacity = Math.min(1, sp * 2); this.stop.transform = 'scaleX(' + sp + ')'; this.stop.transformOrigin = '1250px 736px';
    this.pass.set(eio(seg(t, 17.2, 17.8)));
    this.s2.ride({ at: p => [lerp(1180, 1380, p), 500] }, t, 0.6, seg(t, 17.7, 18.1));
    const fo = ei(seg(t, 19.3, 20));
    this.c.opacity = 1 - fo; this.ttl.el.style.opacity = 1 - fo;
    this.c.transformOrigin = '960px 640px';
    this.c.transform = 'scale(' + (1 + 0.012 * seg(t, 2, 20)) + ')';
  },
});