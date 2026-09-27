// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('reduced motion', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <header data-header></header>
      <div data-track style="--track-shift: 20px"></div>
      <section data-reveal></section>
    `;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    });
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: new Promise<void>(() => {}) },
    });
    Object.defineProperty(window, 'requestAnimationFrame', { configurable: true, value: vi.fn() });
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('IntersectionObserver must not run under reduced motion');
      }),
    });
  });

  it('removes track movement and never hides reveal sections', async () => {
    await import('../../src/scripts/motion.ts');
    expect(document.querySelector<HTMLElement>('[data-track]')?.style.getPropertyValue('--track-shift')).toBe('');
    expect(document.querySelector('[data-reveal]')?.classList.contains('reveal-pending')).toBe(false);
    expect(window.IntersectionObserver).not.toHaveBeenCalled();
  });
});
