import { Node, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'

/**
 * Autocomplete.js
 * 
 * Handles command filtering, matching, and selection logic for the command palette.
 * Separated from ProofCanvas for cleaner architecture.
 */

/**
 * Filter commands based on typed text
 * Returns array of { command: originalCmd, displayAlias: string, matchIndex: number }
 * 
 * Logic:
 * - Empty input: show all commands with first alias
 * - With input: show only matching aliases
 * - Prioritize: exact matches → first alias in list → shorter aliases
 */
export function filterCommands(commands, typedText) {
    if (typeof typedText !== 'string' || typedText.trim() === '') {
        return commands.map(cmd => ({
            command: cmd,           // Full command object
            displayAlias: cmd.command[0],  // String
            matchIndex: 0
        }))
    }
    const lowerTyped = typedText.toLowerCase().trim()
    
    // Empty input - show all commands with first alias
    if (!lowerTyped) {
        return commands.map(cmd => ({
            command: cmd,
            displayAlias: cmd.command[0],
            matchIndex: 0
        }))
    }
    
    const matches = []
    
    commands.forEach(cmd => {
        // Check each alias for a match
        cmd.command.forEach((alias, aliasIndex) => {
            const lowerAlias = alias.toLowerCase()
            
            // Exact match or prefix match
            if (lowerAlias === lowerTyped || lowerAlias.startsWith(lowerTyped)) {
                matches.push({
                    command: cmd,
                    displayAlias: alias,
                    matchIndex: aliasIndex,
                    matchQuality: lowerAlias === lowerTyped ? 0 : 1, // Exact match = 0, prefix = 1
                    aliasLength: alias.length
                })
            }
        })
    })
    
    // Sort by: exact matches first, then by alias index (first alias prioritized), then by length
    matches.sort((a, b) => {
        if (a.matchQuality !== b.matchQuality) return a.matchQuality - b.matchQuality
        if (a.matchIndex !== b.matchIndex) return a.matchIndex - b.matchIndex
        return a.aliasLength - b.aliasLength
    })
    
    // Remove duplicate commands (keep only the best matching alias per command)
    const seen = new Set()
    const unique = matches.filter(match => {
        const key = match.command.symbol
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
    
    return unique
}

/**
 * Handle command selection - replaces entire text in command-input with selected alias
 * 
 * @param {Editor} editor - Slate editor instance
 * @param {Array} activeCommandInputPath - Path to the active command-input node
 * @param {Object} matchData - { command, displayAlias, matchIndex }
 * @param {Function} setShowCommands - State setter to hide palette
 */
export function handleCommandSelection(editor, activeCommandInputPath, matchData, setShowCommands) {
    if (!activeCommandInputPath) return
    
    const { displayAlias } = matchData
    
    // Get the text node path inside command-input
    const textPath = [...activeCommandInputPath, 0]
    
    // Select all text in the command-input
    const textNode = Node.get(editor, textPath)
    Transforms.select(editor, {
        anchor: { path: textPath, offset: 0 },
        focus: { path: textPath, offset: textNode.text ? textNode.text.length : 0 }
    })
    
    // Replace with the selected alias
    Transforms.insertText(editor, displayAlias)
    
    // Hide palette
    setShowCommands(false)
    
    // Keep focus in the command-input
    ReactEditor.focus(editor)
}

/**
 * Get typed text from command-input node
 * Used for bolding matching text in palette
 */
export function getTypedText(editor, activeCommandInputPath) {
    try {
        if (activeCommandInputPath) {
            const commandInputNode = Node.get(editor, activeCommandInputPath)
            return Node.string(commandInputNode).toLowerCase().trim()
        }
    } catch (e) {
        // Ignore errors
    }
    return ''
}

/**
 * Split alias into bold part (matching) and normal part
 * Returns { boldPart: string, normalPart: string, matchLength: number }
 */
export function getBoldedAliasParts(displayAlias, typedText) {
    if (typeof displayAlias !== 'string' || displayAlias.trim() === '') {
        return {
            boldPart: '',
            normalPart: '',
            matchLength: 0
        }
    }
    const lowerAlias = displayAlias.toLowerCase()
    const matchLength = typedText && lowerAlias.startsWith(typedText) ? typedText.length : 0
    
    return {
        boldPart: displayAlias.slice(0, matchLength),
        normalPart: displayAlias.slice(matchLength),
        matchLength
    }
}