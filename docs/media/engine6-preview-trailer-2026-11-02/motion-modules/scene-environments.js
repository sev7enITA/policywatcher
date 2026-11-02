const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('environments', {
  init(kit) {
    kit.css('.env-lane{left:520px;width:840px;height:170px;padding:0 40px}' +
      '.env-db{fill:color-mix(in srgb, var(--ground) 82%, var(--second));stroke-width:3}' +
      '.env-pill{position:absolute;padding:6px 22px;border-radius:999px;background:var(--ground);border:2px dashed color-mix(in srgb, var(--second) 70%, var(--ground));font-size:28px;font-weight:700;letter-spacing:.12em;white-space:nowrap}');
    this.bd = UI.backdrop(kit);
    kit.stage.append(kit.h('<img class="env-wm" src="' + kit.assets.url('wordmark.webp') + '" style="position:absolute;left:120px;top:74px;width:560px">'));
    const c = kit.h('<div class="layer env-c">' +
      '<svg class="art" viewBox="0 0 1920 1080">' +
      '<path class="thread env-p1" d="M420 650 C 480 650, 460 525, 520 525 H1470"/>' +
      '<path class="thread-m env-p2" d="M420 650 C 480 650, 460 775, 520 775 H1470"/>' +
      '<g class="env-sp"></g>' +
      '<g class="env-d1"><path class="env-db" style="stroke:var(--accent)" d="M1470 470 v110 a110 26 0 0 0 220 0 v-110"/><ellipse class="env-db" style="stroke:var(--accent)" cx="1580" cy="470" rx="110" ry="26"/></g>' +
      '<g class="env-d2"><path class="env-db" style="stroke:var(--main)" d="M1470 720 v110 a110 26 0 0 0 220 0 v-110"/><ellipse class="env-db" style="stroke:var(--main)" cx="1580" cy="720" rx="110" ry="26"/></g>' +
      '<path class="env-bd" d="M480 650 H1780" style="fill:none;stroke:var(--second);stroke-width:3;stroke-dasharray:14 12"/>' +
      '<path class="env-host" d="M520 905 V930 H1690 V905" style="fill:none;stroke:color-mix(in srgb, var(--second) 55%, var(--ground));stroke-width:3"/>' +
      '</svg>' +
      '<div class="node env-m" style="left:120px;top:440px;width:300px;height:420px;align-items:flex-start"><p class="big" style="margin:0">One mission</p><p class="label dim" style="margin:0;font-weight:400">Follow policy changes with evidence</p></div>' +
      '<div class="node n-cyan env-lane env-l1" style="top:440px"><p class="big" style="margin:0">Stable</p><p class="label" style="margin:0;font-weight:400">Public service · Product 5.5 · everyday use</p></div>' +
      '<div class="node env-lane env-l2" style="top:690px"><p class="big" style="margin:0">Engine 6 Preview</p><p class="label" style="margin:0;font-weight:400">Private admin workspace · experimental</p>' +
      '<svg viewBox="0 0 48 56" style="position:absolute;right:40px;top:52px;width:52px;height:60px"><path d="M12 24 V16 a12 12 0 0 1 24 0 V24" style="fill:none;stroke:var(--second);stroke-width:5"/><rect x="4" y="24" width="40" height="30" rx="6" style="fill:var(--main)"/></svg></div>' +
      '<div class="words env-t1" style="left:1470px;top:512px;width:220px;align-items:center"><p class="label" style="font-size:28px">Public data</p></div>' +
      '<div class="words env-t2" style="left:1470px;top:762px;width:220px;align-items:center"><p class="label" style="font-size:28px">Preview data</p></div>' +
      '<p class="env-pill env-bl" style="left:1040px;top:626px;margin:0">SEPARATE DATABASE</p>' +
      '<div class="words env-hl" style="left:520px;top:946px;width:1170px;align-items:center"><p class="label dim">Same hosting · clear boundary between public operation and experimental results</p></div>' +
      '</div>');
    kit.stage.append(c);
    this.ttl = UI.title(kit, '03', 'One mission. Two environments.');
    const q = s => kit.stage.querySelector(s);
    this.c = c.style; this.wm = q('.env-wm').style;
    this.p1 = UI.draw(q('.env-p1')); this.p2 = UI.draw(q('.env-p2'));
    this.m = q('.env-m').style; this.l1 = q('.env-l1').style; this.l2 = q('.env-l2').style;
    this.d1 = q('.env-d1').style; this.d2 = q('.env-d2').style; this.t1 = q('.env-t1').style; this.t2 = q('.env-t2').style;
    this.bdl = UI.draw(q('.env-bd')); this.bl = q('.env-bl').style;
    this.host = UI.draw(q('.env-host')); this.hl = q('.env-hl').style;
    this.s1 = UI.sparks(kit, q('.env-sp'), 7, 'spark', 7);
    this.s2 = UI.sparks(kit, q('.env-sp'), 4, 'spark', 6);
    q('.env-sp').lastChild.parentNode.querySelectorAll('circle').forEach((e, i) => { if (i >= 7) e.style.fill = 'var(--main)'; });
    this.d1.transformOrigin = '1580px 530px'; this.d2.transformOrigin = '1580px 780px';
  },
  render(t) {
    this.bd.render(t);
    this.wm.opacity = 1 - eio(seg(t, 0.1, 0.7));
    this.wm.transform = 'translateY(' + (-20 * seg(t, 0.1, 0.7)) + 'px)';
    this.ttl.k.style.opacity = eo(seg(t, 0.6, 1.1));
    TextFx.fadeFromRight(this.ttl.h, t, 0.7);
    const pop = (s, a, dy) => { const p = seg(t, a, a + 0.6); s.opacity = Math.min(1, p * 2.5); s.transform = 'translateY(' + ((dy || 40) * (1 - eo(p))) + 'px) scale(' + (0.94 + 0.06 * eob(p, 1.6)) + ')'; };
    pop(this.m, 1.4);
    this.p1.set(eio(seg(t, 2.1, 3.4))); this.p2.set(eio(seg(t, 2.3, 3.6)));
    pop(this.l1, 4.8); pop(this.l2, 7.8);
    this.s1.ride(this.p1, t, 0.32, seg(t, 5.5, 6.0));
    this.s2.ride(this.p2, t, 0.16, seg(t, 8.8, 9.3));
    const d = (s, a) => { const p = seg(t, a, a + 0.6); s.opacity = Math.min(1, p * 2); s.transform = 'scale(' + (0.6 + 0.4 * eob(p, 1.7)) + ')'; };
    d(this.d1, 10.4); d(this.d2, 10.8);
    this.t1.opacity = eo(seg(t, 10.8, 11.3)); this.t2.opacity = eo(seg(t, 11.2, 11.7));
    this.bdl.set(eio(seg(t, 13.9, 14.9)));
    pop(this.bl, 14.5, 16);
    this.host.set(eio(seg(t, 15.0, 15.9)));
    const h = eo(seg(t, 15.5, 16.1)); this.hl.opacity = h; this.hl.transform = 'translateY(' + (12 * (1 - h)) + 'px)';
    const fo = ei(seg(t, 17.3, 18));
    this.c.opacity = 1 - fo; this.ttl.el.style.opacity = 1 - fo;
    this.c.transform = 'scale(' + (1 + 0.012 * seg(t, 3, 18) - 0.02 * fo) + ')';
    this.c.transformOrigin = '960px 650px';
  },
});