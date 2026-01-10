/**
 * ArrowHandler.js
 * 
 * Handles Arrow keys - navigation in/out of command-input elements.
 * 
 * OOP Concept: INHERITANCE + SPECIALIZATION
 * - ArrowRightHandler and ArrowLeftHandler both extend KeyHandler
 * - They share the same parent but implement handle() differently
 * - This is POLYMORPHISM: same method name, different behavior
 */

import { KeyHandler } from './KeyHandler.js'

/**
 * ArrowRightHandler
 * Manages cursor navigation when entering/exiting command-input from the left
 */
export class ArrowRightHandler extends KeyHandler {
    constructor(editor, selection) {
        super(editor, selection)
    }

    handle() {
        const parent = this.getParent()

        // Case 1: Exiting command-input from inside (going right)
        if (parent.isCommandInput && this.isAtEnd()) {
            return this.moveAfter(parent.parentPath)
        }
        // Case 2: Entering command-input from outside
        if (this.isAtEnd()) {
            const next = this.getNext()

            if (next && next.isCommandInput) {
                this.moveToCommandInputStart(next.path)
                return true
            }
        }

        return false
    }
}

/**
 * ArrowLeftHandler
 * Manages cursor navigation when entering/exiting command-input from the right
 */
export class ArrowLeftHandler extends KeyHandler {
    constructor(editor, selection) {
        super(editor, selection)
    }

    handle() {
        const parent = this.getParent()

        // Case 1: Exiting command-input from inside (going right)
        if (parent.isCommandInput && this.isAtStart()) {
            return this.moveBefore(parent.parentPath)
        }
        // Case 2: Entering command-input from outside
        if (this.isAtEnd()) {
            const prev = this.getPrevious()

            if (prev && prev.isCommandInput) {
                this.moveToCommandInputEnd(prev.path)
                return true
            }
        }

        return false
    }
}