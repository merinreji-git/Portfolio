(() => {
  const page = document.getElementById("murphysBookPage");
  const book = document.getElementById("murphysBook");
  const stage = document.getElementById("murphysBookStage");
  const previous = document.getElementById("murphysPrev");
  const next = document.getElementById("murphysNext");
  const status = document.getElementById("murphysPageStatus");
  const progress = document.getElementById("murphysProgressBar");

  if (!page || !book || !stage || !previous || !next || !status || !progress) return;

  const total = 13;
  const source = (number) =>
   `murphys-page-${String(number).padStart(2, "0")}.webp?v=2`;

  let current = 1;
  let turning = false;
  let touchStart = 0;

  for (let number = 2; number <= total; number += 1) {
    const image = new Image();
    image.src = source(number);
  }

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

    window.setTimeout(() => {
      current = newPage;
      page.src = source(current);
      page.alt =
        `Murphy's Ice Cream digital advertising strategy, page ${current} of ${total}`;
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

  page.addEventListener("error", () => {
    status.textContent = "Page image unavailable";
    previous.disabled = true;
    next.disabled = true;
  });

  updateControls();
})();
