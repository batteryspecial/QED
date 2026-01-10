/**
 * KeyHandler.js
 * 
 * Base class for all keyboard handlers in the editor.
 * Provides shared Slate imports, common context extraction, and utility methods.
 * 
 * OOP Concepts
 * - Class: A blueprint for creating objects with shared behavior
 * - Constructor: Runs when you create a new instance, sets up initial state
 * - Methods: Functions that belong to the class
 * - Inheritance: Child classes extend this base class (see Handle______.js files)
 * - Polymorphism: Each child class implements handle() differently
 */

import { Editor, Transforms, Node } from 'slate'
// Re-export so child classes can import from one place
export { Editor, Transforms, Node }

export class KeyHandler {
    /**
     * Constructor - called when you do `new KeyHandler(editor, selection)`
     * Sets up all the common context that every handler needs
     * 
     * @param {Editor} editor - Slate editor instance
     * @param {Selection} selection - Current editor selection
     */
    constructor(editor, selection) {
        this.editor = editor
        this.selection = selection
        this.anchor = selection.anchor
        
        // Extract node and path at cursor position
        const [node, path] = Editor.node(editor, selection.anchor.path)
        this.node = node
        this.path = path
    }
    
    /**
     * Get parent node context (used by most handlers)
     * Returns null values if not inside a valid parent
     * 
     * @returns {Object} - { parentNode, parentPath, isCommandInput }
     */
    getParent() {
        try {
            const [parentNode, parentPath] = Editor.parent(this.editor, this.path)
            return {
                parentNode,
                parentPath,
                isCommandInput: parentNode.type === 'command-input'
            }
        } catch (e) {
            return {
                parentNode: null,
                parentPath: null,
                isCommandInput: false
            }
        }
    }
    
    /**
     * Get the previous node (sibling before current position)
     * 
     * @returns {Object|null} - { node, path } or null if none exists
     */
    getPrevious() {
        const prevEntry = Editor.previous(this.editor, { at: this.path })
        if (!prevEntry) return null
        
        const [node, path] = prevEntry
        return { node, path, isCommandInput: node.type === 'command-input' }
    }
    
    /**
     * Get the next node (sibling after current position)
     * 
     * @returns {Object|null} - { node, path } or null if none exists
     */
    getNext() {
        const nextEntry = Editor.next(this.editor, { at: this.path })
        if (!nextEntry) return null
        
        const [node, path] = nextEntry
        return { node, path, isCommandInput: node.type === 'command-input' }
    }
    
    /**
     * Check if cursor is at the start of current node
     */
    isAtStart() {
        return this.anchor.offset === 0
    }
    
    /**
     * Check if cursor is at the end of current node
     */
    isAtEnd() {
        return this.node.text && this.anchor.offset === this.node.text.length
    }
    
    /**
     * Get text content from a node
     */
    getNodeText(node) {
        return Node.string(node)
    }
    
    /**
     * Remove a node at the given path
     */
    removeNode(path) {
        Transforms.removeNodes(this.editor, { at: path })
    }
    
    /**
     * Insert a math node at current position
     */
    insertMath(latex) {
        Transforms.insertNodes(this.editor, {
            type: 'math',
            latex: latex,
            children: [{ text: '' }]
        })
    }
    
    /**
     * Move cursor to a specific point
     */
    moveTo(point) {
        Transforms.select(this.editor, point)
    }
    
    /**
     * Move cursor to position after a node
     */
    moveAfter(path) {
        const afterPoint = Editor.after(this.editor, path)
        if (afterPoint) {
            this.moveTo(afterPoint)
            return true
        }
        return false
    }
    
    /**
     * Move cursor to position before a node
     */
    moveBefore(path) {
        const beforePoint = Editor.before(this.editor, path)
        if (beforePoint) {
            this.moveTo(beforePoint)
            return true
        }
        return false
    }
    
    /**
     * Move cursor into a command-input at the start
     */
    moveToCommandInputStart(commandInputPath) {
        const firstTextPath = [...commandInputPath, 0]
        this.moveTo({
            anchor: { path: firstTextPath, offset: 0 },
            focus: { path: firstTextPath, offset: 0 }
        })
    }
    
    /**
     * Move cursor into a command-input at the end
     */
    moveToCommandInputEnd(commandInputPath) {
        const lastTextPath = [...commandInputPath, 0]
        const lastTextNode = Node.get(this.editor, lastTextPath)
        const lastOffset = lastTextNode.text ? lastTextNode.text.length : 0
        
        this.moveTo({
            anchor: { path: lastTextPath, offset: lastOffset },
            focus: { path: lastTextPath, offset: lastOffset }
        })
    }
    
    /**
     * The main handler method - OVERRIDE THIS IN CHILD CLASSES
     * 
     * @returns {boolean} - true if the key was handled, false otherwise
     */
    handle() {
        // Base class does nothing - child classes override this
        return false
    }
}