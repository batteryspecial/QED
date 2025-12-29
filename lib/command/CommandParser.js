/**
 * CommandParser.js
 * 
 * Converts command-input text to LaTeX symbols.
 * 
 * Logic:
 * - Check if the entire text matches a command shorthand
 * - If yes, return the LaTeX symbol
 * - If no, return the text as-is (user might be typing regular text)
 */

/**
 * Parse command text and convert to LaTeX if it matches a known command
 * The entire string will be converted into a single LaTeX group.
 * 
 * @param {string} text - The text from the command-input element
 * @param {Array} commands - Array of command objects with {command, symbol, description}
 * @returns {string} - LaTeX symbol if match found, otherwise original text
 * 
 * @example
 * parseCommandToLatex('forall', commands) // Returns '\\forall'
 * parseCommandToLatex('randomtext', commands) // Returns 'randomtext'
 */
export function parseCommandToLatex(text, commands) {
    const trimmedText = text.trim()
    
    if (!trimmedText) {
        return ''
    }
    
    // Split by whitespace, preserving the spaces
    const tokens = trimmedText.split(/(\s+)/)
    
    // Process each token
    const processedTokens = tokens.map(token => {
        // If it's whitespace, keep it
        if (/^\s+$/.test(token)) {
            return token
        }
        
        // Look for command match
        const matchedCommand = commands.find(cmd => cmd.command === token)
        
        // Return LaTeX symbol if found, otherwise original token
        return matchedCommand ? matchedCommand.symbol : token
    })
    
    // Join everything back together
    return processedTokens.join('')
}