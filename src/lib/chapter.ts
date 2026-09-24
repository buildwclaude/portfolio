/** The id of a `records` group's section on the About page (#me). */
export function chapterId(label: string) {
  return `me-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
}
