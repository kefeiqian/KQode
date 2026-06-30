export const PROMPT_PREFIX = '> ';
// The app renders just under fullscreen (see FULLSCREEN_GUARD_ROWS), so Ink
// appends a trailing newline each frame and its cursor baseline lands exactly on
// the output's bottom row. The measured composer top therefore maps straight to
// the editable row with no extra origin offset. (This was 1 while the app filled
// the terminal exactly, where Ink omits the trailing newline and shifts the
// baseline up one row.) NOTE: this assumes a non-fullscreen frame; below ~11 rows
// the MIN_ROWS floor can re-enter fullscreen and make this off by one — a
// degenerate, already-unusable terminal size.
export const INK_CURSOR_ROW_ORIGIN_OFFSET = 0;
export const COMPOSER_BACKGROUND_PADDING_ROWS = 2;
export const COMPOSER_BACKGROUND_TOP_PADDING_ROWS = 1;

export const MODIFIED_ENTER_INPUTS = new Set([
  '\u001B[13;2u',
  '\u001B[13;3u',
  '\u001B[13;5u',
  '\u001B[13;6u'
]);
