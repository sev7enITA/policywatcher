const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('research', {
  init(kit) {
    kit.css('.rr-chips{position:absolute;left:120px;top:330px;display:flex;gap:20px}' +
      '.rr-chip{margin:0;padding:10px 26px;border-radius:14px;font-size:32px;font-weight:600;background:color-mix(in srgb, var(--ground) 82%, var(--second));border:2px solid color-mix(in srgb, var(--accent) 60%, var(--ground));white-space:nowrap}' +
      '.rr-tr{position:absolute;left:120px;width:1680px;height:110px}' +
      '.rr-name{position:absolute;left:0;top:50%;transform:translateY(-50%);margin:0;font-size:44px;font-weight:700}' +
      '.rr-rail{position:absolute;left:620px;top:52px;width:760px;height:6px;border-radius:3px;background:color-mix(in srgb, var(--second) 22%, var(--ground));overflow:hidden}' +
      '.rr-run{position:absolute;top:0;left:0;width:180px;height:6px;border-radius:3px;background:linear-gradient(90deg, transparent, var(--accent), transparent)}' +
      '.rr-tag{position:absolute;left:1410px;top:50%;margin:0;transform:translateY(-50%);padding:6px 18px;border-radius:999px;border:2px solid var(--amber);color:var(--amber);font-size:28px;font-weight:700;letter-spacing:.1em;white-space:nowrap}' +
      '.rr-big{margin:0;font-size:96px;line-height:1;font-weight:700;letter-spacing:-.01em}');
    this.bd = UI.backdrop(kit);
    const tr = (y, name) => '<div class="rr-tr" style="top:' + y + 'px"><p class="rr-name">' + name + '</p><div class="rr-rail"><div class="rr-run"></div></div><p class="rr-tag">IN QUALIFICATION</p></div>';
    const c = kit.h('<div class="layer rr-c">' +
      '<div class="rr-chips"><p class="rr-chip">Local tests</p><p class="rr-chip">Hosted checks</p><p class="rr-chip">Source completeness</p><p class="rr-chip">Observations over time</p></div>' +
      tr(450, 'Source completeness') + tr(570, 'Observations across days') + tr(690, 'Real scale') +
      '<div class="words rr-tg" style="left:120px;top:850px;width:1100px;gap:12px"><div style="display:flex;align-items:center;gap:28px"><p class="rr-big">500 policies a day</p><p class="tag rr-tt" style="position:relative;margin:0;color:var(--accent)">TARGET</p></div>' +
      '<p class="label dim rr-q" style="font-weight:400">Full qualification at that scale is still in progress.</p></div>' +
      '</div>');
    kit.stage.append(c);
    this.ttl = UI.title(kit, '08', 'Research is part of the product.');
    const qa = s => [...kit.stage.querySelectorAll(s)], q = s => kit.stage.querySelector(s);
    this.c = c.style;
    this.chips = qa('.rr-chip').map(e => e.style);
    this.trs = qa('.rr-tr').map(e => e.style); this.runs = qa('.rr-run').map(e => e.style); this.rails = qa('.rr-rail').map(e => e.style);
    this.tags = qa('.rr-tag').map(e => e.style);
    this.big = q('.rr-big').style; this.tt = q('.rr-tt').style; this.rq = q('.rr-q').style;
  },
  render(t) {
    this.bd.render(t);
    this.ttl.k.style.opacity = eo(seg(t, 0.3, 0.8));
    TextFx.fadeFromRight(this.ttl.h, t, 0.4);
    [4.0, 5.0, 6.2, 7.4].forEach((a, i) => { const p = seg(t, a, a + 0.5); const s = this.chips[i]; s.opacity = Math.min(1, p * 2.5); s.transform = 'translateY(' + (24 * (1 - eo(p))) + 'px) scale(' + (0.92 + 0.08 * eob(p, 1.7)) + ')'; });
    [8.2, 8.7, 9.2].forEach((a, i) => {
      const p = eo(seg(t, a, a + 0.6));
      this.trs[i].opacity = p; this.trs[i].transform = 'translateX(' + (40 * (1 - p)) + 'px)';
      this.rails[i].transformOrigin = '0 50%'; this.rails[i].transform = 'scaleX(' + eio(seg(t, a + 0.2, a + 1.0)) + ')';
      const ph = ((t + i * 0.9) % 2.8) / 2.8;
      this.runs[i].transform = 'translateX(' + lerp(-180, 760, ph) + 'px)';
      this.runs[i].opacity = seg(t, a + 0.9, a + 1.3);
      const g = eob(seg(t, a + 1.1, a + 1.5), 1.6);
      this.tags[i].opacity = Math.min(1, g * 2); this.tags[i].transform = 'translateY(-50%) scale(' + (0.7 + 0.3 * g) + ')';
    });
    const b = eo(seg(t, 10.9, 11.6));
    this.big.opacity = b; this.big.transform = 'translateY(' + (30 * (1 - b)) + 'px)';
    const tg = eob(seg(t, 11.8, 12.2), 1.7); this.tt.opacity = Math.min(1, tg * 2); this.tt.transform = 'scale(' + (0.6 + 0.4 * tg) + ')';
    const r = eo(seg(t, 13.8, 14.4)); this.rq.opacity = r; this.rq.transform = 'translateY(' + (12 * (1 - r)) + 'px)';
    const fo = ei(seg(t, 19.3, 20));
    this.c.opacity = 1 - fo; this.ttl.el.style.opacity = 1 - fo;
    this.c.transformOrigin = '960px 640px'; this.c.transform = 'scale(' + (1 + 0.012 * seg(t, 2, 20)) + ')';
  },
});