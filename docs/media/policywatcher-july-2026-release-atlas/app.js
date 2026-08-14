(() => {
  const data = window.POLICYWATCHER_JULY_ATLAS;
  const logo = '../../../public/press-kit/policywatcher-logo-mark-512.png';
  const atlas = document.getElementById('atlas');
  const mobile = document.getElementById('mobile-atlas');
  const poster = document.getElementById('linkedin-poster');
  const viewport = document.getElementById('atlas-viewport');
  const stage = document.getElementById('atlas-stage');
  const zoomOutput = document.getElementById('zoom-output');
  const params = new URLSearchParams(location.search);
  const mode = params.get('export');

  const dateLabel = (iso) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(`${iso}T12:00:00Z`));
  const shortDate = (iso) => iso.slice(5).replace('-', '/');
  const buildByVersion = new Map(data.builds.map((build) => [build.version, build]));

  const metricCards = [
    [data.totals.deliveredCapabilities, 'delivered capability records by July 31'],
    [data.totals.companies, 'configured companies'],
    [data.totals.sectors, 'configured sectors'],
    [data.totals.kpis, 'canonical KPIs'],
    [data.totals.verifiedChromeListings, 'verified Chrome listing'],
  ];

  const buildButton = (version, compact = false) => {
    const build = buildByVersion.get(version);
    return `<button class="${compact ? 'build-chip' : 'ledger-entry'} searchable" type="button" data-build="${version}" data-search="${version} ${build?.title || ''} ${build?.detail || ''}">
      ${compact ? version : `<span class="ledger-version">${version}</span><span class="ledger-date">${shortDate(build.date)}</span><span class="ledger-title">${build.title}</span>`}
    </button>`;
  };

  const renderAtlas = () => {
    atlas.innerHTML = `
      <header class="atlas-header" data-section="header">
        <div class="atlas-brand">
          <img src="${logo}" alt="PolicyWatcher logo" />
          <div class="atlas-title-block">
            <p class="kicker">PolicyWatcher · Monthly product record</p>
            <h1>July 2026<br />Release Atlas</h1>
            <p class="subtitle">44 documented builds. 49 delivered capability records. One evidence-scoped system view.</p>
          </div>
        </div>
        <div class="header-metrics" aria-label="July release totals">
          <div class="hero-metric"><strong>44</strong><span>documented builds dated in July</span></div>
          <div class="hero-metric"><strong>13</strong><span>release days from July 2 to July 31</span></div>
          <div class="hero-metric"><strong>49</strong><span>delivered capability records by July 31</span></div>
        </div>
      </header>

      <section class="atlas-panel timeline-panel" data-section="timeline" aria-labelledby="timeline-title">
        <div class="panel-heading">
          <div><p class="panel-kicker">Axis 01 · Time</p><h2 id="timeline-title">Every documented July build, grouped by release day</h2></div>
          <p>Daily build count is encoded by the number of labelled build marks · peak: 8 builds on 29 July</p>
        </div>
        <div class="timeline-grid">
          ${data.releaseDays.map((day) => `
            <article class="release-day">
              <div class="release-date"><span>JUL</span>${day.date.slice(-2)}</div>
              <p class="daily-count">${day.count} ${day.count === 1 ? 'build' : 'builds'}</p>
              <div class="timeline-builds">${day.builds.map((version) => buildButton(version, true)).join('')}</div>
            </article>`).join('')}
        </div>
      </section>

      <div class="atlas-main">
        <section class="atlas-panel lifecycle-panel" data-section="lifecycle" aria-labelledby="lifecycle-title">
          <p class="panel-kicker">Axis 02 · Evidence lifecycle</p>
          <div class="panel-heading"><h2 id="lifecycle-title">Six bounded stages</h2></div>
          <div class="lifecycle-list">
            ${data.lifecycle.map((stageItem, index) => `
              <article class="lifecycle-step">
                <span class="step-number">${index + 1}</span>
                <div><h3>${stageItem.label}</h3><p>${stageItem.detail}</p></div>
              </article>`).join('')}
          </div>
        </section>

        <section class="atlas-panel capability-panel" data-section="capabilities" aria-labelledby="capability-title">
          <div class="panel-heading">
            <div><p class="panel-kicker">Axis 03 · Capability system</p><h2 id="capability-title">49 delivered records across nine product domains</h2></div>
            <p>Direct labels show the governed inventory; domain color also uses business/technical wording</p>
          </div>
          <div class="domain-grid">
            ${data.domains.map((domain) => `
              <article class="domain-card searchable" data-kind="${domain.kind}" data-size="${domain.features.length > 14 ? 'large' : domain.features.length > 7 ? 'medium' : 'small'}" data-search="${domain.label} ${domain.features.join(' ')}">
                <h3>${domain.label} <span>${domain.kind} · ${domain.features.length}</span></h3>
                <ul class="feature-list">${domain.features.map((feature) => `<li tabindex="0" data-feature="${feature}">${feature}</li>`).join('')}</ul>
              </article>`).join('')}
          </div>
        </section>

        <aside class="atlas-panel impact-panel" data-section="scope" aria-labelledby="scope-title">
          <div><p class="panel-kicker">Reference scope</p><div class="panel-heading"><h2 id="scope-title">What the numbers describe</h2></div></div>
          <div class="impact-metrics">
            ${metricCards.map(([value, label]) => `<div class="impact-metric"><strong>${value}</strong><span>${label}</span></div>`).join('')}
          </div>
          <article class="beta27-card">
            <span class="date">01 AUG 2026 · ${data.beta27.version}</span>
            <h3>${data.beta27.title}</h3>
            <p>Shown as the next checkpoint, not included in July totals.</p>
            <ul>${data.beta27.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
          </article>
          <article class="scope-card">
            <h3>Scope boundary</h3>
            <p>Inventory and implementation counts do not establish exhaustive coverage, measured adoption, compliance, performance, security assurance or independent validation.</p>
          </article>
        </aside>
      </div>

      <section class="atlas-panel ledger-panel" data-section="ledger" aria-labelledby="ledger-title">
        <div class="panel-heading">
          <div><p class="panel-kicker">Documented build ledger</p><h2 id="ledger-title">44 dated releases, with one primary change label each</h2></div>
          <p>Select a row in the interactive file for its bounded description</p>
        </div>
        <div class="ledger-grid">${data.builds.map((build) => buildButton(build.version)).join('')}</div>
      </section>

      <footer class="atlas-footer">
        <p class="source"><strong>Source and method:</strong> ${data.source}. Counts are reproducible from repository records. “Not assessed” is not zero. PolicyWatcher is pre-release software and does not provide legal advice.</p>
        <p class="url">policywatcher.online · 01 AUG 2026</p>
      </footer>`;
  };

  const renderMobile = () => {
    mobile.innerHTML = `
      <header class="mobile-hero">
        <div class="mobile-brand"><img src="${logo}" alt="PolicyWatcher logo" /><div><p class="eyebrow">Monthly product record</p><strong>POLICYWATCHER</strong></div></div>
        <h1>July 2026<br />Release Atlas</h1>
        <p>A mobile-first continuation of the same time, evidence and capability axes.</p>
        <div class="mobile-metrics">${metricCards.map(([value, label]) => `<div class="mobile-metric"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>
      </header>
      <section class="mobile-section"><h2>Time axis</h2><p>Swipe horizontally. Every card contains the exact versions documented for that day.</p><div class="mobile-timeline">${data.releaseDays.map((day) => `<article class="mobile-day"><strong>${dateLabel(day.date)}</strong><span>${day.count} ${day.count === 1 ? 'build' : 'builds'}</span><small>${day.builds.join(' · ')}</small></article>`).join('')}</div></section>
      <section class="mobile-section"><h2>Evidence lifecycle</h2><p>The primary record stays visible before secondary detail.</p><div class="mobile-lifecycle">${data.lifecycle.map((item, index) => `<article class="mobile-step"><b>${index + 1}</b><div><h3>${item.label}</h3><p>${item.detail}</p></div></article>`).join('')}</div></section>
      <section class="mobile-section"><h2>Capability axis</h2><p>All 49 delivered Feature Atlas records grouped by domain.</p><div class="mobile-domains">${data.domains.map((domain) => `<article class="mobile-domain" data-kind="${domain.kind}"><h3>${domain.label} · ${domain.features.length}</h3><ul>${domain.features.map((feature) => `<li>${feature}</li>`).join('')}</ul></article>`).join('')}</div></section>
      <section class="mobile-section"><h2>Build ledger</h2><p>All 44 changelog records dated in July.</p><div class="mobile-ledger">${data.builds.map((build) => `<article class="mobile-build"><b>${build.version}</b><time>${dateLabel(build.date)}</time><span>${build.title}</span></article>`).join('')}</div></section>
      <section class="mobile-section mobile-beta"><h3>1 August · ${data.beta27.version}</h3><p>${data.beta27.title}. It is intentionally excluded from the July totals.</p></section>
      <section class="mobile-section mobile-caveats"><h2>Scope and limitations</h2><ul>${data.caveats.map((caveat) => `<li>${caveat}</li>`).join('')}</ul></section>`;
  };

  const renderPoster = () => {
    poster.innerHTML = `
      <header class="poster-header"><img src="${logo}" alt="PolicyWatcher logo" /><div><h1>July 2026<br />Release Atlas</h1><p>Documented delivery across time, evidence lifecycle and product domains.</p></div><div class="poster-month">POLICYWATCHER<br />01 AUG 2026</div></header>
      <div class="poster-metrics">${metricCards.map(([value, label]) => `<div class="poster-metric"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>
      <div class="poster-timeline">${data.releaseDays.map((day) => `<div class="poster-day"><b>${day.date.slice(-2)}</b><span>${day.count}</span></div>`).join('')}</div>
      <div class="poster-section-title"><h2>Seven delivery waves</h2><span>44 builds across 13 release days · peak: 8 builds on 29 July</span></div>
      <div class="poster-waves">${data.waves.map((wave) => `<article class="poster-wave"><b>${wave.title}</b><small>${wave.dates} · ${wave.builds} builds<br />${wave.detail}</small></article>`).join('')}</div>
      <div class="poster-section-title"><h2>49 delivered capability records</h2><span>all Feature Atlas records delivered by 31 July, grouped by domain</span></div>
      <div class="poster-domains">${data.domains.map((domain) => `<article class="poster-domain" data-kind="${domain.kind}"><h3>${domain.label} · ${domain.features.length}</h3><ul>${domain.features.map((feature) => `<li>${feature}</li>`).join('')}</ul></article>`).join('')}</div>
      <div class="poster-bottom"><section class="poster-lifecycle"><h3>Six-stage evidence lifecycle</h3><ol>${data.lifecycle.map((item) => `<li>${item.label}</li>`).join('')}</ol></section><section class="poster-boundary"><h3>Scope boundary</h3><p>Counts describe configured scope and repository records. They do not establish exhaustive coverage, adoption, compliance, performance, security assurance or independent validation. Beta 27 on 1 August is excluded from July totals.</p></section></div>
      <footer class="poster-footer"><span>Source: PolicyWatcher changelog and Feature Atlas · “Not assessed” is not zero · Pre-release software · Not legal advice</span><strong>policywatcher.online</strong></footer>`;
  };

  renderAtlas();
  renderMobile();
  renderPoster();

  if (mode === 'master') document.body.classList.add('export-master');
  if (mode === 'linkedin') document.body.classList.add('export-linkedin');
  if (mode) return;

  let scale = Number(params.get('zoom')) || 0.34;
  const clamp = (value) => Math.min(1.6, Math.max(0.12, value));
  const applyScale = (next, anchor) => {
    const previous = scale;
    scale = clamp(next);
    const anchorX = anchor?.x ?? viewport.clientWidth / 2;
    const anchorY = anchor?.y ?? viewport.clientHeight / 2;
    const contentX = (viewport.scrollLeft + anchorX) / previous;
    const contentY = (viewport.scrollTop + anchorY) / previous;
    atlas.style.transform = `scale(${scale})`;
    stage.style.width = `${6480 * scale}px`;
    stage.style.height = `${4320 * scale}px`;
    zoomOutput.value = `${Math.round(scale * 100)}%`;
    viewport.scrollLeft = contentX * scale - anchorX;
    viewport.scrollTop = contentY * scale - anchorY;
  };

  const fit = () => {
    const fitScale = Math.min((viewport.clientWidth - 120) / 6480, (viewport.clientHeight - 120) / 4320);
    applyScale(fitScale);
    viewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  };
  applyScale(scale);
  if (params.has('x')) viewport.scrollLeft = Number(params.get('x')) || 0;
  if (params.has('y')) viewport.scrollTop = Number(params.get('y')) || 0;

  document.querySelectorAll('[data-zoom]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.zoom;
    if (action === 'in') applyScale(scale * 1.2);
    if (action === 'out') applyScale(scale / 1.2);
    if (action === 'fit') fit();
    if (action === 'actual') applyScale(1);
  }));

  document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
    const target = atlas.querySelector(`[data-section="${button.dataset.jump}"]`);
    if (!target) return;
    viewport.scrollTo({ left: Math.max(0, target.offsetLeft * scale - 60), top: Math.max(0, target.offsetTop * scale - 60), behavior: 'smooth' });
  }));

  viewport.addEventListener('wheel', (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    applyScale(scale * (event.deltaY > 0 ? 0.9 : 1.1), { x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, { passive: false });

  let drag = null;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, input, [tabindex="0"]')) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  });
  viewport.addEventListener('pointerup', () => { drag = null; });

  viewport.addEventListener('keydown', (event) => {
    const amount = event.shiftKey ? 500 : 150;
    if (event.key === 'ArrowLeft') viewport.scrollBy({ left: -amount });
    if (event.key === 'ArrowRight') viewport.scrollBy({ left: amount });
    if (event.key === 'ArrowUp') viewport.scrollBy({ top: -amount });
    if (event.key === 'ArrowDown') viewport.scrollBy({ top: amount });
    if (event.key === '+' || event.key === '=') applyScale(scale * 1.2);
    if (event.key === '-') applyScale(scale / 1.2);
    if (event.key === '0') fit();
  });

  const inspector = document.getElementById('inspector');
  const showInspector = ({ kind, title, copy, meta }) => {
    document.getElementById('inspector-kind').textContent = kind;
    document.getElementById('inspector-title').textContent = title;
    document.getElementById('inspector-copy').textContent = copy;
    document.getElementById('inspector-meta').innerHTML = Object.entries(meta).map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join('');
    inspector.hidden = false;
    inspector.querySelector('.inspector-close').focus();
  };
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-build]');
    if (trigger) {
      const build = buildByVersion.get(trigger.dataset.build);
      showInspector({ kind: 'Documented build', title: `${build.version} · ${build.title}`, copy: build.detail, meta: { Date: dateLabel(build.date), Source: 'CHANGELOG.md', Boundary: 'Primary change label; inspect the changelog for the complete record.' } });
    }
  });
  inspector.querySelector('.inspector-close').addEventListener('click', () => { inspector.hidden = true; viewport.focus(); });

  const search = document.getElementById('atlas-search');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    const items = [...atlas.querySelectorAll('.searchable')];
    items.forEach((item) => item.classList.toggle('is-match', Boolean(query) && item.dataset.search.toLowerCase().includes(query)));
    const first = items.find((item) => item.classList.contains('is-match'));
    if (first) viewport.scrollTo({ left: Math.max(0, first.offsetLeft * scale - 120), top: Math.max(0, first.offsetTop * scale - 120), behavior: 'smooth' });
  });
})();
