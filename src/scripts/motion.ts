// Header state, text track drift and section reveal. All of it is an extra:
// the page is complete without this file.
import { headerScrolled, relativeShift, trackShift } from '../lib/motion';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector<HTMLElement>('[data-header]');
const tracks = Array.from(document.querySelectorAll<HTMLElement>('[data-track]'));
const bases = new Map<HTMLElement, number>();

let queued = false;

function update(): void {
  queued = false;
  header?.classList.toggle('is-scrolled', headerScrolled(window.scrollY));
  for (const track of tracks) {
    if (reduced.matches) {
      track.style.removeProperty('--track-shift');
      continue;
    }
    const box = track.getBoundingClientRect();
    const inView = box.bottom >= 0 && box.top <= window.innerHeight;
    const raw = trackShift(box.top, box.height, window.innerHeight);
    if (!bases.has(track)) bases.set(track, inView ? raw : 0);
    if (!inView) continue;
    const shift = relativeShift(raw, bases.get(track) ?? 0);
    track.style.setProperty('--track-shift', `${shift.toFixed(1)}px`);
  }
}

function queue(): void {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(update);
}

window.addEventListener('scroll', queue, { passive: true });
window.addEventListener('resize', queue, { passive: true });
reduced.addEventListener('change', queue);
update();

// Fonts change the height of a headline. Measure the starting point again once they are in.
void document.fonts.ready.then(() => {
  bases.clear();
  queue();
});

// Sections that start below the fold fade up once. Sections already on screen are left alone,
// so nothing flickers.
if (!reduced.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  for (const element of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (element.getBoundingClientRect().top < window.innerHeight) continue;
    element.classList.add('reveal-pending');
    observer.observe(element);
  }
}
