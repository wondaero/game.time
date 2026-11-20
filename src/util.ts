export const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
