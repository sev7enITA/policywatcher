const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('evidence', {
  init(kit) {
    kit.css('.ev-s{position:absolute;border-radius:12px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.4);transform-origin:50% 50%}' +
      '.ev-s img{display:block;width:100%;height:100%}' +
      '.ev-l{position:absolute;margin:0;font-size:30px;font-weight:600;text-align:center}' +
      '.ev-box{position:absolute;border-radius:24px;border:2px solid color-mix(in srgb, var(--second) 25%, var(--ground));background:color-mix(in srgb, var(--ground) 92%, var(--second))}' +
      '.ev-url{margin:0;font-size:34px;font-weight:600;color:var(--accent)}');
    this.bd = UI.backdrop(kit);
    const D = [['diagram-architecture.webp', 'Architecture', 0.5], ['diagram-decision.webp', 'Decision flow', 0.7835], ['diagram-entities.webp', 'Entity relationships', 0.7]];
    this.D = D;
    let h = '<div class="layer ev-c">' +
      '<div class="ev-box ev-b1" style="left:110px;top:360px;width:900px;height:500px"></div>' +
      '<div class="ev-box ev-b2" style="left:1080px;top:360px;width:720px;height:500px"></div>' +
      '<div class="words ev-dt" style="left:150px;top:392px;width:820px;gap:10px"><p class="kicker">Public research diary</p><p class="ev-url">policywatcher.online/engine-6-preview</p></div>' +
      '<div class="words ev-gh" style="left:1130px;top:420px;width:620px;gap:20px"><p class="hero" style="font-size:96px">GitHub</p><p class="ev-url">github.com/sev7enITA/policywatcher</p><p class="sub">Records the implementation and its limits.</p></div>';
    D.forEach(d => { h += '<div class="ev-s"><img src="' + kit.assets.url(d[0]) + '"></div><p class="ev-l">' + d[1] + '</p>'; });
    h += '<div class="words ev-end" style="left:120px;top:892px;width:1700px;gap:8px"><p class="kicker ev-ce">Continuous engineering</p><h2 class="line ev-m" style="font-size:72px">Measure. Challenge. Refine. Show the work.</h2></div></div>';
    const c = kit.h(h);
    kit.stage.append(c);
    this.ttl = UI.title(kit, '09', 'Open the evidence. Follow the work.');
    const q = s => kit.stage.querySelector(s), qa = s => [...kit.stage.querySelectorAll(s)];
    this.c = c.style; this.ss = qa('.ev-s').map(e => e.style); this.ls = qa('.ev-l').map(e => e.style);
    this.b1 = q('.ev-b1').style; this.b2 = q('.ev-b2').style; this.dt = q('.ev-dt').style; this.gh = q('.ev-gh').style;
    this.ce = q('.ev-ce').style; this.m = q('.ev-m');
  },
  render(t) {
    this.bd.render(t);
    this.ttl.k.style.opacity = eo(seg(t, 0.3, 0.8));
    TextFx.fadeFromRight(this.ttl.h, t, 0.4);
    const FX = [120, 690, 1260], TX = [150, 440, 730], IN = [2.6, 3.7, 4.7];
    const mv = eio(seg(t, 6.2, 7.4));
    this.D.forEach((d, i) => {
      const fw = 540, fh = fw * d[2], tw = 260, th = tw * d[2];
      const w = lerp(fw, tw, mv), hh = lerp(fh, th, mv);
      const x = lerp(FX[i], TX[i], mv), y = lerp(600 - fh / 2, 520, mv);
      const p = seg(t, IN[i], IN[i] + 0.8);
      const foc = eio(seg(t, IN[i], IN[i] + 0.5)) * (1 - eio(seg(t, IN[i] + 1.0, IN[i] + 1.5))) * (1 - mv);
      const s = this.ss[i];
      s.left = x + 'px'; s.top = y + 'px'; s.width = w + 'px'; s.height = hh + 'px';
      s.opacity = Math.min(1, p * 2);
      s.transform = 'translateY(' + (80 * (1 - eo(p)) + Math.sin((t + i) * 0.8) * 6 * (1 - mv)) + 'px) scale(' + ((0.85 + 0.15 * eo(p)) * (1 + 0.1 * foc)) + ')';
      s.zIndex = foc > 0.01 ? 2 : 1;
      const l = this.ls[i];
      l.left = x + 'px'; l.width = w + 'px'; l.top = (y + hh + lerp(26, 14, mv)) + 'px';
      l.fontSize = lerp(32, 28, mv) + 'px';
      l.opacity = eo(seg(t, IN[i] + 0.3, IN[i] + 0.8));
    });
    const bx = eo(seg(t, 6.4, 7.2));
    this.b1.opacity = bx; this.dt.opacity = eo(seg(t, 6.9, 7.5));
    const g = seg(t, 6.8, 7.5);
    this.b2.opacity = Math.min(1, g * 2); this.b2.transform = 'translateX(' + (60 * (1 - eo(g))) + 'px)';
    const gh = eo(seg(t, 7.1, 7.8)); this.gh.opacity = gh; this.gh.transform = 'translateX(' + (40 * (1 - gh)) + 'px)';
    this.ce.opacity = eo(seg(t, 10.0, 10.5));
    TextFx.fadeFromRight(this.m, t, 12.0, { stagger: 0.42 });
    const fo = ei(seg(t, 15.4, 16));
    this.c.opacity = 1 - fo; this.ttl.el.style.opacity = 1 - fo;
  },
});