const filterButtons = document.querySelectorAll(".filter-button");
const caseCards = document.querySelectorAll(".case-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    caseCards.forEach((card) => {
      const tags = card.dataset.tags?.split(" ") || [];
      const shouldShow = filter === "all" || tags.includes(filter);
      card.classList.toggle("hidden", !shouldShow);
    });
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

function animateCounter(element) {
  if (element.dataset.animated === "true") return;

  element.dataset.animated = "true";
  const target = Number.parseInt(element.dataset.count, 10);
  const suffix = element.dataset.suffix || "";
  const duration = 1500;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = `${current}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
      }
    });
  },
  { threshold: 0.45 }
);

document.querySelectorAll(".stat-num").forEach((counter) => {
  counterObserver.observe(counter);
});

const storyPages = Array.from({ length: 14 }, (_, index) => `assets/storybook-pages/erin-page-${String(index + 1).padStart(2, "0")}.webp`);
const storyPagesBase = document.getElementById("storyPagesBase");
const storyFixedLeft = document.getElementById("storyFixedLeft");
const storyPrev = document.getElementById("storyPrev");
const storyNext = document.getElementById("storyNext");
const storyStatus = document.getElementById("storyStatus");
const storyPageElements = [];
const storySpreadCount = Math.ceil(storyPages.length / 2);
let storySpread = 0;
let flipAudioContext;

function buildStorybook() {
  if (!storyPagesBase) return;

  Array.from({ length: storySpreadCount }, (_, spreadIndex) => {
    const rightIndex = spreadIndex * 2 + 1;
    const pagePath = storyPages[rightIndex];
    const nextPagePath = storyPages[rightIndex + 1];
    const frontFace = pagePath
      ? `<img src="${pagePath}" alt="ERIN Story page ${rightIndex + 1}">`
      : `<span class="story-blank-page" aria-hidden="true"></span>`;
    const backFace = nextPagePath
      ? `<img src="${nextPagePath}" alt="ERIN Story page ${rightIndex + 2}">`
      : `<span class="story-blank-page" aria-hidden="true"></span>`;
    const page = document.createElement("div");
    page.className = "storybook-page";
    page.style.zIndex = storySpreadCount - spreadIndex;
    page.innerHTML = `
      <div class="story-page-face front">
        ${frontFace}
      </div>
      <div class="story-page-face back">
        ${backFace}
      </div>
    `;
    storyPagesBase.appendChild(page);
    storyPageElements.push(page);
  });
}

function updateStorybook() {
  if (!storyStatus) return;

  storyPageElements.forEach((page, index) => {
    page.classList.toggle("flipped", index < storySpread);
  });

  const leftIndex = storySpread * 2;
  const rightIndex = leftIndex + 1;

  if (storyFixedLeft && storyPages[leftIndex]) {
    storyFixedLeft.src = storyPages[leftIndex];
    storyFixedLeft.alt = `ERIN Story page ${leftIndex + 1}`;
  }

  storyStatus.textContent = storyPages[rightIndex]
    ? `Pages ${leftIndex + 1}-${rightIndex + 1} / ${storyPages.length}`
    : `Page ${leftIndex + 1} / ${storyPages.length}`;

  if (storyPrev) storyPrev.disabled = storySpread === 0;
  if (storyNext) storyNext.disabled = storySpread >= storySpreadCount - 1;
}

function playPageFlipSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  flipAudioContext ||= new AudioContext();
  if (flipAudioContext.state === "suspended") {
    flipAudioContext.resume();
  }

  const duration = 0.09;
  const sampleRate = flipAudioContext.sampleRate;
  const buffer = flipAudioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    const progress = index / data.length;
    const fadeIn = Math.min(progress / 0.18, 1);
    const fadeOut = Math.pow(1 - progress, 2.8);
    const softNoise = (Math.random() * 2 - 1) * 0.035;
    const pageSweep = Math.sin(progress * Math.PI * 18) * 0.018;
    data[index] = (softNoise + pageSweep) * fadeIn * fadeOut;
  }

  const source = flipAudioContext.createBufferSource();
  const filter = flipAudioContext.createBiquadFilter();
  const gain = flipAudioContext.createGain();

  filter.type = "bandpass";
  filter.frequency.value = 1100;
  filter.Q.value = 0.7;
  gain.gain.value = 0.12;

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(flipAudioContext.destination);
  source.start();
}

buildStorybook();
updateStorybook();

storyPrev?.addEventListener("click", () => {
  if (storySpread > 0) {
    playPageFlipSound();
    storySpread -= 1;
    updateStorybook();
  }
});

storyNext?.addEventListener("click", () => {
  if (storySpread < storySpreadCount - 1) {
    playPageFlipSound();
    storySpread += 1;
    updateStorybook();
  }
});

const salesBrochurePages = Array.from(document.querySelectorAll("#salesBrochurePages img"));
const salesBrochurePrev = document.getElementById("salesBrochurePrev");
const salesBrochureNext = document.getElementById("salesBrochureNext");
const salesBrochureStatus = document.getElementById("salesBrochureStatus");
let salesBrochureIndex = 0;

function updateSalesBrochure() {
  if (!salesBrochurePages.length || !salesBrochureStatus) return;

  salesBrochurePages.forEach((page, index) => {
    page.classList.toggle("active", index === salesBrochureIndex);
  });

  salesBrochureStatus.textContent = `Page ${salesBrochureIndex + 1} / ${salesBrochurePages.length}`;
  if (salesBrochurePrev) salesBrochurePrev.disabled = salesBrochureIndex === 0;
  if (salesBrochureNext) salesBrochureNext.disabled = salesBrochureIndex === salesBrochurePages.length - 1;
}

updateSalesBrochure();

salesBrochurePrev?.addEventListener("click", () => {
  if (salesBrochureIndex > 0) {
    salesBrochureIndex -= 1;
    updateSalesBrochure();
  }
});

salesBrochureNext?.addEventListener("click", () => {
  if (salesBrochureIndex < salesBrochurePages.length - 1) {
    salesBrochureIndex += 1;
    updateSalesBrochure();
  }
});

const magazinePages = Array.from({ length: 12 }, (_, index) => `assets/magazine-pages/aunua-magazine-page-${String(index + 1).padStart(2, "0")}.webp`);
const digitalMagazineSpread = document.getElementById("digitalMagazineSpread");
const digitalMagazineLeft = document.getElementById("digitalMagazineLeft");
const digitalMagazineRight = document.getElementById("digitalMagazineRight");
const digitalMagazinePrev = document.getElementById("digitalMagazinePrev");
const digitalMagazineNext = document.getElementById("digitalMagazineNext");
const digitalMagazineStatus = document.getElementById("digitalMagazineStatus");
let digitalMagazineSpreadIndex = 0;
let digitalMagazineIsTurning = false;

function updateDigitalMagazine() {
  if (!digitalMagazineLeft || !digitalMagazineRight || !digitalMagazineStatus) return;

  const maxSpreadIndex = Math.max(0, Math.ceil(magazinePages.length / 2) - 1);
  digitalMagazineSpreadIndex = Math.min(Math.max(digitalMagazineSpreadIndex, 0), maxSpreadIndex);
  const leftIndex = digitalMagazineSpreadIndex * 2;
  const rightIndex = leftIndex + 1;
  digitalMagazineLeft.src = magazinePages[leftIndex];
  digitalMagazineLeft.alt = `AUNUA magazine page ${leftIndex + 1}`;
  if (magazinePages[rightIndex]) {
    digitalMagazineRight.src = magazinePages[rightIndex];
    digitalMagazineRight.alt = `AUNUA magazine page ${rightIndex + 1}`;
    digitalMagazineRight.hidden = false;
    digitalMagazineStatus.textContent = `Pages ${leftIndex + 1}-${rightIndex + 1} / ${magazinePages.length}`;
  } else {
    digitalMagazineRight.hidden = true;
    digitalMagazineStatus.textContent = `Page ${leftIndex + 1} / ${magazinePages.length}`;
  }

  if (digitalMagazinePrev) digitalMagazinePrev.disabled = digitalMagazineSpreadIndex === 0;
  if (digitalMagazineNext) digitalMagazineNext.disabled = digitalMagazineSpreadIndex >= maxSpreadIndex;
}

function turnDigitalMagazine(direction) {
  if (!digitalMagazineSpread || digitalMagazineIsTurning) return;
  const maxSpreadIndex = Math.max(0, Math.ceil(magazinePages.length / 2) - 1);
  const nextSpreadIndex = Math.min(Math.max(digitalMagazineSpreadIndex + direction, 0), maxSpreadIndex);
  if (nextSpreadIndex === digitalMagazineSpreadIndex) {
    updateDigitalMagazine();
    return;
  }

  digitalMagazineIsTurning = true;
  digitalMagazineSpread.classList.add("turning");
  window.setTimeout(() => {
    digitalMagazineSpreadIndex = nextSpreadIndex;
    updateDigitalMagazine();
    digitalMagazineSpread.classList.remove("turning");
    digitalMagazineIsTurning = false;
  }, 180);
}

updateDigitalMagazine();

digitalMagazinePrev?.addEventListener("click", () => {
  if (digitalMagazineSpreadIndex > 0) {
    turnDigitalMagazine(-1);
  }
});

digitalMagazineNext?.addEventListener("click", () => {
  if (digitalMagazineSpreadIndex < Math.ceil(magazinePages.length / 2) - 1) {
    turnDigitalMagazine(1);
  }
});

const modal = document.getElementById("flipbookModal");
const viewer = document.getElementById("flipbookViewer");
const title = document.getElementById("flipbookTitle");
const pageStatus = document.getElementById("pageStatus");
const directLink = document.getElementById("openPdfDirect");
const closeButton = document.getElementById("closeFlipbook");
const prevButton = document.getElementById("prevPage");
const nextButton = document.getElementById("nextPage");

let pdfDocument = null;
let currentPage = 1;
let totalPages = 1;
let activePdfPath = "";
let pdfjsLibModule = null;

function setPlaceholder(message) {
  viewer.innerHTML = `<div class="flip-page"><p class="flip-placeholder">${message}</p></div>`;
  pageStatus.textContent = "Page 1";
}

async function renderPage(pageNumber) {
  const pageShell = document.querySelector(".flip-page");
  if (pageShell) {
    pageShell.classList.add("turning");
  }

  setTimeout(async () => {
    if (!pdfDocument) {
      setPlaceholder("This piece is being prepared for the flipbook shelf.");
      return;
    }

    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    viewer.innerHTML = "";
    const pageWrap = document.createElement("div");
    pageWrap.className = "flip-page";
    pageWrap.appendChild(canvas);
    viewer.appendChild(pageWrap);
    pageStatus.textContent = `Page ${currentPage} of ${totalPages}`;
  }, 160);
}

async function openFlipbook(card) {
  activePdfPath = card.dataset.pdf;
  title.textContent = card.dataset.title || "PDF Work";
  directLink.href = activePdfPath;
  currentPage = 1;
  totalPages = 1;
  pdfDocument = null;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  setPlaceholder("Opening the piece...");

  try {
    if (!pdfjsLibModule) {
      pdfjsLibModule = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs");
    }

    pdfjsLibModule.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs";

    pdfDocument = await pdfjsLibModule.getDocument(activePdfPath).promise;
    totalPages = pdfDocument.numPages;
    await renderPage(currentPage);
  } catch (error) {
    setPlaceholder("This piece is being prepared for the flipbook shelf.");
  }
}

document.querySelectorAll(".open-flipbook").forEach((button) => {
  button.addEventListener("click", () => {
    openFlipbook(button.closest(".flipbook-card"));
  });
});

closeButton.addEventListener("click", () => {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
});

prevButton.addEventListener("click", async () => {
  if (!pdfDocument || currentPage <= 1) return;
  currentPage -= 1;
  await renderPage(currentPage);
});

nextButton.addEventListener("click", async () => {
  if (!pdfDocument || currentPage >= totalPages) return;
  currentPage += 1;
  await renderPage(currentPage);
});

document.addEventListener("keydown", (event) => {
  if (!modal.classList.contains("active")) return;

  if (event.key === "Escape") {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  if (event.key === "ArrowLeft") {
    prevButton.click();
  }

  if (event.key === "ArrowRight") {
    nextButton.click();
  }
});
