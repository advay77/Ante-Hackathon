/* ==========================================================================
   ANTE — Application logic (frontend only)
   Backend contract preserved: POST /api/brief returns NDJSON stream.
   No backend files are touched.
   ========================================================================== */

const form = document.querySelector("#brief-form");
const submit = document.querySelector("#submit");
const banner = document.querySelector("#banner");
const creditNote = document.querySelector("#credit-note");

// Screens
const screenInput = document.querySelector("#screen-input");
const screenProcessing = document.querySelector("#screen-processing");
const screenOutput = document.querySelector("#screen-output");

// Processing screen elements
const processSubtitle = document.querySelector("#process-subtitle");
const metaSubject = document.querySelector("#meta-subject");
const metaWindow = document.querySelector("#meta-window");
const stageTimeline = document.querySelector("#stage-timeline");
const stageEls = {
  1: document.querySelector("#stage-1"),
  2: document.querySelector("#stage-2"),
  3: document.querySelector("#stage-3"),
  4: document.querySelector("#stage-4"),
  5: document.querySelector("#stage-5"),
};
const categoryCards = {};
["News", "Launches", "Hires", "Deals"].forEach((label) => {
  categoryCards[label] = document.querySelector(`#cat-${label}`);
});
const liveFeed = document.querySelector("#live-feed");
const errorState = document.querySelector("#error-state");
const errorMessage = document.querySelector("#error-message");
const btnRetry = document.querySelector("#btn-retry");
const btnBackInput = document.querySelector("#btn-back-input");

// Output screen elements
const outSubject = document.querySelector("#out-subject");
const outWith = document.querySelector("#out-with");
const outMeeting = document.querySelector("#out-meeting");
const outPurpose = document.querySelector("#out-purpose");
const outWindow = document.querySelector("#out-window");
const outOneline = document.querySelector("#out-oneline");
const outFindings = document.querySelector("#out-findings");
const outNoFindings = document.querySelector("#out-no-findings");
const outDiscussion = document.querySelector("#out-discussion");
const outQuestions = document.querySelector("#out-questions");
const outHeldSection = document.querySelector("#out-held-section");
const outHeld = document.querySelector("#out-held");
const outFooter = document.querySelector("#out-footer");
const outSourcesSection = document.querySelector("#out-sources-section");
const outSourceCount = document.querySelector("#out-source-count");
const sourcesList = document.querySelector("#sources-list");
const btnSourcesToggle = document.querySelector("#btn-sources-toggle");

// Buttons
const btnPrint = document.querySelector("#btn-print");
const btnCopy = document.querySelector("#btn-copy");
const btnNew = document.querySelector("#btn-new");
const btnBackForm = document.querySelector("#btn-back-form");
const btnClearForm = document.querySelector("#btn-clear-form");

// Header stage indicator
const headerStageEls = {
  input: document.querySelector("#stage-input"),
  research: document.querySelector("#stage-research"),
  brief: document.querySelector("#stage-brief"),
};
const connEls = {
  1: document.querySelector("#conn-1-2"),
  2: document.querySelector("#conn-2-3"),
};

// Suggestion panel
const goalField = document.querySelector("#goal");
const suggestionPanel = document.querySelector("#suggestion-panel");

const purposes = {
  sales: "Sales call",
  partnership: "Partnership",
  investor: "Investor meeting",
  "business-development": "Business development",
  general: "General",
};

const purposeSuggestions = {
  sales: [
    "Understand their current business challenges.",
    "Explore potential opportunities.",
    "Identify upcoming requirements.",
    "Understand their technology stack.",
  ],
  partnership: [
    "Explore collaboration opportunities.",
    "Identify strategic synergies.",
    "Understand partnership priorities.",
    "Discover joint initiatives.",
  ],
  investor: [
    "Understand recent funding activity.",
    "Evaluate growth plans.",
    "Identify business risks.",
    "Understand their market position.",
  ],
  "business-development": [
    "Understand their current business challenges.",
    "Explore potential opportunities.",
    "Identify upcoming requirements.",
    "Understand their technology stack.",
  ],
  general: [
    "Understand recent developments.",
    "Identify key decision makers.",
    "Learn about recent product launches.",
    "Understand their market position.",
  ],
};

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

let inFlight = false;
let briefSubject = "";
let briefKind = "";
let briefPurpose = "";
let briefMeeting = "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function showScreen(name) {
  screenInput.classList.remove("screen-active");
  screenProcessing.classList.remove("screen-active");
  screenOutput.classList.remove("screen-active");

  if (name === "input") screenInput.classList.add("screen-active");
  if (name === "processing") screenProcessing.classList.add("screen-active");
  if (name === "output") screenOutput.classList.add("screen-active");

  // Update header stage indicator
  updateStageIndicator(name);

  // Position user appropriately per screen
  requestAnimationFrame(() => {
    if (name === "processing") {
      const heading = screenProcessing.querySelector(".process-heading");
      if (heading) heading.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (name === "output") {
      const title = screenOutput.querySelector(".report-title");
      if (title) title.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  });
}

function updateStageIndicator(name) {
  // Reset all stages
  for (const key of Object.keys(headerStageEls)) {
    const el = headerStageEls[key];
    if (!el) continue;
    el.className = "stage stage-pending";
  }
  for (const key of Object.keys(connEls)) {
    const el = connEls[key];
    if (!el) continue;
    el.className = "stage-connector";
  }

  if (name === "input") {
    headerStageEls.input.className = "stage stage-active";
  } else if (name === "processing") {
    headerStageEls.input.className = "stage stage-completed";
    headerStageEls.research.className = "stage stage-active";
    connEls[1].className = "stage-connector completed";
  } else if (name === "output") {
    headerStageEls.input.className = "stage stage-completed";
    headerStageEls.research.className = "stage stage-completed";
    headerStageEls.brief.className = "stage stage-active";
    connEls[1].className = "stage-connector completed";
    connEls[2].className = "stage-connector completed";
  }
}

function formatDay(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value || "—";
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

function formatWhen(value) {
  const [date, time] = String(value || "").split("T");
  const clock = time ? ` · ${time.slice(0, 5)}` : "";
  return `${formatDay(date)}${clock}`;
}

function showBanner(message) {
  if (!message) {
    banner.classList.remove("show");
    banner.textContent = "";
    return;
  }
  banner.classList.add("show");
  banner.textContent = message;
}

function setStage(stageNum, state) {
  // state: 'pending' | 'active' | 'done'
  const el = stageEls[stageNum];
  if (!el) return;
  el.className = "stage";
  if (state === "active") el.classList.add("active");
  if (state === "done") el.classList.add("done");
}

function resetStages() {
  for (const n of Object.keys(stageEls)) setStage(Number(n), "pending");
  if (stageTimeline) stageTimeline.classList.remove("ready");
}

function setCategory(label, count) {
  const card = categoryCards[label];
  const countEl = card ? card.querySelector(".category-count") : null;
  if (!card || !countEl) return;
  if (count === null) {
    countEl.textContent = "—";
    card.classList.remove("done");
  } else {
    countEl.textContent = String(count);
    card.classList.add("done");
  }
}

function resetCategories() {
  for (const label of Object.keys(categoryCards)) setCategory(label, null);
}

function addLiveItem(label, message, kind) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const item = el("div", "live-item");
  item.append(el("span", "live-time", `${hh}:${mm}`));
  item.append(el("span", "live-label", label));
  const msg = el("span", "live-msg", message);
  if (kind) msg.classList.add(kind);
  item.append(msg);
  liveFeed.append(item);
  liveFeed.scrollTop = liveFeed.scrollHeight;
}

function resetProcessingUI() {
  resetStages();
  resetCategories();
  liveFeed.replaceChildren();
  const vizWrap = document.querySelector(".viz-wrap");
  if (vizWrap) vizWrap.classList.remove("complete");
  if (errorState) errorState.hidden = true;
  if (processSubtitle) {
    processSubtitle.textContent =
      "Researching the developments that matter before your meeting.";
  }
}

function setVizComplete() {
  const vizWrap = document.querySelector(".viz-wrap");
  if (vizWrap) vizWrap.classList.add("complete");
}

// ---------------------------------------------------------------------------
// Contextual goal suggestions
// ---------------------------------------------------------------------------

function renderSuggestions(purposeKey) {
  const list = purposeSuggestions[purposeKey] || purposeSuggestions.general;
  suggestionPanel.replaceChildren();
  const groupTitle = el("div", "suggestion-group-title", "Suggestions");
  suggestionPanel.append(groupTitle);
  const ul = el("ul", "suggestion-list");
  for (const text of list) {
    const li = el("li", "suggestion-item", text);
    li.addEventListener("click", () => {
      // Insert suggestion preserving existing text
      const current = goalField.value.trim();
      const next = current ? `${current} ${text}` : text;
      goalField.value = next;
      goalField.dispatchEvent(new Event("input", { bubbles: true }));
      hideSuggestions();
      goalField.focus();
    });
    ul.append(li);
  }
  suggestionPanel.append(ul);
}

function showSuggestions() {
  suggestionPanel.style.display = "block";
  suggestionPanel.setAttribute("aria-hidden", "false");
}

function hideSuggestions() {
  suggestionPanel.style.display = "none";
  suggestionPanel.setAttribute("aria-hidden", "true");
}

goalField.addEventListener("focus", () => {
  const purposeKey = form.elements.purpose.value;
  renderSuggestions(purposeKey);
  showSuggestions();
});

goalField.addEventListener("click", (e) => {
  e.stopPropagation();
  showSuggestions();
});

form.elements.purpose.addEventListener("change", () => {
  if (suggestionPanel.style.display === "block") {
    renderSuggestions(form.elements.purpose.value);
  }
});

document.addEventListener("click", (e) => {
  if (!suggestionPanel.contains(e.target) && e.target !== goalField) {
    hideSuggestions();
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

async function loadHealth() {
  try {
    const response = await fetch("/api/health");
    const health = await response.json();
    const credits = health.searchDepth === "advanced" ? 8 : 4;
    creditNote.textContent = `Each briefing runs ${health.searchDepth} Tavily searches, about ${credits} credits, then one Bifrost completion.`;
    if (!health.tavily || !health.bifrost) {
      showBanner(
        "Add TAVILY_API_KEY, BIFROST_BASE_URL, and BIFROST_API_KEY to .env, then restart Ante. The page will stay blank until both are set."
      );
    }
  } catch {
    showBanner("Ante is not responding. Start it with node server.mjs.");
  }
}

// ---------------------------------------------------------------------------
// Form submission -> NDJSON stream
// ---------------------------------------------------------------------------

function setDefaultMeeting() {
  const meeting = form.elements.meeting;
  if (meeting.value) return;
  const next = new Date();
  next.setDate(next.getDate() + 1);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  meeting.value = `${next.getFullYear()}-${month}-${day}T15:00`;
}

function formatWindowRange(brief) {
  const w = brief.window;
  if (w.empty) return "Window not yet open";
  return `${formatDay(w.start)} – ${formatDay(w.end)}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showBanner("");
  inFlight = true;
  submit.disabled = true;

  briefSubject = String(form.elements.subject.value || "").trim();
  briefKind = String(form.elements.kind.value || "company");
  briefPurpose = String(form.elements.purpose.value || "general");
  briefMeeting = String(form.elements.meeting.value || "");

  // Switch to processing screen
  resetProcessingUI();
  showScreen("processing");
  metaSubject.textContent = briefSubject;
  metaWindow.textContent = formatWindowRange({ window: { ...researchWindowValues(briefMeeting), empty: false } });

  setStage(1, "done");
  addLiveItem("Window", "Setting the 30 days before the meeting", "done");

  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, today: todayStamp() }),
    });
    if (!response.ok || !response.body) {
      const failure = await response.json().catch(() => ({ error: "The briefing failed." }));
      throw new Error(failure.error || "The briefing failed.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let searchesDone = 0;
    let totalSearches = 0;
    let writingStarted = false;

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const parts = buffer.split("\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        if (!part.trim()) continue;
        const message = JSON.parse(part);

        if (message.type === "status") {
          addLiveItem("Status", message.message);
          if (!writingStarted && /Writing from/.test(message.message)) {
            writingStarted = true;
            setStage(3, "active");
            setStage(4, "active");
          }
        } else if (message.type === "search") {
          if (message.state === "start") {
            totalSearches += 1;
            setStage(2, "active");
            addLiveItem(message.label, "Searching", "active");
          } else if (message.state === "done") {
            searchesDone += 1;
            setCategory(message.label, message.count);
            addLiveItem(message.label, `${message.count} sources`, "done");
            if (searchesDone >= totalSearches) {
              setStage(2, "done");
            }
          } else if (message.state === "error") {
            setCategory(message.label, null);
            addLiveItem(message.label, message.message || "Search failed.", "error");
          }
        } else if (message.type === "error") {
          throw new Error(message.message);
        } else if (message.type === "brief") {
          setStage(5, "done");
          setVizComplete();
          renderBrief(message.brief);
          showScreen("output");
          inFlight = false;
          submit.disabled = false;
          return;
        }
      }
    }
  } catch (error) {
    showScreen("processing");
    if (errorState && errorMessage) {
      errorMessage.textContent = error.message || "The briefing failed.";
      errorState.hidden = false;
    }
    showBanner(error.message || "The briefing failed.");
  } finally {
    inFlight = false;
    submit.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Render output screen from backend brief
// ---------------------------------------------------------------------------

function renderBrief(brief) {
  // Header
  outSubject.textContent = brief.subject;
  outWith.textContent = brief.kind === "person" ? "Person" : "Company";
  outMeeting.textContent = formatWhen(brief.meeting);
  outPurpose.textContent = purposes[brief.purpose] || "General";
  outWindow.textContent = formatWindowRange(brief);

  // Executive summary
  outOneline.textContent = brief.oneLine || "—";

  // Findings
  outFindings.replaceChildren();
  if (!brief.findings || !brief.findings.length) {
    outNoFindings.hidden = false;
  } else {
    outNoFindings.hidden = true;
    brief.findings.forEach((finding, index) => {
      const row = el("article", "finding-item");
      const number = el("span", "finding-number", String(index + 1).padStart(2, "0"));
      const content = el("div", "finding-content");
      const header = el("div", "finding-header");
      const title = el("h3", "finding-title", finding.claim);
      const badge = el(
        "span",
        `confidence-badge ${finding.confidence}`,
        (finding.confidence || "partial").charAt(0).toUpperCase() + (finding.confidence || "partial").slice(1)
      );
      header.append(title, badge);

      const desc = el("p", "finding-description", finding.whyItMatters || "");

      const meta = el("div", "finding-meta");
      const dateSpan = el("time", "", finding.date ? formatDay(finding.date) : "date unknown");
      const sourceLink = el("a", "finding-source-link", finding.sourceTitle || "Source");
      sourceLink.href = finding.sourceUrl || "#";
      sourceLink.target = "_blank";
      sourceLink.rel = "noreferrer";
      meta.append(dateSpan, sourceLink);

      content.append(header, desc, meta);
      row.append(number, content);
      outFindings.append(row);
    });
  }

  // Discussion points
  outDiscussion.replaceChildren();
  for (const item of brief.discussionPoints || []) {
    outDiscussion.append(el("li", "", item));
  }

  // Open questions
  outQuestions.replaceChildren();
  for (const item of brief.openQuestions || []) {
    outQuestions.append(el("li", "", item));
  }

  // Held back
  if (brief.heldBack && brief.heldBack.length) {
    outHeldSection.hidden = false;
    outHeld.replaceChildren();
    for (const item of brief.heldBack) {
      const row = el("div", "held-item");
      row.append(el("div", "held-claim", item.claim));
      row.append(el("div", "held-reason", item.reason));
      outHeld.append(row);
    }
  } else {
    outHeldSection.hidden = true;
  }

  // Footer
  const credits =
    brief.searchDepth === "advanced" ? brief.searches.length * 2 : brief.searches.length;
  outFooter.textContent = `Tavily · ${brief.searches.length} searches · about ${credits} credits · Bifrost ${brief.bifrostHost} · ${brief.model} · ${brief.sourcesRead.length} sources read`;

  // Sources library — reset toggle state each render
  outSourceCount.textContent = String(brief.sourcesRead.length || 0);
  sourcesList.replaceChildren();
  if (brief.sourcesRead && brief.sourcesRead.length) {
    for (let i = 0; i < brief.sourcesRead.length; i++) {
      const source = brief.sourcesRead[i];
      const row = el("li", "source-item");
      const number = el("span", "source-number", String(i + 1).padStart(2, "0"));
      const titleLink = el("a", "source-title-link", source.title || source.url);
      titleLink.href = source.url;
      titleLink.target = "_blank";
      titleLink.rel = "noreferrer";
      const meta = el("span", "source-meta");
      const domain = extractDomain(source.url);
      const date = source.publishedDate ? formatDay(source.publishedDate) : "date unknown";
      meta.textContent = `${domain} · ${date}`;
      row.append(number, titleLink, meta);
      sourcesList.append(row);
    }
  }

  // Sources toggle (rebind cleanly)
  btnSourcesToggle.onclick = null;
  btnSourcesToggle.onkeydown = null;
  btnSourcesToggle.replaceChildren(
    el("h3", "", "Research Sources"),
    el("span", "sources-count", `${brief.sourcesRead.length || 0} SOURCES`),
    el("span", "sources-icon", "▾")
  );
  btnSourcesToggle.setAttribute("aria-expanded", "false");
  sourcesList.classList.remove("open");

  btnSourcesToggle.onclick = () => {
    const open = sourcesList.classList.toggle("open");
    btnSourcesToggle.setAttribute("aria-expanded", String(open));
  };
  btnSourcesToggle.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const open = sourcesList.classList.toggle("open");
      btnSourcesToggle.setAttribute("aria-expanded", String(open));
    }
  };
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

btnPrint.addEventListener("click", () => window.print());

btnCopy.addEventListener("click", async () => {
  const text = buildCopyText();
  try {
    await navigator.clipboard.writeText(text);
    const original = btnCopy.textContent;
    btnCopy.textContent = "Copied";
    setTimeout(() => (btnCopy.textContent = original), 1400);
  } catch {
    btnCopy.textContent = "Copy failed";
    setTimeout(() => (btnCopy.textContent = "Copy briefing"), 1400);
  }
});

btnNew.addEventListener("click", () => {
  showScreen("input");
  form.reset();
  setDefaultMeeting();
  hideSuggestions();
});

btnRetry.addEventListener("click", () => {
  errorState.hidden = true;
  showBanner("");
  submit.disabled = true;
  const data = Object.fromEntries(new FormData(form));
  fetch("/api/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, today: todayStamp() }),
  }).then(() => {
    submit.disabled = false;
  });
});

btnBackInput.addEventListener("click", () => {
  errorState.hidden = true;
  showScreen("input");
});

btnBackForm.addEventListener("click", () => {
  // Preserve existing form values — just return to input screen
  showScreen("input");
});

btnNew.addEventListener("click", () => {
  // Clear previous report and processing state, reset form, return to input
  outFindings.replaceChildren();
  outDiscussion.replaceChildren();
  outQuestions.replaceChildren();
  outHeld.replaceChildren();
  sourcesList.replaceChildren();
  outOneline.textContent = "—";
  outFooter.textContent = "";
  outSubject.textContent = "—";
  outWith.textContent = "—";
  outMeeting.textContent = "—";
  outPurpose.textContent = "—";
  outWindow.textContent = "—";
  outNoFindings.hidden = true;
  outHeldSection.hidden = true;
  outSourcesSection.hidden = true;
  outFooter.textContent = "";
  form.reset();
  setDefaultMeeting();
  hideSuggestions();
  showBanner("");
  showScreen("input");
});

btnClearForm.addEventListener("click", () => {
  form.reset();
  setDefaultMeeting();
  hideSuggestions();
  showBanner("");
});

// ---------------------------------------------------------------------------
// Copy text builder (mirrors backend toText)
// ---------------------------------------------------------------------------

function buildCopyText() {
  const lines = [
    `ANTE — ${outSubject.textContent}`,
    `${outWith.textContent} · ${outMeeting.textContent} · ${outPurpose.textContent}`,
    outWindow.textContent,
    "",
    outOneline.textContent,
    "",
    "FINDINGS",
  ];
  const rows = outFindings.querySelectorAll(".finding-item");
  rows.forEach((row) => {
    const title = row.querySelector(".finding-title");
    const why = row.querySelector(".finding-description");
    const sourceLink = row.querySelector(".finding-source-link");
    lines.push(`- ${title ? title.textContent : ""}`);
    if (why) lines.push(`  ${why.textContent}`);
    if (sourceLink) lines.push(`  ${sourceLink.textContent} — ${sourceLink.href}`);
  });
  lines.push("", "DISCUSSION POINTS");
  for (const li of outDiscussion.querySelectorAll("li")) lines.push(`- ${li.textContent}`);
  lines.push("", "OPEN QUESTIONS");
  for (const li of outQuestions.querySelectorAll("li")) lines.push(`- ${li.textContent}`);
  const heldRows = outHeld.querySelectorAll(".held-item");
  if (heldRows.length) {
    lines.push("", "HELD BACK");
    for (const row of heldRows) {
      const claim = row.querySelector(".held-claim");
      const reason = row.querySelector(".held-reason");
      lines.push(`- ${claim ? claim.textContent : ""} (${reason ? reason.textContent : ""})`);
    }
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function todayStamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Lightweight mirror of backend window math for the processing meta display
function researchWindowValues(meetingInput) {
  const meetingDay = String(meetingInput || "").slice(0, 10);
  const today = todayStamp();
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE.test(meetingDay) || !DATE.test(today)) return { start: today, end: today };
  const addDays = (ymd, days) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const start = addDays(meetingDay, -30);
  const end = meetingDay < today ? meetingDay : today;
  return { start, end, empty: start > end };
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

setDefaultMeeting();
loadHealth();