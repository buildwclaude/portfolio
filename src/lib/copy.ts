/**
 * Buttons that copy a value ([data-copy]): a click puts it on the clipboard
 * and the button's label ([data-copy-label]) says "Copied ✓" for a moment.
 * Where the clipboard is out of reach, it opens the mail app instead.
 */
export function initCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
    const value = button.dataset.copy || '';
    const label = button.querySelector<HTMLElement>('[data-copy-label]');
    let timer = 0;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        if (value.includes('@')) location.href = `mailto:${value}`;
        return;
      }
      if (!label) return;
      window.clearTimeout(timer);
      label.textContent = 'Copied ✓';
      button.classList.add('is-copied');
      timer = window.setTimeout(() => {
        label.textContent = value;
        button.classList.remove('is-copied');
      }, 1600);
    });
  });
}
