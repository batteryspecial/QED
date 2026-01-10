/**
 * keybinds/index.js
 * 
 * No way we are using OOP in real production!?
 * I thought it was just for fun, guess not
 * 
 * OOP Concept: FACTORY PATTERN
 * - Instead of the caller knowing about each class, they just call handleKeyPress()
 * - The factory decides which class to instantiate based on the key
 * - This is ENCAPSULATION: hiding complexity behind a simple interface
 */

import { SpaceHandler } from './SpaceHandler.js'
import { BackspaceHandler } from './BackspaceHandler.js'
import { ArrowRightHandler, ArrowLeftHandler } from './ArrowHandler.js'

/**
 * Registry mapping keys to their handler classes
 * 
 * This is like a "class registry"
 * - Keys are the trigger (event.key value)
 * - Values are the CLASS ITSELF (not an instance)
 * - We create instances on-demand when the key is pressed
 */
const handlerRegistry = {
    ' ': SpaceHandler,
    'ArrowRight': ArrowRightHandler,
    'ArrowLeft': ArrowLeftHandler,
    'Backspace': BackspaceHandler,
}

/**
 * Factory function - creates and runs the appropriate handler
 * 
 * Usage in ProofCanvas (one line resolution)
 *   if (handleKeyPress(event.key, editor, selection)) event.preventDefault()
 * 
 * @param {string} key - The key that was pressed (event.key)
 * @param {Editor} editor - Slate editor instance
 * @param {Selection} selection - Current editor selection
 * @returns {boolean} - true if the key was handled
 */
export function handleKeyPress(key, editor, selection) {
    // Look up the handler class for this key
    const HandlerClass = handlerRegistry[key]
    
    // No handler registered for this key
    if (!HandlerClass) {
        return false
    }
    
    // Create a new instance and run it
    // This is like: new SpaceHandler(editor, selection).handle()
    const handler = new HandlerClass(editor, selection)
    return handler.handle()
}

/**
 * Export individual classes in case someone wants direct access
 * (useful for testing or extending)
 */
export { KeyHandler } from './KeyHandler.js'
export { SpaceHandler } from './SpaceHandler.js'
export { ArrowRightHandler, ArrowLeftHandler } from './ArrowHandler.js'
export { BackspaceHandler } from './BackspaceHandler.js'