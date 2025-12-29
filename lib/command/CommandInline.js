/**
 * CommandInline.js
 * 
 * Slate plugin that extends the editor to recognize command-input as an inline element.
 * 
 * IMPORTANT: command-input is INLINE and NON-VOID
 * - Inline: renders within text flow (not block-level)
 * - Non-void: children are editable through Slate's contentEditable
 */

export function withCommandInput(editor) {
    const { isInline } = editor
    
    editor.isInline = element => {
        return element.type === 'command-input' ? true : isInline(element)
    }
    
    return editor
}