const { seg, eo, ei, eio, eob, lerp, TextFx, rng } = kit;
kit.scene('rules', {
  init(kit) {
    kit.css('.rules-bar{position:absolute;left:48px;height:18px;border-radius:9px;background:color-mix(in srgb, var(--ground) 22%, var(--second))}' +
      '.rules-head{position:absolute;left:48px;top:38px;margin:0;letter-spacing:.16em;color:color-mix(in srgb, var(--ground) 70%, var(--second))}' +
      '.rules-row{position:absolute;left:28px;right:28px;top:306px;height:112px;border-radius:10px}' +
      '.rules-hl{position:absolute;inset:0;border-radius:10px;background:color-mix(in srgb, var(--accent) 24%, var(--second));transform-origin:0 50%}' +
      '.rules-txt{position:absolute;left:20px;right:20px;top:50%;transform:translateY(-50%);margin:0;font-size:38px;line-height:1.15;font-weight:600;color:var(--ground)}' +
      '.rules-tag{position:absolute;right:40px;top:30px;padding:4px 16px;border-radius:999px;background:var(--accent);color:var(--ground);font-size:28px;font-weight:700;letter-spacing:.12em}' +
      '.rules-ill{position:absolute;left:48px;top:584px;margin:0;font-size:28px;font-weight:600;letter-spacing:.06em;color:color-mix(in srgb, var(--ground) 55%, var(--second))}' +
      '.rules-group{position:absolute;inset:0;transform-origin:960px 640px}');
    this.bd = UI.backdrop(kit);
    const R = rng(11);
    const bars = tops => tops.map(y => '<div class="rules-bar" style="top:' + y + 'px;width:' + Math.round(400 + R() * 180) + 'px"></div>').join('');
    const sheet = (x, head, text, tag) => '<div class="sheet" style="left:' + x + 'px;top:330px;width:680px;height:640px">' +
      '<p class="label rules-head">' + head + '</p>' + tag + bars([116, 164, 212, 260]) +
      '<div class="rules-row"><div class="rules-hl"></div><div class="rules-bar rules-ghost" style="top:46px;left:20px;width:540px"></div><p class="rules-txt">' + text + '</p></div>' +
      bars([448, 496, 544]) + '<p class="rules-ill">Illustrative example</p></div>';
    kit.stage.append(kit.h('<div class="words rules-hero" style="left:140px;top:300px;width:1640px;gap:26px"><p class="kicker">PolicyWatcher | Evidence in Motion</p>' +
      '<h1 class="hero rules-h1">The rules change.</h1><h1 class="hero cyan rules-h2">Know what changed.</h1></div>'));
    kit.stage.append(kit.h('<div class="rules-group"><div class="rules-a">' + sheet(150, 'VERSION A', 'Your data helps run the service.', '') + '</div>' +
      '<div class="rules-b">' + sheet(1090, 'VERSION B', 'Your data helps run and improve the service.', '<p class="rules-tag">CHANGED</p>') + '</div>' +
      '<svg class="art" viewBox="0 0 1920 1080"><path class="thread rules-th" d="M800 693 C 900 560, 1060 560, 1150 693"/><g class="rules-sp"></g></svg></div>'));
    kit.stage.append(kit.h('<div class="words" style="left:120px;top:92px;width:1600px"><p class="kicker rules-k">Illustrative example, not a real provider policy</p></div>'));
    this.lines = ['A clause.', 'A permission.', 'A new use of your data.', 'What changed, and where is the proof?'].map(s => {
      const w = kit.h('<div class="words" style="left:120px;top:150px;width:1680px"><h2 class="line">' + s + '</h2></div>');
      kit.stage.append(w); return w.firstChild;
    });
    kit.stage.append(kit.h('<div class="rules-mk" style="position:absolute;left:730px;top:410px;width:460px;height:460px">' +
      '<div style="position:absolute;inset:-80px;border-radius:50%;background:radial-gradient(closest-side, var(--ground) 55%, transparent)"></div>' +
      '<img src="' + kit.assets.url('mark.webp') + '" style="position:absolute;left:80px;top:78px;width:300px;height:304px"></div>'));
    const q = s => kit.stage.querySelector(s);
    this.hero = q('.rules-hero'); this.h1 = q('.rules-h1'); this.h2 = q('.rules-h2'); this.k = q('.rules-k');
    this.group = q('.rules-group').style; this.a = q('.rules-a').style; this.b = q('.rules-b').style;
    this.mk = q('.rules-mk').style;
    const all = [...kit.stage.querySelectorAll('.rules-a .rules-bar'), ...kit.stage.querySelectorAll('.rules-b .rules-bar')];
    this.pul = [[all[1], all[9]], [all[3], all[11]]];
    this.ghost = [...kit.stage.querySelectorAll('.rules-ghost')].map(e => e.style);
    this.txt = [...kit.stage.querySelectorAll('.rules-txt')].map(e => e.style);
    this.hl = kit.stage.querySelectorAll('.rules-hl')[1].style;
    kit.stage.querySelectorAll('.rules-hl')[0].style.opacity = 0;
    this.tag = q('.rules-tag').style;
    this.th = UI.draw(q('.rules-th'));
    this.sp = UI.sparks(kit, q('.rules-sp'), 4, 'spark', 7);
  },
  render(t) {
    this.bd.render(t);
    TextFx.fadeFromRight(this.h1, t, -0.6);
    TextFx.fadeFromRight(this.h2, t, 0.5);
    const ho = ei(seg(t, 2.9, 3.5));
    this.hero.style.opacity = 1 - ho;
    this.hero.style.transform = 'translateY(' + (-60 * ho) + 'px)';
    const sin = eo(seg(t, 3.1, 4.3));
    this.a.opacity = sin; this.b.opacity = eo(seg(t, 3.35, 4.55));
    this.a.transform = 'translate(' + (-t * 2.2) + 'px,' + (140 * (1 - sin)) + 'px)';
    this.b.transform = 'translate(' + (t * 2.2) + 'px,' + (140 * (1 - eo(seg(t, 3.35, 4.55)))) + 'px)';
    const dim = eio(seg(t, 12.4, 13.4));
    this.group.opacity = 1 - 0.78 * dim;
    this.group.transform = 'scale(' + (lerp(0.97, 1.03, seg(t, 3, 12.4)) - 0.07 * dim) + ')';
    this.k.style.opacity = UI.fade(t, 3.6, 99, 0.5);
    const win = [[4.4, 5.6], [5.6, 6.9], [6.9, 10.4], [10.4, 99]];
    this.lines.forEach((el, i) => {
      const [a, b] = win[i];
      if (i === 3) { TextFx.fadeFromRight(el, t, a); el.style.opacity = 1; return; }
      const p = eo(seg(t, a, a + 0.45)), o = ei(seg(t, b - 0.3, b));
      el.style.opacity = p * (1 - o);
      el.style.transform = 'translateX(' + (30 * (1 - p) - 30 * o) + 'px)';
    });
    this.pul.forEach((pair, i) => {
      const a = i ? 5.7 : 4.45, v = Math.round(100 * eo(seg(t, a, a + 0.4)) * (1 - eio(seg(t, a + 1.6, a + 2.4))));
      pair.forEach(el => { el.style.background = 'color-mix(in srgb, var(--accent) ' + v + '%, color-mix(in srgb, var(--ground) 22%, var(--second)))'; });
    });
    const g = eio(seg(t, 7.0, 7.6));
    this.ghost.forEach(s => { s.opacity = 1 - g; s.transform = 'scaleX(' + (1 - 0.3 * g) + ')'; });
    this.txt[0].opacity = eo(seg(t, 7.1, 7.7));
    this.txt[1].opacity = eo(seg(t, 7.4, 8.0));
    this.hl.transform = 'scaleX(' + eio(seg(t, 7.7, 8.5)) + ')';
    const tg = eob(seg(t, 8.2, 8.6), 1.7);
    this.tag.opacity = Math.min(1, tg); this.tag.transform = 'scale(' + (0.6 + 0.4 * tg) + ')';
    this.th.set(eio(seg(t, 10.8, 11.8)));
    this.sp.ride(this.th, t, 0.45, seg(t, 11.5, 11.9) * (1 - seg(t, 12.6, 13.0)));
    const m = seg(t, 12.6, 13.5);
    this.mk.opacity = Math.min(1, m * 3);
    this.mk.transform = 'scale(' + (eob(m, 1.6) * kit.breathe(t, 0.01, 3.2)) + ')';
  },
});