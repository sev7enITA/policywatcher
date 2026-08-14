const featureData = [
  {
    title: "Objective-based Composer",
    tag: "Purpose-first release layer",
    tone: "violet",
    x: 50,
    y: 10,
    what: "Turns first use into a guided objective and depth choice, then previews registered dashboard evidence modules.",
    why: "Different audiences can begin with their task instead of decoding a static dashboard.",
    changed: "Composes real evidence modules and persists the selected workspace instead of applying a static template.",
    boundary: "Source QA is pinned in every stack; composition cannot rewrite source records or bypass review."
  },
  {
    title: "Bulk Source Onboarding",
    tag: "Five-stage admin intake",
    tone: "amber",
    x: 50,
    y: 88,
    what: "Persists proposed source, official review, first private baseline, QA gate, and publication decision.",
    why: "Operators can intake large source batches without turning imports into accidental public evidence.",
    changed: "Adds controlled CSV/TSV validation, auditable transitions, and explicit publish, hold, or reject outcomes.",
    boundary: "Import, approval, baseline capture, and QA pass remain private until an administrator explicitly publishes."
  },
  {
    title: "Public Evidence Gate",
    tag: "Source-linked visibility",
    tone: "teal",
    x: 24,
    y: 16,
    what: "Keeps public surfaces tied to reviewed evidence packets and visible source context.",
    why: "Audiences can inspect where a policy signal came from before acting on it.",
    changed: "Strengthens the public-facing boundary between source capture and release views.",
    boundary: "A record can stay private or suspended when the evidence packet is incomplete."
  },
  {
    title: "Retrieval Cascade",
    tag: "Route-aware ingestion",
    tone: "amber",
    x: 76,
    y: 16,
    what: "Moves through direct fetch, HTTP/2, VPS rendering, and archival routes with outcome tags.",
    why: "Failures are visible as route states instead of being flattened into a single result.",
    changed: "Adds clearer fallback semantics for live demos and admin review.",
    boundary: "Fallback success is route-specific and never presented as universal source health."
  },
  {
    title: "VPS Renderer",
    tag: "Rendered evidence",
    tone: "teal",
    x: 88,
    y: 36,
    what: "Captures rendered pages when source behavior blocks simpler retrieval methods.",
    why: "Dynamic pages can still produce inspectable snapshots for downstream review.",
    changed: "The renderer is surfaced as a first-class route in the cascade.",
    boundary: "Rendered capture is tagged with route metadata and can still require review."
  },
  {
    title: "VPS Operations Agent",
    tag: "Service supervision",
    tone: "violet",
    x: 88,
    y: 76,
    what: "Tracks VPS service posture, operational alerts, and remediation tasks.",
    why: "Infrastructure state becomes part of the evidence workflow instead of a hidden dependency.",
    changed: "Adds stronger operational language for renderer availability and admin action.",
    boundary: "Service health supports retrieval decisions; it is not a substitute for source evidence."
  },
  {
    title: "Source Remediation",
    tag: "Admin repair path",
    tone: "amber",
    x: 36,
    y: 76,
    what: "Gives operators a structured path for fixing source configuration, host drift, and route issues.",
    why: "A broken source can be handled with traceable action instead of informal notes.",
    changed: "Remediation is linked to suspension and baseline review states.",
    boundary: "Admin fixes are logged and do not change past evidence without a new record."
  },
  {
    title: "Dataset QA",
    tag: "Quality boundary",
    tone: "teal",
    x: 12,
    y: 76,
    what: "Checks source status, snapshots, coverage, region impacts, and test badges before presentation.",
    why: "Quality posture becomes visible to internal stakeholders and technical audiences.",
    changed: "v3.6.3 elevates Dataset QA as a hard pillar in the release story.",
    boundary: "QA signals are controls and observations; publishability depends on source evidence."
  },
  {
    title: "KPI Matrix",
    tag: "Structured comparison",
    tone: "violet",
    x: 36,
    y: 34,
    what: "Organizes policy signals across monitored dimensions, regions, and evidence depth.",
    why: "A matrix makes policy posture comparable without hiding source context.",
    changed: "The matrix connects more clearly with workspace depth and public evidence.",
    boundary: "Coverage gaps remain visible and can limit comparisons."
  },
  {
    title: "Policy Signals Board",
    tag: "Public ranking surface",
    tone: "teal",
    x: 12,
    y: 36,
    what: "Turns reviewed policy movement into a scan-friendly public board.",
    why: "Stakeholders can follow movement without needing admin access.",
    changed: "The board is framed as a public surface connected to the evidence boundary.",
    boundary: "Ranking context depends on available, reviewed source coverage."
  },
  {
    title: "Press Wall",
    tag: "External narrative map",
    tone: "amber",
    x: 24,
    y: 56,
    what: "Connects public-facing release context with visible trust, security, and methodology pages.",
    why: "Media and partner audiences get a controlled entry point into the evidence model.",
    changed: "v3.6.3 positions press context beside public methodology and trust surfaces.",
    boundary: "Press material references reviewed outputs and does not override source-level review."
  },
  {
    title: "Observatory-ready Architecture",
    tag: "Scale posture",
    tone: "violet",
    x: 76,
    y: 56,
    what: "Shapes the platform for future observatory use across sources, regions, and policy domains.",
    why: "Architecture is presented as modular, inspectable, and ready for broader civic-tech use.",
    changed: "The release diagram makes public/private boundaries and evidence routes explicit.",
    boundary: "Readiness depends on configured sources, coverage, and review capacity."
  },
  {
    title: "Admin Audit Trail",
    tag: "Traceable control",
    tone: "teal",
    x: 64,
    y: 76,
    what: "Records operator review, source action, and visibility decisions.",
    why: "Admin work becomes accountable when public outputs depend on controlled evidence gates.",
    changed: "Audit posture is visible in the release narrative and assurance wall.",
    boundary: "Logs support review; they do not determine policy meaning on their own."
  },
  {
    title: "Interactive Sitemap",
    tag: "Surface discovery",
    tone: "violet",
    x: 50,
    y: 56,
    what: "Shows how dashboard, timeline, matrix, trust, security, and methodology views fit together.",
    why: "Audiences can navigate the platform as a public evidence system rather than separate pages.",
    changed: "The sitemap is included as a public surface in the v3.6.3 story.",
    boundary: "Navigation can expose only the records approved for that surface."
  },
  {
    title: "Methodology Center",
    tag: "Decision context",
    tone: "amber",
    x: 64,
    y: 34,
    what: "Explains evidence depth, retrieval states, QA checks, and publication boundaries.",
    why: "Methodology makes the platform easier to scrutinize for legal-tech and governance audiences.",
    changed: "v3.6.3 ties methodology directly to Adaptive Workspace depth choices.",
    boundary: "Methodology explains interpretation rules; source evidence remains the primary record."
  }
];

const workspaceData = {
  Citizen: {
    Snapshot: [
      ["Visible movement", "Prioritizes current policy changes with plain-language status and public source links."],
      ["Evidence card", "Shows the source, timestamp, and review state before any deeper reading."],
      ["Next action", "Points to dashboard, timeline, or methodology when the viewer needs context."]
    ],
    Operational: [
      ["Regional context", "Adds impacted regions, category filters, and public board placement."],
      ["Signal history", "Connects the current signal with earlier observations and route outcomes."],
      ["Transparency path", "Moves the user from summary to source-linked evidence without admin tools."]
    ],
    Forensic: [
      ["Source trail", "Exposes snapshot hashes, route tags, and baseline state for deeper inspection."],
      ["Boundary note", "Flags where public evidence ends and admin review begins."],
      ["Method review", "Links the record to methodology rules used to structure interpretation."]
    ]
  },
  "GRC / Legal": {
    Snapshot: [
      ["Risk posture", "Highlights policy areas likely to affect governance, risk, and compliance review."],
      ["Evidence status", "Shows whether public evidence is linked, queued, or under review."],
      ["Executive handoff", "Prepares a concise path for stakeholder briefing without hidden route details."]
    ],
    Operational: [
      ["Control mapping", "Pairs policy signals with KPI matrix coverage and region impact notes."],
      ["Review queue", "Surfaces records that need admin or legal review before wider use."],
      ["Audit context", "Displays access-log and admin-trail cues alongside public evidence."]
    ],
    Forensic: [
      ["Chain of review", "Follows source capture, route fallback, review state, and exposure decision."],
      ["Comparison boundary", "Marks where coverage gaps limit policy comparison."],
      ["Record integrity", "Centers snapshot hash, source status, and test badge context."]
    ]
  },
  Research: {
    Snapshot: [
      ["Research brief", "Condenses the active policy signal into source, region, and evidence depth."],
      ["Coverage check", "Shows what the dataset currently observes and where it needs review."],
      ["Citation path", "Sends researchers to public evidence and methodology pages first."]
    ],
    Operational: [
      ["Longitudinal view", "Combines timeline movement, matrix comparison, and policy signal board context."],
      ["Route confidence", "Shows direct, rendered, archival, and review outcomes as separate semantics."],
      ["KPI linkage", "Maps source observations to monitored policy dimensions."]
    ],
    Forensic: [
      ["Evidence packet", "Displays route metadata, snapshot hash, baseline state, and review comments."],
      ["Source variance", "Marks host drift and changed availability as research constraints."],
      ["Method appendix", "Keeps methodology rules adjacent to every high-depth view."]
    ]
  },
  Builder: {
    Snapshot: [
      ["Surface inventory", "Highlights dashboard, timeline, matrix, sitemap, trust, and admin entry points."],
      ["Integration cue", "Shows which public pages depend on evidence-gated records."],
      ["Demo path", "Prepares a concise route through the release for live walkthroughs."]
    ],
    Operational: [
      ["Architecture route", "Connects ingestion services, VPS rendering, Dataset QA, and public surfaces."],
      ["Operational state", "Shows route success, fallback, review, and suspension as implementation states."],
      ["Admin loop", "Links source remediation and audit trail to the evidence gate."]
    ],
    Forensic: [
      ["System trace", "Follows a record from source configuration through final visibility decision."],
      ["Failure semantics", "Keeps blocked, fallback, and suspended states distinct for implementation review."],
      ["Release proof", "Pairs build/test badges with source status and public evidence cues."]
    ]
  }
};

const featureElements = {};
let activeFeature = 0;
let cycleTimer = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileFeatureLayout = window.matchMedia("(max-width: 760px)");

function byId(id) {
  return document.getElementById(id);
}

function buildFeatureConstellation() {
  const container = byId("featureConstellation");

  featureData.forEach((feature, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "feature-node";
    button.dataset.tone = feature.tone;
    button.style.setProperty("--x", `${feature.x}%`);
    button.style.setProperty("--y", `${feature.y}%`);
    button.innerHTML = `<span>${feature.title}</span><small>${feature.tag}</small>`;
    button.addEventListener("click", () => {
      stopCycle();
      setActiveFeature(index, { reveal: true });
    });
    button.addEventListener("focus", () => setActiveFeature(index));
    button.addEventListener("mouseenter", () => {
      if (!cycleTimer) {
        setActiveFeature(index);
      }
    });
    container.appendChild(button);
    featureElements[index] = button;
  });

  setActiveFeature(0);
}

function placeFeatureDetail(index, reveal = false) {
  const featureLayout = document.querySelector(".feature-layout");
  const detailPanel = document.querySelector(".detail-panel");

  if (!featureLayout || !detailPanel || !featureElements[index]) {
    return;
  }

  if (mobileFeatureLayout.matches) {
    featureElements[index].after(detailPanel);
    if (reveal) {
      detailPanel.scrollIntoView({
        block: "nearest",
        behavior: prefersReducedMotion.matches ? "auto" : "smooth"
      });
    }
    return;
  }

  if (detailPanel.parentElement !== featureLayout) {
    featureLayout.appendChild(detailPanel);
  }
}

function setActiveFeature(index, options = {}) {
  activeFeature = index;
  const feature = featureData[index];

  Object.values(featureElements).forEach((element) => {
    element.classList.remove("is-active");
    element.removeAttribute("aria-current");
  });

  featureElements[index].classList.add("is-active");
  featureElements[index].setAttribute("aria-current", "true");
  byId("featureDetailTag").textContent = feature.tag;
  byId("featureDetailTitle").textContent = feature.title;
  byId("featureWhat").textContent = feature.what;
  byId("featureWhy").textContent = feature.why;
  byId("featureChanged").textContent = feature.changed;
  byId("featureBoundary").textContent = feature.boundary;
  placeFeatureDetail(index, options.reveal === true);
}

function startCycle() {
  if (cycleTimer) {
    return;
  }

  const button = byId("cycleFeatures");
  button.textContent = "Stop cycle";
  button.setAttribute("aria-pressed", "true");

  cycleTimer = window.setInterval(() => {
    const next = (activeFeature + 1) % featureData.length;
    setActiveFeature(next);
  }, prefersReducedMotion.matches ? 2800 : 1700);
}

function stopCycle() {
  if (!cycleTimer) {
    return;
  }

  window.clearInterval(cycleTimer);
  cycleTimer = null;
  const button = byId("cycleFeatures");
  button.textContent = "Cycle features";
  button.setAttribute("aria-pressed", "false");
}

function buildWorkspaceControls() {
  const jobs = Object.keys(workspaceData);
  const depths = ["Snapshot", "Operational", "Forensic"];
  const jobSelector = byId("jobSelector");
  const depthSelector = byId("depthSelector");
  let activeJob = jobs[0];
  let activeDepth = depths[0];

  function renderLogic() {
    byId("logicMode").textContent = `${activeJob} / ${activeDepth}`;

    document.querySelectorAll(".job-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.job === activeJob);
      button.setAttribute("aria-pressed", String(button.dataset.job === activeJob));
    });

    document.querySelectorAll(".depth-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.depth === activeDepth);
      button.setAttribute("aria-pressed", String(button.dataset.depth === activeDepth));
    });

    const cards = workspaceData[activeJob][activeDepth]
      .map((item, index) => `
        <article class="logic-card" style="animation-delay:${index * 70}ms">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <h4>${item[0]}</h4>
          <p>${item[1]}</p>
        </article>
      `)
      .join("");

    byId("logicCards").innerHTML = cards;
  }

  jobs.forEach((job) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "job-button";
    button.dataset.job = job;
    button.textContent = job;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      activeJob = job;
      renderLogic();
    });
    jobSelector.appendChild(button);
  });

  depths.forEach((depth) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "depth-button";
    button.dataset.depth = depth;
    button.textContent = depth;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      activeDepth = depth;
      renderLogic();
    });
    depthSelector.appendChild(button);
  });

  renderLogic();
}

function enablePresentationMode() {
  const button = byId("presentationToggle");

  button.addEventListener("click", () => {
    const active = document.body.classList.toggle("presentation");
    button.setAttribute("aria-pressed", String(active));
  });
}

function enableCycleButton() {
  const button = byId("cycleFeatures");

  button.addEventListener("click", () => {
    if (cycleTimer) {
      stopCycle();
    } else {
      startCycle();
    }
  });
}

function animatePipelineSteps() {
  if (prefersReducedMotion.matches) {
    return;
  }

  const steps = [...document.querySelectorAll(".pipeline-step")];
  let current = 0;

  window.setInterval(() => {
    steps[current].classList.remove("is-current");
    current = (current + 1) % steps.length;
    steps[current].classList.add("is-current");
  }, 1100);
}

buildFeatureConstellation();
buildWorkspaceControls();
enablePresentationMode();
enableCycleButton();
animatePipelineSteps();
mobileFeatureLayout.addEventListener("change", () => placeFeatureDetail(activeFeature));
