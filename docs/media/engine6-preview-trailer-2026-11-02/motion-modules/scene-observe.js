const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('observe', {
  init(kit) {
    kit.css('.ob-card{top:380px;height:300px;width:400px;padding:30px 34px;display:flex;flex-direction:column;gap:14px}' +
      '.ob-h{margin:0;font-size:28px;font-weight:700;letter-spacing:.14em;color:color-mix(in srgb, var(--ground) 70%, var(--second))}' +
      '.ob-v{margin:0;font-size:36px;font-weight:600}' +
      '.ob-hash{margin:0;font-size:30px;color:color-mix(in srgb, var(--ground) 75%, var(--second))}' +
      '.ob-tag{position:absolute;left:34px;bottom:22px;padding:4px 16px;border-radius:999px;font-size:28px;font-weight:700;letter-spacing:.1em;background:var(--accent);color:var(--ground)}' +
      '.ob-chip{position:absolute;padding:10px 26px;border-radius:14px;font-size:32px;font-weight:600;background:color-mix(in srgb, var(--ground) 80%, var(--second));border:2px solid color-mix(in srgb, var(--second) 40%, var(--ground));white-space:nowrap}' +
      '.ob-box{position:absolute;left:600px;top:840px;width:1120px;height:150px;border:2px dashed color-mix(in srgb, var(--second) 40%, var(--ground));border-radius:20px}');
    this.bd = UI.backdrop(kit);
    const card = (cls, x, h, v, hash, tag) => '<div class="sheet ob-card ' + cls + '" style="left:' + x + 'px"><p class="ob-h">' + h + '</p><p class="ob-v">' + v + '</p><p class="ob-hash mono"></p>' + (tag ? '<p class="ob-tag">' + tag + '</p>' : '') + '</div>';
    const c = kit.h('<div class="layer ob-c">' +
      '<svg class="art" viewBox="0 0 1920 1080">' +
      '<path class="ob-ax" d="M120 700 H1800" style="fill:none;stroke:color-mix(in srgb, var(--second) 45%, var(--ground));stroke-width:3"/>' +
      '<path class="thread ob-pin" d="M800 680 V700"/><path class="thread ob-pin" d="M1520 680 V700"/><path class="thread-m ob-pin" d="M280 680 V700"/>' +
      '<path class="thread ob-cmp" d="M482 505 H598"/>' +
      '<path class="thread-m ob-gap" d="M800 740 V756 H1520 V740" style="stroke-width:3"/>' +
      '<circle class="spark ob-head" r="12" cy="700"/></svg>' +
      '<div class="words ob-cl" style="left:482px;top:446px;width:116px;align-items:center"><p class="label" style="font-size:28px">compare</p></div>' +
      card('ob-p', 80, 'PRESERVED', 'Earlier version', '', '') +
      card('ob-a', 600, 'FRESH CAPTURE 1', 'Traceable artifact', '', 'CANDIDATE') +
      card('ob-b', 1320, 'FRESH CAPTURE 2', 'Same change again', '', 'CONFIRMED') +
      '<div class="words ob-gl" style="left:800px;top:770px;width:720px;align-items:center"><p class="label" style="font-size:34px">At least one hour apart</p></div>' +
      '<div class="ob-box"></div>' +
      '<div class="words ob-bl" style="left:640px;top:870px;width:420px"><p class="label dim">Outside the count</p></div>' +
      '<p class="ob-chip ob-r" style="left:0;top:0;margin:0">Retry</p><p class="ob-chip ob-k" style="left:0;top:0;margin:0">Cached response</p>' +
      '<div class="words ob-fn" style="left:80px;top:850px;width:470px"><p class="label dim" style="font-size:28px;font-weight:400">A fingerprint identifies content. It does not certify truth.</p></div>' +
      '</div>');
    kit.stage.append(c);
    this.ttl = UI.title(kit, '05', 'A change needs more than one observation.');
    const q = s => kit.stage.querySelector(s), qa = s => [...kit.stage.querySelectorAll(s)];
    this.c = c.style;
    this.ax = UI.draw(q('.ob-ax')); this.pins = qa('.ob-pin').map(e => UI.draw(e));
    this.cmp = UI.draw(q('.ob-cmp')); this.cl = q('.ob-cl').style; this.gap = UI.draw(q('.ob-gap')); this.gl = q('.ob-gl').style;
    this.head = q('.ob-head');
    this.p = q('.ob-p').style; this.a = q('.ob-a').style; this.b = q('.ob-b').style; this.p.height = '300px';
    this.hs = qa('.ob-hash'); this.H = ['#41b0 2e7c … c2d9', '#9f3c 07ab … a71e', '#9f3c 07ab … a71e'];
    this.tags = qa('.ob-tag').map(e => e.style);
    this.box = q('.ob-box').style; this.bl = q('.ob-bl').style; this.fn = q('.ob-fn').style;
    this.r = q('.ob-r').style; this.k = q('.ob-k').style;
  },
  render(t) {
    this.bd.render(t);
    this.ttl.k.style.opacity = eo(seg(t, 0.3, 0.8));
    TextFx.fadeFromRight(this.ttl.h, t, 0.4);
    this.ax.set(eio(seg(t, 0.9, 2.2)));
    const drop = (s, a) => { const p = seg(t, a, a + 0.7); s.opacity = Math.min(1, p * 2.5); s.transform = 'translateY(' + (-70 * (1 - eob(p, 1.5))) + 'px)'; };
    drop(this.a, 1.3); this.pins[0].set(eo(seg(t, 1.8, 2.2)));
    drop(this.p, 4.0); this.pins[2].set(eo(seg(t, 4.5, 4.9)));
    this.cmp.set(eio(seg(t, 4.8, 5.4))); this.cl.opacity = eo(seg(t, 5.1, 5.6));
    const H = this.H, hs = this.hs;
    hs[1].textContent = kit.streamed(H[1], t, 2.0, 26, 3); hs[0].textContent = kit.streamed(H[0], t, 4.4, 26, 3); hs[2].textContent = kit.streamed(H[2], t, 9.5, 26, 3);
    const tg = (s, a) => { const p = eob(seg(t, a, a + 0.4), 1.7); s.opacity = Math.min(1, p * 2); s.transform = 'scale(' + (0.6 + 0.4 * p) + ')'; s.transformOrigin = '0 50%'; };
    tg(this.tags[0], 6.0);
    const hp = eio(seg(t, 7.4, 9.0));
    this.head.setAttribute('cx', lerp(800, 1520, hp));
    this.head.style.opacity = seg(t, 7.2, 7.5) * (1 - seg(t, 9.0, 9.4));
    this.gap.set(hp); this.gl.opacity = eo(seg(t, 10.0, 10.6));
    drop(this.b, 8.9); this.pins[1].set(eo(seg(t, 9.4, 9.8)));
    const m = eo(seg(t, 10.6, 11.1));
    [hs[1], hs[2]].forEach(e => { e.style.color = 'color-mix(in srgb, var(--accent) ' + Math.round(70 * m) + '%, color-mix(in srgb, var(--ground) 75%, var(--second)))'; e.style.fontWeight = m > 0.5 ? 700 : 400; });
    tg(this.tags[1], 11.0);
    const ch = (s, a, x0, y0, x1, y1) => {
      const p = seg(t, a, a + 0.5), d = eio(seg(t, 14.2, 15.0));
      s.opacity = Math.min(1, p * 2);
      s.transform = 'translate(' + lerp(x0, x1, d) + 'px,' + (lerp(y0, y1, d) + 24 * (1 - eo(p))) + 'px) rotate(' + (-3 * Math.sin(Math.PI * d)) + 'deg)';
      s.textDecoration = d > 0.5 ? 'line-through' : 'none';
    };
    ch(this.r, 12.3, 1540, 775, 1080, 885);
    ch(this.k, 13.0, 1260, 600, 1300, 885);
    const bx = eo(seg(t, 14.0, 14.6)); this.box.opacity = bx; this.bl.opacity = eo(seg(t, 14.6, 15.1));
    this.fn.opacity = eo(seg(t, 15.8, 16.5));
    const fo = ei(seg(t, 18.3, 19));
    this.c.opacity = 1 - fo; this.ttl.el.style.opacity = 1 - fo;
    this.c.transformOrigin = '960px 640px'; this.c.transform = 'scale(' + (1 + 0.012 * seg(t, 2, 19)) + ')';
  },
});