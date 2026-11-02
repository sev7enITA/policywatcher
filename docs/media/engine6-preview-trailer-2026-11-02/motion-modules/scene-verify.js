const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('verify', {
  init(kit) {
    kit.css('.vf-sh{left:120px;width:440px;height:170px;padding:24px 30px}' +
      '.vf-h{margin:0;font-size:28px;font-weight:700;letter-spacing:.12em;color:color-mix(in srgb, var(--ground) 70%, var(--second))}' +
      '.vf-bar{position:absolute;left:30px;height:16px;border-radius:8px;background:color-mix(in srgb, var(--ground) 22%, var(--second))}' +
      '.vf-q{position:absolute;left:30px;height:30px;border-radius:6px;transform-origin:0 50%}' +
      '.vf-n{top:460px;height:150px;width:340px}' +
      '.vf-pub{left:1100px;top:790px;width:740px;height:150px;border-style:dashed;background:transparent;box-shadow:none;opacity:.9}');
    this.bd = UI.backdrop(kit);
    const sh = (cls, y, h, qc) => '<div class="sheet vf-sh ' + cls + '" style="top:' + y + 'px"><p class="vf-h">' + h + '</p>' +
      '<div class="vf-q" style="top:76px;width:300px;background:' + qc + '"></div>' +
      '<div class="vf-bar" style="top:83px;width:380px"></div><div class="vf-bar" style="top:125px;width:330px"></div></div>';
    const c = kit.h('<div class="layer vf-c">' +
      '<svg class="art" viewBox="0 0 1920 1080">' +
      '<path class="thread vf-t" d="M560 465 C 610 465, 610 535, 660 535"/><path class="thread vf-t" d="M560 665 C 610 665, 610 535, 660 535"/>' +
      '<path class="thread vf-t" d="M1000 535 H1100"/><path class="thread-a vf-ra" d="M1440 535 H1540"/>' +
      '<path class="thread vf-dn" d="M1270 610 V728"/>' +
      '<path class="vf-stop" d="M1215 742 H1325" style="stroke:var(--second);stroke-width:9;stroke-linecap:round"/>' +
      '<g class="vf-sp"></g></svg>' +
      sh('vf-b', 380, 'BEFORE', 'color-mix(in srgb, var(--main) 30%, var(--second))') +
      sh('vf-a', 580, 'AFTER', 'color-mix(in srgb, var(--accent) 35%, var(--second))') +
      '<div class="words vf-k" style="left:120px;top:322px;width:440px"><p class="kicker">Exact passages</p></div>' +
      '<div class="node vf-n vf-an" style="left:660px"><p class="big" style="margin:0">Analyst</p><p class="label dim" style="margin:0;font-weight:400">Points to exact passages</p></div>' +
      '<div class="node n-cyan vf-n vf-ve" style="left:1100px"><p class="big" style="margin:0">Verifier</p><p class="label dim" style="margin:0;font-weight:400">A separate check</p></div>' +
      '<div class="node n-amber vf-n vf-rv" style="left:1540px;width:330px"><p class="big amber" style="margin:0;font-size:42px">Human review</p><p class="label dim" style="margin:0;font-weight:400">High impact or uncertain</p></div>' +
      '<div class="node vf-pub"><p class="big dim" style="margin:0">Automatic publication</p><p class="label dim" style="margin:0;font-weight:400">Public changes and notifications</p></div>' +
      '<p class="tag vf-tag" style="left:1100px;top:962px;margin:0;color:var(--second)">Disabled in hosted Preview</p>' +
      '</div>');
    kit.stage.append(c);
    this.ttl = UI.title(kit, '06', 'Analyse. Verify. Review.');
    const q = s => kit.stage.querySelector(s), qa = s => [...kit.stage.querySelectorAll(s)];
    this.c = c.style; this.vk = q('.vf-k').style;
    this.b = q('.vf-b').style; this.a = q('.vf-a').style; this.qs = qa('.vf-q').map(e => e.style);
    this.ts = qa('.vf-t').map(e => UI.draw(e)); this.ra = UI.draw(q('.vf-ra')); this.dn = UI.draw(q('.vf-dn'));
    this.stop = q('.vf-stop').style; this.stop.transformOrigin = '1270px 742px';
    this.an = q('.vf-an').style; this.ve = q('.vf-ve').style; this.rv = q('.vf-rv').style; this.pub = q('.vf-pub').style; this.tag = q('.vf-tag').style;
    const sp = q('.vf-sp');
    this.s1 = UI.sparks(kit, sp, 3, 'spark', 7); this.s2 = UI.sparks(kit, sp, 3, 'spark', 7);
    this.s3 = UI.sparks(kit, sp, 3, 'spark-a', 7); this.s4 = UI.sparks(kit, sp, 1, 'spark', 9);
  },
  render(t) {
    this.bd.render(t);
    this.ttl.k.style.opacity = eo(seg(t, 0.3, 0.8));
    TextFx.fadeFromRight(this.ttl.h, t, 0.4);
    const pop = (s, a, dy, full) => { const p = seg(t, a, a + 0.6); s.opacity = Math.min(full || 1, p * 2.5); s.transform = 'translateY(' + ((dy || 36) * (1 - eo(p))) + 'px) scale(' + (0.94 + 0.06 * eob(p, 1.6)) + ')'; };
    pop(this.b, 1.3, 40); pop(this.a, 1.7, 40); this.vk.opacity = eo(seg(t, 1.2, 1.7));
    this.qs[0].transform = 'scaleX(' + eio(seg(t, 2.4, 3.1)) + ')'; this.qs[1].transform = 'scaleX(' + eio(seg(t, 3.4, 4.1)) + ')';
    pop(this.an, 3.6); this.ts[0].set(eio(seg(t, 3.9, 4.5))); this.ts[1].set(eio(seg(t, 4.0, 4.6)));
    this.s1.ride({ at: p => this.ts[0].at(p) }, t, 0.5, seg(t, 4.5, 4.9) * (1 - seg(t, 6.5, 7)));
    this.ts[2].set(eio(seg(t, 5.3, 5.8))); pop(this.ve, 5.5);
    this.s2.ride({ at: p => [lerp(1000, 1100, p), 535] }, t, 0.7, seg(t, 6.0, 6.4) * (1 - seg(t, 8, 8.4)));
    this.ra.set(eio(seg(t, 8.0, 8.6))); pop(this.rv, 8.3);
    this.s3.ride({ at: p => [lerp(1440, 1540, p), 535] }, t, 0.6, seg(t, 9.0, 9.4) * (1 - seg(t, 11.2, 11.6)));
    pop(this.pub, 11.7, 30, 0.9);
    this.dn.set(eio(seg(t, 12.4, 13.2)));
    const sp = eob(seg(t, 13.1, 13.5), 1.8); this.stop.opacity = Math.min(1, sp * 2); this.stop.transform = 'scaleX(' + sp + ')';
    const dp = eio(seg(t, 13.3, 14.4));
    this.s4.ride({ at: () => [1270, lerp(612, 724, dp)] }, 0.5, 1, seg(t, 13.3, 13.5));
    const tg = eob(seg(t, 13.8, 14.2), 1.6); this.tag.opacity = Math.min(1, tg * 2); this.tag.transform = 'scale(' + (0.7 + 0.3 * tg) + ')'; this.tag.transformOrigin = '0 50%';
    const fo = ei(seg(t, 19.3, 20));
    this.c.opacity = 1 - fo; this.ttl.el.style.opacity = 1 - fo;
    this.c.transformOrigin = '960px 640px'; this.c.transform = 'scale(' + (1 + 0.012 * seg(t, 2, 20)) + ')';
  },
});