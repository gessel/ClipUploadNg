// Imported from Senliang Hao's sailing knowledge ink, with slight modifications - such as removing currpos

// TODO: Convert everything to a factory pattern

// TODO: Merge with the class editor attachment code into a separate library due to some confusion

// Handle mw text
let mwEditor; // Global mw editor

// It would be great to encapsulate this as a sub-function

// Get the text before the cursor
function getTextBeforeCursor() {
  const editor = getEditor();
  const startPos = editor.selectionStart;
  return editor.value.substring(0, startPos);
}

// Get the text after the cursor
function getTextAfterCursor() {
  const editor = getEditor();
  const endPos = editor.selectionEnd;
  return editor.value.substring(endPos, editor.value.length);
}

// Get all the text
function getAllText() {
  const editor = getEditor();
  return editor.value;
}

// Get the editor, can be cached
// Using its value, you can directly get the content - what an old discovery!
function getEditor() {
  if (typeof mwEditor === 'undefined') {
    return document.getElementById('wpTextbox1');
  } else {
    return mwEditor; // Return the cached editor
  }
}

// Check if the cursor is in a new line
function isInNewLine() {
  // If there is a newline character, then it is
  if (getTextBeforeCursor().length === 0) {
    return true; // First line, pass
  }
  return getTextBeforeCursor()[getTextBeforeCursor().length - 1].search(/[\r\n]/) > -1;
}

// Start manipulating the ink, simplifying the logic, here we only handle normal ink, deal with the rest yourself
function inkGo(ink) {
  const br = '\n'; // Line break character

  if (getEditor() === null) {
    return false; // Invalid editor, go home
  }

  // Consider line breaks here
  if (!isInNewLine()) {
    ink = br + ink;
  }

  // Alright, inject the ink
  injectInk(ink);
}

// Write text at the current cursor position
function injectInk(ink) {
  const editor = getEditor();
  const textScroll = editor.scrollTop; // Save textarea scroll position
  let selText = '';
  let mousePos = 0; // Cursor position handling

  // Get current selection
  editor.focus();
  const startPos = editor.selectionStart;
  const endPos = editor.selectionEnd;
  mousePos = startPos + ink.length; // Initialize position + length

  selText = editor.value.substring(startPos, endPos);

  // Insert tags?
  let tagClose = '';
  if (selText.charAt(selText.length - 1) === ' ') {
    // Exclude trailing whitespace
    // If the last selected character is not a space, add a space, it's weird, it seems to remove the space
    selText = selText.substring(0, selText.length - 1);
    tagClose += ' ';
  }

  editor.value = getTextBeforeCursor() + ink + selText + tagClose + getTextAfterCursor();

  // Move the cursor to the back
  editor.selectionStart = mousePos;
  editor.selectionEnd = mousePos;

  // Restore scroll position
  // editor.scrollTop = textScroll;
}

// Replace a content and serve the closing tag well
// Here it only handles the first matching content - unfortunately
function replaceText(searchStr, replaceStr) {
  const editor = getEditor();
  let mousePos = editor.selectionStart; // Default position is the current position

  // Record the last position, remember
  const lastValuePos = editor.value.search(escapeRegExp(searchStr));

  // Recall the last position and see if it needs to change
  if (editor.selectionStart > lastValuePos) {
    // TODO: Consider if it's in the middle of a character?
    mousePos = editor.selectionStart + (replaceStr.length - searchStr.length);
  }

  // Replace the clipboard file, replace the recorded last file
  // TODO: Escape from here? Perform escaped replacement string processing?
  const text = editor.value.replace(searchStr, replaceStr);

  // Insert the replaced text
  editor.value = text;

  // Move the cursor to the back
  editor.selectionStart = mousePos;
  editor.selectionEnd = mousePos;

  // TODO: Handle scroll bar?
}

/**
 * Regular expression escape function
 * Purpose: Make the pattern substring recognizable by functions like search that enforce patterns
 * Try it: escapeRegExp("[s")
 * Usability: "[sssa".search(escapeRegExp("[ss"))
 * Reference: http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
 */
function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Hand it over to the main script to handle event hooks, end here
