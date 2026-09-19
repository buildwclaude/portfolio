/**
 * A 30-line HTML template helper.
 *
 * Interpolated values are escaped by default; arrays are joined; `false`,
 * `null` and `undefined` render as nothing. Wrap a value in `raw()` to opt
 * out of escaping — which is how components nest inside each other.
 */

export type Html = { readonly __html: string };

const RAW = Symbol.for('html.raw');

export function raw(value: string): Html {
  return { __html: value, [RAW]: true } as Html;
}

function isHtml(value: unknown): value is Html {
  return typeof value === 'object' && value !== null && '__html' in value;
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render(value: unknown): string {
  if (value === null || value === undefined || value === false) return '';
  if (isHtml(value)) return value.__html;
  if (Array.isArray(value)) return value.map(render).join('');
  return escape(String(value));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + (strings[i + 1] ?? '');
  }
  return raw(out);
}
