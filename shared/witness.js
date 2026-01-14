// shared/witness.js
(function () {
  const slug = location.pathname.split("/").filter(Boolean).pop();
  const cfg = (window.WITNESSES && window.WITNESSES[slug]) || null;

  const bg = document.getElementById("bg");
  const intro = document.getElementById("intro");
  const main = document.getElementById("main");
  const termBody = document.getElementById("termBody");
  const countdownEl = document.getElementById("countdown");

  const kicker = document.getElementById("kicker");
  const title = document.getElementById("title");
  const sub = document.getElementById("sub");
  const btnYes = document.getElementById("btnYes");
  const btnNo = document.getElementById("btnNo");

  const result = document.getElementById("result");
  const popLayer = document.getElementById("popLayer");

  const memSection = document.getElementById("memories");
  const memImg = document.getElementById("memImg");

  // ---------- Init UI (refresh-safe) ----------
  // background + copy
  bg.style.backgroundImage = "linear-gradient(160deg, #3a3a3a, #1f1f1f)";
  popLayer.style.pointerEvents = "none";

  if (!cfg) {
    kicker.textContent = "Oeps…";
    sub.textContent = "Deze getuigenpagina bestaat (nog) niet.";
  } else {
    document.title = `Getuige? – ${cfg.name}`;
    kicker.textContent = `Hey ${cfg.name}…`;
    sub.textContent = cfg.subtitle || "";
    btnYes.textContent = cfg.yesText || "JA";
    btnNo.textContent = cfg.noText || "NEE";
  }

  // Reset screen states
  // memories visible by default, intro visible, main hidden
  if (memSection) {
    memSection.classList.remove("hidden", "fade-out", "fade-in");
    memSection.classList.add("fade-in");
  }
  intro.classList.remove("gone", "hidden", "fade-out");
  intro.classList.add("fade-in");

  if (memSection) memSection.classList.remove("gone");
  
  main.classList.add("hidden");
  main.classList.remove("fade-in", "fade-out");
  result.classList.add("hidden");

  // Reset buttons state
  btnYes.disabled = false;
  btnNo.disabled = false;
  const actionsEl = document.querySelector(".actions");
  if (actionsEl) actionsEl.style.display = "";

  // ---------- Helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function typeLineInto(el, prefix, text, charDelay = 50) {
    return new Promise((resolve) => {
      let i = 0;
      el.textContent += (el.textContent ? "\n" : "") + prefix;
      const iv = setInterval(() => {
        el.textContent += text[i] || "";
        i++;
        if (i >= text.length) {
          clearInterval(iv);
          resolve();
        }
      }, charDelay);
    });
  }

  function typeInline(el, text, charDelay = 75) {
    return new Promise((resolve) => {
      el.textContent = "";
      let i = 0;
      const iv = setInterval(() => {
        el.textContent += text[i] || "";
        i++;
        if (i >= text.length) {
          clearInterval(iv);
          resolve();
        }
      }, charDelay);
    });
  }

  async function runMemories() {
    const imgs = cfg?.memories;
    if (!memSection || !memImg || !Array.isArray(imgs) || imgs.length === 0) {
      if (memSection) memSection.classList.add("hidden");
      return;
    }

    // preload light
    imgs.forEach((src) => { const im = new Image(); im.src = src; });

    const show = (src) => {
      memImg.src = src;
      memImg.classList.remove("mem-flash");
      void memImg.offsetWidth;
      memImg.classList.add("mem-flash");
    };
    
    const flashEveryMs = 720;
    
    // Show each image exactly once
    for (let i = 0; i < imgs.length; i++) {
      show(imgs[i]);
      await sleep(flashEveryMs);
    }


    // fade memories out
    memSection.classList.remove("fade-in");
    memSection.classList.add("fade-out");
    await sleep(420);
    memSection.classList.add("gone");
    memSection.classList.add("hidden");
  }

  async function runIntro() {
    termBody.textContent = "";
    const lines = [
      "SVI wint altie instellen…",
      "Alle vakanties laden…",
      "ERROR: Te veel hoogtepunten…",
      "ALLES 500…",
      "The Hulk is Unleashed in…"
    ];

    // countdown + typing in parallel
    let countdown = 5;
    countdownEl.textContent = String(countdown);

    let countdownDone = false;
    const countdownPromise = new Promise((resolve) => {
      const t = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          countdown = 0;
          countdownEl.textContent = "0";
          clearInterval(t);
          countdownDone = true;
          resolve();
          return;
        }
        countdownEl.textContent = String(countdown);
      }, 1000);
    });

    const typingPromise = (async () => {
      for (const line of lines) {
        await typeLineInto(termBody, "> ", line, 50);
        await sleep(220);
      }
    })();

    await Promise.all([countdownPromise, typingPromise]);
    // small pause for drama
    await sleep(250);
  }

  async function revealQuestion() {
  // fade intro out
  intro.classList.remove("fade-in");
  intro.classList.add("fade-out");
  await sleep(420);

  // NOW remove intro from layout so main sits at top (no scrolling)
  intro.classList.add("gone");

  // show main + fade in
  main.classList.remove("hidden");
  main.classList.remove("fade-out");
  main.classList.add("fade-in");

  // hide buttons until question typed
  const actions = document.querySelector(".actions");
  if (actions) actions.style.display = "none";

  // type question
  await typeInline(title, "Wil jij mijn getuige zijn?", 75);

  // show buttons
  if (actions) actions.style.display = "";
}



  // ---------- MS-DOS popup flow ----------
  const noFlow = [
    { title: "Windows", msg: "Je bedoelde eigenlijk JA toch?" },
    { title: "Systeemmelding", msg: "Hmm… dat voelde niet als de juiste klik." },
    { title: "Fout", msg: "NEE.exe not found. Probeer opnieuw." },
    { title: "Waarschuwing", msg: "Nu klik je volgens mij niet helemaal goed." },
    { title: "Diagnose", msg: "Weet je het héél zeker? (hint: nee)" },
    { title: "Rik", msg: "Rik kijkt nu teleurgesteld. Dit wil je niet." },
    { title: "Laatste kans", msg: "Oké. Echte laatste kans. Kies verstandig." },
    { title: "Update", msg: "Keuzemenu bijgewerkt: alleen JA is beschikbaar." },
  ];
  let noStep = 0;

  function spawnPopup(step) {
    const { title, msg } = noFlow[step];
    const pop = document.createElement("div");
    popLayer.style.pointerEvents = "auto";
    pop.className = "popup";

    pop.innerHTML = `
      <div class="bar">
        <span>${title}</span>
        <span style="opacity:.85">✕</span>
      </div>
      <div class="body">${msg}</div>
      <div class="pactions">
        <button class="pbtn" data-ans="yes">JA</button>
        <button class="pbtn" data-ans="no">NEE</button>
      </div>
    `;

    if (step === noFlow.length - 1) {
      const btns = pop.querySelectorAll(".pbtn");
      btns.forEach((b) => (b.textContent = "JA"));
      btns.forEach((b) => b.setAttribute("data-ans", "yes"));
    }

    popLayer.appendChild(pop);
    popLayer.style.zIndex = "9999";

    // position within viewport
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = pop.getBoundingClientRect();

    const maxLeft = Math.max(margin, vw - rect.width - margin);
    const maxTop = Math.max(margin, vh - rect.height - margin);

    const left = Math.floor(margin + Math.random() * (maxLeft - margin));
    const top = Math.floor(margin + Math.random() * (maxTop - margin));

    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.zIndex = String(1000 + step);

    pop.querySelectorAll(".pbtn").forEach((b) => {
      b.addEventListener("click", () => {
        const ans = b.getAttribute("data-ans");
        if (ans === "yes") {
          pop.remove();
          acceptYes();
        } else {
          pop.remove();
          noStep = Math.min(noStep + 1, noFlow.length - 1);
          spawnPopup(noStep);
        }
      });
    });
  }

  function acceptYes() {
    const actions = document.querySelector(".actions");
    if (actions) actions.style.display = "none";
    btnYes.disabled = true;
    btnNo.disabled = true;
    popLayer.innerHTML = "";
    popLayer.style.pointerEvents = "none";

    result.classList.remove("hidden");
    result.classList.add("fade-in");

    // confetti
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("div");
      s.style.position = "fixed";
      s.style.left = Math.random() * 100 + "vw";
      s.style.top = "-10px";
      s.style.width = "8px";
      s.style.height = "8px";
      s.style.background = "white";
      s.style.opacity = "0.9";
      s.style.borderRadius = "2px";
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      s.style.zIndex = "9999";
      document.body.appendChild(s);

      const dur = 900 + Math.random() * 900;
      const endY = 110 + Math.random() * 20;
      s.animate(
        [
          { transform: s.style.transform, top: "-10px" },
          { transform: `rotate(${Math.random() * 360}deg)`, top: endY + "vh" },
        ],
        { duration: dur, easing: "cubic-bezier(.2,.7,.2,1)" }
      ).onfinish = () => s.remove();
    }
  }

  // Hook buttons
  btnYes.addEventListener("click", acceptYes);
  btnNo.addEventListener("click", () => {
    const actions = document.querySelector(".actions");
    if (actions) actions.style.display = "none";
    btnYes.disabled = true;
    btnNo.disabled = true;
    spawnPopup(noStep);
  });

  // ---------- Run flow ----------
  (async () => {
    await runMemories();
    await runIntro();
    await revealQuestion();
  })();
})();
