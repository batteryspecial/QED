/**
 * SpaceHandler.js
 * 
 * Handles Space key - converts command-input to math symbol.
 * 
 * OOP Concept: INHERITANCE
 * - `extends KeyHandler` means this class inherits all methods/properties from KeyHandler
 * - We only need to implement what's DIFFERENT (the handle() method)
 * - `super(editor, selection)` calls the parent's constructor
 */

import { KeyHandler } from "./KeyHandler"
import { parseCommandToLatex } from "../command/CommandParser"
import { commands, templateCommands } from "../command/CommandList.js"

export class SpaceHandler extends KeyHandler {
    /**
     * constructor: passes arguments to parent
     * super() calls KeyHandler's constructor
     */
    constructor(editor, selection) {
        super(editor, selection) // runs KeyHandler's constructor which is to extract position
    }

    /**
     * Handle space key press
     * Converts command-input to math symbol when pressed after the component
     * 
     * @returns boolean, true if handled
     */
    handle() {
        // Must be at the start of a node
        if (!this.isAtStart()) {
            return false
        }

        const prev = this.getPrevious()
        if (!prev || !prev.isCommandInput) {
            return false
        }

        // Get command text and convert
        const commandText = this.getNodeText(prev.node)
        const latexSymbol = parseCommandToLatex(commandText, commands, templateCommands)

        this.removeNode(prev.path)
        this.insertMath(latexSymbol)

        return true
    }
}