import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/build/pdf.worker.mjs";

const canvas = document.getElementById("murphysBookPage");
const book = document.getElementById("murphysBook");
const stage = document.getElementById("murphysBookStage");
const previous = document.getElementById("murphysPrev");
const next = document.getElementById("murphysNext");
const status = document.getElementById("murphysPageStatus");
const progress = document.getElementById("murphysProgressBar");

if (canvas && book && stage && previous && next && status && progress) {
  const pdfPath = "./Untitled%20design.pdf";
  const context = canvas.getContext("2d");
  let documentPdf;
  let current = 1;
  let total = 13;
  let turning = false;
  let touchStart = 0;
  let renderTask;

  const renderPage = async (pageNumber) => {
    const pdfPage = await documentPdf.getPage(pageNumber);
    const baseViewport = pdfPage.getViewport({ scale: 1 });
    const displayWidth = Math.max(book.clientWidth, 320);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const scale = (displayWidth / baseViewport.width) * pixelRatio;
    const viewport = pdfPage.getViewport({ scale });

    if (renderTask) {
      try {
        renderTask.cancel();
      } catch {
        // The previous render may already be complete.
      }
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

    renderTask = pdfPage.render({ canvasContext: context, viewport });
    await renderTask.promise;
    canvas.setAttribute(
      "aria-label",
      `Murphy's Ice Cream digital advertising strategy, page ${pageNumber} of ${total}`
    );
  };

  const updateControls = () => {
    status.textContent = `${String(current).padStart(2, "0")} / ${total}`;
    progress.style.width = `${(current / total) * 100}%`;
    previous.disabled = current === 1;
    next.disabled = current === total;
  };

  const update = (newPage, direction) => {
    if (turning || newPage < 1 || newPage > total || newPage === current) return;
    turning = true;
    book.classList.remove("turn-next", "turn-prev");
    void book.offsetWidth;
    book.classList.add(direction === "next" ? "turn-next" : "turn-prev");

    window.setTimeout(async () => {
      current = newPage;
      await renderPage(current);
      updateControls();
    }, 285);

    window.setTimeout(() => {
      book.classList.remove("turn-next", "turn-prev");
      turning = false;
    }, 650);
  };

  previous.addEventListener("click", () => update(current - 1, "prev"));
  next.addEventListener("click", () => update(current + 1, "next"));

  stage.addEventListener(
    "touchstart",
    (event) => {
      touchStart = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchend",
    (event) => {
      const distance = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(distance) < 45) return;
      update(current + (distance < 0 ? 1 : -1), distance < 0 ? "next" : "prev");
    },
    { passive: true }
  );

  document.addEventListener("keydown", (event) => {
    const bounds = stage.getBoundingClientRect();
    const visible = bounds.top < window.innerHeight && bounds.bottom > 0;
    if (!visible) return;
    if (event.key === "ArrowRight") update(current + 1, "next");
    if (event.key === "ArrowLeft") update(current - 1, "prev");
  });

  try {
    documentPdf = await pdfjsLib.getDocument(pdfPath).promise;
    total = documentPdf.numPages;
    await renderPage(current);
    updateControls();
  } catch (error) {
    console.error("Murphy's strategy PDF could not be loaded.", error);
    status.textContent = "PDF unavailable";
    previous.disabled = true;
    next.disabled = true;
  }
}
