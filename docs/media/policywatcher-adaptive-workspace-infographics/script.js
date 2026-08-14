const slides = Array.from(document.querySelectorAll('.infographic'));
const buttons = Array.from(document.querySelectorAll('[data-goto]'));
const prevButton = document.getElementById('prevSlide');
const nextButton = document.getElementById('nextSlide');
const autoplayToggle = document.getElementById('autoplayToggle');
const slideNumber = document.getElementById('slideNumber');
const progressBar = document.querySelector('.progress-bar');

let activeIndex = 0;
let autoplay = true;
let timer = null;
const slideDurationMs = 8200;

function restartAnimations(slide) {
  slide.getAnimations({ subtree: true }).forEach((animation) => {
    try {
      animation.cancel();
      animation.play();
    } catch {
      // Animation control is progressive enhancement only.
    }
  });
}

function setSlide(index) {
  activeIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeIndex;
    slide.classList.toggle('active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
    if (isActive) restartAnimations(slide);
  });

  buttons.forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.goto) === activeIndex);
  });

  slideNumber.textContent = String(activeIndex + 1).padStart(2, '0');
  document.title = `PolicyWatcher Objective Composer – ${slides[activeIndex].getAttribute('aria-label')}`;
  progressBar.style.transform = `translateX(${activeIndex * 100}%)`;
  resetTimer();
}

function resetTimer() {
  if (timer) window.clearInterval(timer);
  if (!autoplay) return;
  timer = window.setInterval(() => setSlide(activeIndex + 1), slideDurationMs);
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    setSlide(Number(button.dataset.goto));
  });
});

prevButton.addEventListener('click', () => setSlide(activeIndex - 1));
nextButton.addEventListener('click', () => setSlide(activeIndex + 1));

autoplayToggle.addEventListener('click', () => {
  autoplay = !autoplay;
  autoplayToggle.setAttribute('aria-pressed', String(autoplay));
  autoplayToggle.textContent = autoplay ? 'Auto-play' : 'Manual';
  resetTimer();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    setSlide(activeIndex + 1);
  }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    setSlide(activeIndex - 1);
  }
  if (event.key.toLowerCase() === ' ') {
    event.preventDefault();
    autoplayToggle.click();
  }
});

setSlide(0);
