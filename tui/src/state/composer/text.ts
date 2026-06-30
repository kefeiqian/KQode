export const PROMPT_MAX_BYTES = 64 * 1024;

type SubmitValidation =
  | { ok: true; text: string }
  | { ok: false; reason: 'empty' | 'over-limit'; message: string };

const textEncoder = new TextEncoder();

export function printableInput(input: string): string {
  return input.replace(/[\u0000-\u001f\u007f]/g, '');
}

export function validateComposerSubmit(
  text: string,
  maxBytes = PROMPT_MAX_BYTES
): SubmitValidation {
  if (text.trim().length === 0) {
    return {
      ok: false,
      reason: 'empty',
      message: ''
    };
  }

  const limitMessage = overLimitMessage(text, maxBytes);
  if (limitMessage !== null) {
    return {
      ok: false,
      reason: 'over-limit',
      message: limitMessage
    };
  }

  return {
    ok: true,
    text
  };
}

export function overLimitMessage(text: string, maxBytes: number): string | null {
  const byteLength = textEncoder.encode(text).length;
  if (byteLength <= maxBytes) {
    return null;
  }

  return `Prompt is ${byteLength} bytes; maximum is ${maxBytes} bytes.`;
}
