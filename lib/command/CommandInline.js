/**
 * CommandInline.js
 * 
 * Slate plugin that extends the editor to recognize command-input as an inline element.
 * 
 * IMPORTANT: command-input is INLINE and NON-VOID
 * - Inline: renders within text flow (not block-level)
 * - Non-void: children are editable through Slate's contentEditable
 */
import { Editor, Range } from 'slate'
import { ReactEditor } from 'slate-react'

export function withCommandInput(editor) {
    const { isInline } = editor
    
    editor.isInline = element => {
        return element.type === 'command-input' ? true : isInline(element)
    }
    
    return editor
}

/**
 * Calculate the position for the autocomplete palette
 * Handles viewport boundary detection for above/below positioning
 * 
 * @param {Editor} editor - Slate editor instance
 * @param {Node} node - The command-input node
 * @returns {Object|null} - Position object with top, left, isAbove properties
 */
export function calculatePalettePosition(editor, node) {
    try {
        const domNode = ReactEditor.toDOMNode(editor, node)
        const rect = domNode.getBoundingClientRect()
        const distanceToBottom = window.innerHeight - rect.bottom
        
        // If palette would overflow bottom, show above instead
        const PALETTE_HEIGHT = 160 // Approximate max height of palette
        
        if (distanceToBottom < PALETTE_HEIGHT) {
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                isAbove: true
            }
        } else {
            return {
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                isAbove: false
            }
        }
    } catch (e) {
        console.error('Failed to calculate palette position:', e)
        return null
    }
}

/**
 * Check if cursor is currently inside a command-input element
 * Returns the path to the command-input if found
 * 
 * @param {Editor} editor - Slate editor instance
 * @returns {Object} - { isInCommandInput, path, node, position }
 */
export function getCommandInputContext(editor) {
    const { selection } = editor
    
    // Default return for when we're not in a command-input
    const notInCommandInput = {
        isInCommandInput: false,
        path: null,
        node: null,
        position: null
    }
    
    if (!selection || !Range.isCollapsed(selection)) {
        return notInCommandInput
    }
    
    try {
        // Get the parent node at current cursor position
        const [node, path] = Editor.parent(editor, selection.focus.path)
        
        if (node.type === 'command-input') {
            const position = calculatePalettePosition(editor, node)
            
            return {
                isInCommandInput: true,
                path,
                node,
                position
            }
        }
        
        return notInCommandInput
    } catch (e) {
        return notInCommandInput
    }
}

/**
 * Get the current text content from a command-input node
 * 
 * @param {Node} node - The command-input node
 * @returns {string} - Text content of the node
 */
export function getCommandInputText(node) {
    if (!node || !node.children) return ''
    
    // Command-input has a single text child
    const textChild = node.children[0]
    return textChild?.text || ''
}


/**
 * Determine if autocomplete should be shown based on filtered results
 * 
 * @param {Array} filteredCommands - Commands matching current input
 * @param {boolean} isInCommandInput - Whether cursor is in command-input
 * @returns {boolean} - Whether to show the palette
 */
export function shouldShowAutocomplete(filteredCommands, isInCommandInput) {
    return isInCommandInput && filteredCommands.length > 0
}
