window.UI = {
  backdrop(kit) {
    const root = kit.h('<div class="ground"><div class="bd-glow bd-g1"></div><div class="bd-glow bd-g2"></div><div class="bd-grid"></div><div class="bd-dots"></div><div class="bd-vig"></div></div>');
    kit.stage.append(root);
    const q = s => root.querySelector(s).style;
    const g1 = q('.bd-g1'), g2 = q('.bd-g2'), grid = q('.bd-grid'), dots = q('.bd-dots');
    const start = kit.start;
    return { el: root, render(t, px) {
      const T = t + start; px = px || 0;
      grid.transform = 'translate(' + (-((T * 6 + px * 0.35) % 96)) + 'px,' + (-((T * 2) % 96)) + 'px)';
      dots.transform = 'translate(' + (-((T * 16 + px) % 192)) + 'px,' + (-((T * 5) % 192)) + 'px)';
      g1.transform = 'translate(' + Math.sin(T * 0.11) * 160 + 'px,' + Math.cos(T * 0.08) * 90 + 'px)';
      g2.transform = 'translate(' + Math.cos(T * 0.09) * 180 + 'px,' + Math.sin(T * 0.13) * 80 + 'px)';
    } };
  },
  title(kit, num, text, width) {
    const w = kit.h('<div class="words" style="left:120px;top:92px;width:' + (width || 1560) + 'px;gap:16px"><p class="kicker">' + num + ' / 10</p><h2 class="line">' + text + '</h2></div>');
    kit.stage.append(w);
    return { el: w, k: w.children[0], h: w.children[1] };
  },
  draw(el) {
    const L = el.getTotalLength();
    el.style.strokeDasharray = L + ' ' + L;
    return { L, el, set(p) { el.style.strokeDashoffset = L * (1 - Math.max(0, Math.min(1, p))); },
      at(p) { const q = el.getPointAtLength(L * Math.max(0, Math.min(1, p))); return [q.x, q.y]; } };
  },
  sparks(kit, svg, n, cls, r) {
    const out = [];
    for (let i = 0; i < n; i++) { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', r || 7); c.setAttribute('class', cls || 'spark'); svg.append(c); out.push(c); }
    return { ride(path, t, speed, on) {
      out.forEach((c, i) => { const p = ((t * speed + i / n) % 1 + 1) % 1; const xy = path.at(p); c.setAttribute('cx', xy[0]); c.setAttribute('cy', xy[1]); c.style.opacity = on * Math.sin(Math.PI * p); });
    } };
  },
  fade(t, a, b, d) { d = d || 0.6; const c = x => Math.max(0, Math.min(1, x)); const i = c((t - a) / d), o = c((t - (b - d)) / d); return (1 - Math.pow(1 - i, 3)) * (1 - o * o * o); },
};