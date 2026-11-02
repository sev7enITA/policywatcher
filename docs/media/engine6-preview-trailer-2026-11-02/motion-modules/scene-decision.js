const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('decision', {
  init(kit) {
    kit.css('.dec-cap{position:absolute;width:340px;text-align:center;margin:0;font-size:30px;line-height:1.2;color:color-mix(in srgb, var(--second) 78%, var(--ground))}' +
      '.dec-node{height:150px;width:340px;top:460px;align-items:center;text-align:center}');
    this.bd = UI.backdrop(kit);
    const N = [['SOURCE', 'Explore the policy source'], ['VERSIONS', 'Compare versions'], ['CHANGE', 'Understand why it matters'], ['EVIDENCE', 'Keep the proof in reach']];
    this.X = [120, 560, 1000, 1440];
    let html = '<div class="dec-dia"><svg class="art" viewBox="0 0 1920 1080">';
    for (let i = 0; i < 3; i++) html += '<path class="thread dec-c" d="M' + (this.X[i] + 340) + ' 535 H' + this.X[i + 1] + '"/>';
    html += '<path class="thread-m dec-ret" style="stroke-width:5" d="M1610 760 C 1610 920, 290 920, 290 760"/><g class="dec-sp"></g></svg>';
    N.forEach((n, i) => {
      html += '<div class="node dec-node' + (i === 2 ? ' n-cyan' : '') + '" style="left:' + this.X[i] + 'px"><p class="big" style="margin:0;letter-spacing:.06em">' + n[0] + '</p></div>' +
        '<p class="dec-cap" style="left:' + this.X[i] + 'px;top:640px">' + n[1] + '</p>';
    });
    html += '<div class="words" style="left:560px;top:930px;width:800px;align-items:center"><p class="label cyan dec-rl">A path back to the evidence</p></div></div>';
    kit.stage.append(kit.h(html));
    kit.stage.append(kit.h('<div class="words dec-intro" style="left:360px;top:640px;width:1200px"><p class="sub" style="font-size:44px">Helps people and organisations follow changes in the policies of digital services.</p></div>'));
    kit.stage.append(kit.h('<div class="words" style="left:120px;top:200px;width:1700px"><h2 class="line dec-title">From policy text to a clearer decision</h2></div>'));
    kit.stage.append(kit.h('<p class="tag cyan dec-tag" style="left:0;top:0;margin:0">Product 5.5.0 · stable</p>'));
    kit.stage.append(kit.h('<img class="dec-wm" src="' + kit.assets.url('wordmark.webp') + '" style="position:absolute">'));
    kit.stage.append(kit.h('<img class="dec-mk" src="' + kit.assets.url('mark.webp') + '" style="position:absolute;left:0;top:0">'));
    const q = s => kit.stage.querySelector(s);
    this.wm = q('.dec-wm').style; this.mk = q('.dec-mk').style; this.tag = q('.dec-tag').style;
    this.dia = q('.dec-dia').style; this.dia.position = 'absolute'; this.dia.inset = '0';
    this.intro = q('.dec-intro').style; this.title = q('.dec-title');
    this.nodes = [...kit.stage.querySelectorAll('.dec-node')].map(e => e.style);
    this.caps = [...kit.stage.querySelectorAll('.dec-cap')].map(e => e.style);
    this.cons = [...kit.stage.querySelectorAll('.dec-c')].map(e => UI.draw(e));
    this.ret = UI.draw(q('.dec-ret')); this.rl = q('.dec-rl').style;
    this.sp = UI.sparks(kit, q('.dec-sp'), 6, 'spark', 7);
    this.sp2 = UI.sparks(kit, q('.dec-sp'), 3, 'spark', 6);
  },
  render(t) {
    this.bd.render(t);
    const mv = eio(seg(t, 0.3, 1.5));
    const ms = lerp(300, 178, mv);
    this.mk.width = ms + 'px'; this.mk.height = ms * 1.013 + 'px';
    this.mk.left = lerp(810, 362, mv) + 'px'; this.mk.top = lerp(488, 400, mv) + 'px';
    this.mk.opacity = 1 - seg(t, 1.5, 1.8);
    const sh = eio(seg(t, 6.0, 7.0));
    const ww = lerp(1200, 560, sh);
    this.wm.width = ww + 'px';
    this.wm.left = lerp(360, 120, sh) + 'px'; this.wm.top = lerp(386, 74, sh) + 'px';
    this.wm.opacity = seg(t, 1.45, 1.7);
    const wipe = eio(seg(t, 1.5, 2.5));
    this.wm.clipPath = 'inset(0 ' + (100 - lerp(16, 100, wipe)) + '% 0 0)';
    this.intro.opacity = UI.fade(t, 1.6, 6.1, 0.5);
    this.intro.transform = 'translateY(' + (20 * (1 - eo(seg(t, 1.6, 2.2)))) + 'px)';
    const tp = eo(seg(t, 3.0, 3.6));
    this.tag.opacity = tp;
    this.tag.transform = 'translate(' + lerp(360, 1460, sh) + 'px,' + lerp(820, 104, sh) + 'px)';
    TextFx.fadeFromRight(this.title, t, 6.6);
    const B = [7.0, 8.4, 9.9, 11.1];
    this.nodes.forEach((s, i) => {
      const p = seg(t, B[i], B[i] + 0.55);
      s.opacity = Math.min(1, p * 2.5);
      s.transform = 'translateY(' + (40 * (1 - eo(p))) + 'px) scale(' + (0.92 + 0.08 * eob(p, 1.7)) + ')';
      const c = eo(seg(t, B[i] + 0.3, B[i] + 0.8));
      this.caps[i].opacity = c; this.caps[i].transform = 'translateY(' + (16 * (1 - c)) + 'px)';
    });
    this.cons.forEach((c, i) => c.set(eio(seg(t, B[i] + 0.35, B[i + 1] + 0.1))));
    const flow = seg(t, 11.4, 11.8);
    this.sp.ride({ at: p => [lerp(460, 1440, p), 535] }, t, 0.22, flow);
    this.ret.set(eio(seg(t, 12.4, 14.0)));
    this.sp2.ride({ at: p => this.ret.at(p) }, t, 0.3, seg(t, 13.6, 14.0));
    const r = eo(seg(t, 13.2, 13.8));
    this.rl.opacity = r; this.rl.transform = 'translateY(' + (14 * (1 - r)) + 'px)';
    const fo = ei(seg(t, 17.3, 18));
    this.title.parentNode.style.opacity = 1 - fo;
    this.dia.opacity = 1 - fo; this.dia.transform = 'translateY(' + (-30 * fo) + 'px)';
    this.tag.opacity = tp * (1 - fo);
  },
});