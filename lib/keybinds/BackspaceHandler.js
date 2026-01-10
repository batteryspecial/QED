/**
 * BackspaceHandler.js
 * 
 * Handles Backspace key - removes empty command-input elements.
 * 
 * OOP Concept: Keep it simple
 * - Inherit shared utilities from KeyHandler
 * - Only implement the specific logic needed
 */

import { KeyHandler } from './KeyHandler.js'

export class BackspaceHandler extends KeyHandler {
    constructor(editor, selection) {
        super(editor, selection)
    }

    /**
     * Handle Backspace key press
     * Removes empty command-input components entirely
     * 
     * @returns {boolean} - true if handled
     */
    handle() {
        const parent = this.getParent()

        if (!parent.isCommandInput) {
            return false
        }

        // Delete when empty
        const commandText = this.getNodeText(parent.parentNode)
        if (commandText.trim() !== '') {
            return false
        }

        this.removeNode(parent.parentPath)
        return true
    }
}