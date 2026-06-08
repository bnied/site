// Pure cursor-positioning logic (no DOM). The visible block cursor is placed
// by measuring a hidden mirror of the input text; its width is the cursor's
// horizontal offset. To track the caret (not just the end of the line), the
// mirror holds only the text up to the caret.

// Text whose rendered width equals the cursor's horizontal offset: the value
// up to the caret. Falls back to the full value when the caret position is
// unknown (e.g. null selectionStart on an unfocused field).
export function cursorSizerText(value, caret) {
  return value.slice(0, caret ?? value.length);
}
