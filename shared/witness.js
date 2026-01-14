// shared/witness.js
(function () {
  const slug = location.pathname.split("/").filter(Boolean).pop(); // .../getuige/jan/ -> "jan"
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
  const btnApp = document.getElementById("btnApp");

  const popLayer = document.getElementById("popLayer");

  if (!cfg) {
    // fallback
    bg.style.backgroundImage = "linear-gradient(135deg, #333, #111)";
    kicker.textContent = "Oeps…";
    sub.textContent = "Deze getuigenpagina bestaat (nog) niet.";
  } else {
    
    // static background (no photos)
    bg.style.backgroundImage = "linear-gradient(160deg, #3a3a3a, #1f1f1f)";

    document.title = `Getuige? – ${cfg.name}`;
    kicker.textContent = `Hey ${cfg.name}…`;
    sub.textContent = cfg.subtitle || "";
    btnYes.textContent = cfg.yesText || "JA";
    btnNo.textContent = cfg.noText || "NEE";
  }

    // Intro countdown + typewriter
  const lines = [
    "SVI wint altie instellen…",
    "Alle vakanties laden…",
    "ERROR: Te veel hoogtepunten…",
    "ALLES 500…",
    "The Hulk is Unleashed in…"
  ];

  let countdown = 5;
  let currentLine = 0;

  function setCountdown() {
    countdownEl.textContent = String(countdown);
  }

  function typeLine(text, done) {
    let i = 0;
    const prefix = "> ";
    termBody.textContent += (termBody.textContent ? "\n" : "") + prefix;

    const iv = setInterval(() => {
      termBody.textContent += text[i] || "";
      i++;
      if (i >= text.length) {
        clearInterval(iv);
        done && done();
      }
    }, 18); // typing speed
  }

  function runIntro() {
    termBody.textContent = "";
    setCountdown();

    const countdownTimer = setInterval(() => {
      countdown--;
      setCountdown();
      if (countdown <= 0) clearInterval(countdownTimer);
    }, 1000);

    function next() {
      if (currentLine >= lines.length) {
        // small dramatic pause before reveal
        setTimeout(() => {
          intro.style.display = "none";
          main.classList.remove("hidden");
        }, 350);
        return;
      }

      typeLine(lines[currentLine], () => {
        currentLine++;
        // small pause between lines
        setTimeout(next, 180);
      });
    }

    next();
  }

  runIntro();


  // MS-DOS popup flow for NEE
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
  pop.className = "popup";

  // 1) Eerst de inhoud zetten (anders is rect.width/height ~ 0)
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

  // On the final step -> make it JA/JA
  if (step === noFlow.length - 1) {
    const btns = pop.querySelectorAll(".pbtn");
    btns.forEach((b) => (b.textContent = "JA"));
    btns.forEach((b) => b.setAttribute("data-ans", "yes"));
  }

  // 2) Append naar DOM zodat we kunnen meten
  popLayer.appendChild(pop);

  // 3) Positioneer binnen viewport (mobile-safe)
  const margin = 12; // px safe padding from edges
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = pop.getBoundingClientRect();

  const maxLeft = Math.max(margin, vw - rect.width - margin);
  const maxTop  = Math.max(margin, vh - rect.height - margin);

  const left = Math.floor(margin + Math.random() * (maxLeft - margin));
  const top  = Math.floor(margin + Math.random() * (maxTop - margin));

  pop.style.left = `${left}px`;
  pop.style.top  = `${top}px`;

  // Bring to front
  pop.style.zIndex = String(1000 + step);

  // 4) Button handlers
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
     // Hide the main choice buttons immediately
    const actions = document.querySelector(".actions");
    if (actions) actions.style.display = "none";

    // Also make sure the buttons can't be clicked again
    btnYes.disabled = true;
    btnNo.disabled = true;

    // Hide any remaining popups (if any)
    popLayer.innerHTML = "";

    // Show result
    result.classList.remove("hidden");

    // Little confetti without libs (tiny)
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

  btnYes.addEventListener("click", acceptYes);
  btnNo.addEventListener("click", () => {
    const actions = document.querySelector(".actions");
    if (actions) actions.style.display = "none";
    btnYes.disabled = true;
    btnNo.disabled = true;
    spawnPopup(noStep);
});
})();
