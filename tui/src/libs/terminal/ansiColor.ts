/** SGR reset — clears any foreground color set by {@link colorize}. */
export const RESET_SEQUENCE = '\u001B[0m';

/** Builds the truecolor SGR foreground sequence for a `#rrggbb` (or `#rgb`) hex color. */
export function foregroundSequence(hex: string): string {
  const { red, green, blue } = hexToRgb(hex);
  return `\u001B[38;2;${red};${green};${blue}m`;
}

/** Wraps `text` in a truecolor foreground sequence followed by a reset. */
export function colorize(text: string, hex: string): string {
  return `${foregroundSequence(hex)}${text}${RESET_SEQUENCE}`;
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const digits = hex.replace(/^#/, '');
  const expanded =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;
  const value = Number.parseInt(expanded, 16);

  return {
    red: (value >> 16) & 0xff,
    green: (value >> 8) & 0xff,
    blue: value & 0xff
  };
}
