const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('resume', {
  init(kit) {
    kit.css('.rs-n{width:340px;height:120px;padding:0 26px;gap:2px}' +
      '.rs-n .big{font-size:46px;margin:0}' +
      '.rs-n .label{font-size:28px;margin:0;font-weight:400}' +
      '.rs-lb{position:absolute;margin:0;font-size:28px;font-weight:600;color:var(--accent);white-space:nowrap}' +
      '.rs-sh{padding:22px 26px}' +
      '.rs-h{margin:0;font-size:28px;font-weight:700;letter-spacing:.12em;color:color-mix(in srgb, var(--ground) 70%, var(--second))}' +
      '.rs-bar{position:absolute;left:26px;height:16px;border-radius:8px;background:color-mix(in srgb, var(--ground) 22%, var(--second))}');
    this.bd = UI.backdrop(kit);
    const n = (cls, x, y, a, b, extra) => '<div class="node rs-n ' + cls + '" style="left:' + x + 'px;top:' + y + 'px"><p class="big">' + a + '</p><p class="label dim">' + b + '</p>' + (extra || '') + '</div>';
    const out = (cls, x, h, w1, w2, w3) => '<div class="sheet rs-sh ' + cls + '" style="left:' + x + 'px;top:740px;width:360px;height:190px"><p class="rs-h">' + h + '</p>' +
      '<div class="rs-bar" style="top:84px;width:' + w1 + 'px"></div><div class="rs-bar" style="top:118px;width:' + w2 + 'px"></div><div class="rs-bar" style="top:152px;width:' + w3 + 'px"></div></div>';
    const icon = '<svg class="rs-ic" viewBox="0 0 60 60" style="position:absolute;right:22px;top:30px;width:60px;height:60px"><path d="M48 30 A18 18 0 1 1 40 15" style="fill:none;stroke:var(--accent);stroke-width:6;stroke-linecap:round"/><path d="M33 8 L42 15 L33 22" style="fill:none;stroke:var(--accent);stroke-width:6;stroke-linecap:round;stroke-linejoin:round"/></svg>';
    const c = kit.h('<div class="layer rs-c">' +
      '<div class="layer rs-erd"><svg class="art" viewBox="0 0 1920 1080">' +
      '<path class="thread-m rs-l" d="M290 450 V520"/><path class="thread-m rs-l" d="M290 640 V710" style="stroke-dasharray:10 10"/>' +
      '<path class="thread-m rs-l" d="M460 770 H540" style="stroke-dasharray:10 10"/><path class="thread-a rs-l" d="M710 640 V710"/></svg>' +
      n('rs-run', 120, 330, 'Run', 'id · requestKey · mode') +
      n('rs-task', 120, 520, 'Task', 'stage · lease · checkpoint', icon) +
      n('rs-att', 120, 710, 'Attempt', 'generation · outcome') +
      n('n-cyan rs-art', 540, 710, 'Artifact', 'Frozen body + integrity') +
      n('n-amber rs-rev', 540, 520, 'Review', 'decision · evidence') +
      '<p class="rs-lb rs-x" style="left:310px;top:466px">1 → N</p><p class="rs-lb rs-x" style="left:310px;top:656px">1 → N</p>' +
      '<p class="rs-lb rs-x amber" style="left:730px;top:656px">linked to evidence</p></div>' +
      '<div class="layer rs-cmp"><svg class="art" viewBox="0 0 1920 1080">' +
      '<path class="thread rs-s" d="M1400 470 C 1400 520, 1180 520, 1180 570"/><path class="thread rs-s" d="M1400 470 C 1400 520, 1620 520, 1620 570"/>' +
      '<path class="thread rs-s" d="M1180 680 V740"/><path class="thread rs-s" d="M1620 680 V740"/></svg>' +
      '<div class="words rs-k" style="left:1000px;top:286px;width:800px;align-items:center"><p class="kicker">Preview &amp; Compare</p></div>' +
      '<div class="sheet rs-sh rs-cap" style="left:1100px;top:340px;width:600px;height:130px"><p class="rs-h">ONE CAPTURED RESPONSE</p><p class="mono" style="margin:10px 0 0;font-size:30px">#9f3c 07ab … a71e</p></div>' +
      '<div class="node rs-ex rs-ea" style="left:1000px;top:570px;width:360px;height:110px;align-items:center"><p class="big" style="margin:0;font-size:44px">Extractor A</p></div>' +
      '<div class="node n-cyan rs-ex rs-eb" style="left:1440px;top:570px;width:360px;height:110px;align-items:center"><p class="big" style="margin:0;font-size:44px">Extractor B</p></div>' +
      out('rs-oa', 1000, 'OUTPUT A', 300, 250, 280) + out('rs-ob', 1440, 'OUTPUT B', 300, 210, 290) +
      '<div class="words rs-note" style="left:1000px;top:952px;width:800px;align-items:center;text-align:center"><p class="label" style="font-size:30px">Same captured response, two extractors. Not two acquisition engines.</p></div>' +
      '</div></div>');
    kit.stage.append(c);
    this.ttl = UI.title(kit, '07', 'Built to resume. Designed to be inspected.');
    const q = s => kit.stage.querySelector(s), qa = s => [...kit.stage.querySelectorAll(s)];
    this.c = c.style; this.erd = q('.rs-erd').style; this.erd.transformOrigin = '500px 640px';
    this.ns = ['.rs-run', '.rs-task', '.rs-att', '.rs-art', '.rs-rev'].map(s => q(s).style);
    this.ls = qa('.rs-l').map(e => UI.draw(e)); this.xs = qa('.rs-x').map(e => e.style);
    this.ic = q('.rs-ic').style; this.ic.transformOrigin = '30px 30px'; this.ic.transformBox = 'fill-box';
    this.k = q('.rs-k').style; this.cap = q('.rs-cap').style; this.ss = qa('.rs-s').map(e => UI.draw(e));
    this.ea = q('.rs-ea').style; this.eb = q('.rs-eb').style; this.oa = q('.rs-oa').style; this.ob = q('.rs-ob').style; this.note = q('.rs-note').style;
    this.capEl = q('.rs-cap');
  },
  render(t) {
    this.bd.render(t);
    this.ttl.k.style.opacity = eo(seg(t, 0.3, 0.8));
    TextFx.fadeFromRight(this.ttl.h, t, 0.4);
    const pop = (s, a, dy) => { const p = seg(t, a, a + 0.6); s.opacity = Math.min(1, p * 2.5); s.transform = 'translateY(' + ((dy || 30) * (1 - eo(p))) + 'px) scale(' + (0.94 + 0.06 * eob(p, 1.6)) + ')'; };
    const B = [3.3, 4.7, 5.4, 6.1, 6.9];
    this.ns.forEach((s, i) => pop(s, B[i]));
    this.ls[0].set(eio(seg(t, 4.5, 5.0))); this.ls[1].set(eio(seg(t, 5.2, 5.7))); this.ls[2].set(eio(seg(t, 5.9, 6.4))); this.ls[3].set(eio(seg(t, 7.1, 7.6)));
    this.xs[0].opacity = eo(seg(t, 4.8, 5.2)); this.xs[1].opacity = eo(seg(t, 5.5, 5.9)); this.xs[2].opacity = eo(seg(t, 7.3, 7.8));
    const ck = eob(seg(t, 7.5, 7.9), 1.8);
    this.ic.opacity = Math.min(1, seg(t, 7.5, 7.7) * 5);
    this.ic.transform = 'scale(' + ck + ') rotate(' + (360 * eio(seg(t, 7.9, 9.0))) + 'deg)';
    const sh = eio(seg(t, 9.4, 10.2));
    this.erd.opacity = 1 - 0.45 * sh; this.erd.transform = 'scale(' + (1 - 0.06 * sh) + ')';
    this.k.opacity = eo(seg(t, 9.6, 10.1));
    pop(this.cap, 9.9, 24);
    this.ss[0].set(eio(seg(t, 12.3, 12.9))); this.ss[1].set(eio(seg(t, 12.4, 13.0)));
    pop(this.ea, 12.7); pop(this.eb, 13.0);
    this.ss[2].set(eio(seg(t, 13.3, 13.6))); this.ss[3].set(eio(seg(t, 13.5, 13.8)));
    pop(this.oa, 13.5); pop(this.ob, 13.8);
    const hl = eo(seg(t, 14.5, 15.0));
    this.capEl.style.boxShadow = '0 0 0 ' + (6 * hl) + 'px var(--accent), 0 30px 70px rgba(0,0,0,.35)';
    const nt = eo(seg(t, 14.8, 15.4)); this.note.opacity = nt; this.note.transform = 'translateY(' + (14 * (1 - nt)) + 'px)';
    const fo = ei(seg(t, 17.3, 18));
    this.c.opacity = 1 - fo; this.ttl.el.style.opacity = 1 - fo;
  },
});