const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('follow', {
  init(kit) {
    kit.css('.fo-card{position:absolute;top:330px;width:540px;height:560px;border-radius:24px;background:color-mix(in srgb, var(--ground) 90%, var(--second));border:2px solid color-mix(in srgb, var(--second) 22%, var(--ground))}' +
      '.fo-qr{position:absolute;left:110px;top:30px;width:320px;height:320px;display:block}' +
      '.fo-w{position:absolute;left:16px;top:376px;width:508px;align-items:center;text-align:center;gap:10px}' +
      '.fo-lab{margin:0;font-size:36px;font-weight:700}' +
      '.fo-url{margin:0;font-size:28px;font-weight:600;color:var(--accent);overflow-wrap:anywhere}' +
      '.fo-ul{position:absolute;left:170px;top:520px;width:200px;height:6px;border-radius:3px;background:var(--accent);transform-origin:50% 50%}');
    this.bd = UI.backdrop(kit);
    const R = [['qr-site.png', 'Explore PolicyWatcher', 'policywatcher.online'], ['qr-research.png', 'Engine 6 research', 'policywatcher.online/engine-6-preview'], ['qr-code.png', 'Inspect the source', 'github.com/sev7enITA/policywatcher']];
    const X = [120, 690, 1260];
    let h = '<div class="layer fo-c">' +
      '<img class="fo-wm" src="' + kit.assets.url('wordmark.webp') + '" style="position:absolute;left:580px;top:58px;width:760px">' +
      '<div class="words fo-t" style="left:260px;top:214px;width:1400px;align-items:center"><h2 class="line" style="font-size:64px">Follow the change.</h2></div>';
    R.forEach((r, i) => {
      h += '<div class="fo-card" style="left:' + X[i] + 'px"><img class="fo-qr" src="' + kit.assets.url(r[0]) + '">' +
        '<div class="words fo-w"><p class="fo-lab">' + r[1] + '</p><p class="fo-url">' + r[2] + '</p></div><div class="fo-ul"></div></div>';
    });
    h += '<div class="words fo-cr" style="left:260px;top:952px;width:1400px;align-items:center"><p class="label dim" style="font-weight:400">PolicyWatcher · Fabrizio Degni</p></div></div>';
    kit.stage.append(kit.h(h));
    const q = s => kit.stage.querySelector(s), qa = s => [...kit.stage.querySelectorAll(s)];
    this.wm = q('.fo-wm').style; this.t = q('.fo-t h2');
    this.cards = qa('.fo-card').map(e => e.style); this.qrs = qa('.fo-qr').map(e => e.style); this.ws = qa('.fo-w').map(e => e.style);
    this.ul = qa('.fo-ul').map(e => e.style); this.cr = q('.fo-cr').style;
  },
  render(t) {
    this.bd.render(t);
    const w = eio(seg(t, 0.0, 1.0));
    this.wm.opacity = Math.min(1, w * 3);
    this.wm.clipPath = 'inset(0 ' + (100 - lerp(18, 100, w)) + '% 0 0)';
    TextFx.fadeFromRight(this.t, t, 0.5);
    [0.5, 0.65, 0.8].forEach((a, i) => {
      this.cards[i].opacity = eo(seg(t, a, a + 0.7));
      this.qrs[i].opacity = seg(t, a + 0.3, a + 1.0);
      this.ws[i].opacity = eo(seg(t, a + 0.5, a + 1.1));
    });
    [1.4, 3.7, 5.8].forEach((a, i) => { const p = eio(seg(t, a, a + 0.5)); this.ul[i].transform = 'scaleX(' + p + ')'; this.ul[i].opacity = p > 0 ? 1 : 0; });
    this.cr.opacity = eo(seg(t, 7.5, 8.3));
  },
});