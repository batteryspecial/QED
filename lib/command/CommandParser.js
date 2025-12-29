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
 * 
 * * Handles:
 * - Multiple command aliases: ['forall', 'for all'] both map to '\\forall'
 * - Mixed content: "forall x in R" → "\\forall x \\in \\mathbb{R}"
 * - Greedy matching: Longest match wins (checks "for all" before "for")
 */
export function parseCommandToLatex(text, commands) {
    const trimmedText = text.trim()
    
    if (!trimmedText) {
        return ''
    }

    const cmds = []
    commands.forEach(cmd => {
        // Multiple aliases: ['forall', 'for all']
        cmd.command.forEach(alias => {
            cmds.push({ pattern: alias, symbol: cmd.symbol })
        })
    })

    // Sort by pattern length (longest first) for greedy matching
    cmds.sort((a,b) => b.pattern.length - a.pattern.length)

    let res = ''
    let i = 0

    // O(n * m * k) time complexity, n = text len, m = # of cmds, k = avg cmd len
    while (i < trimmedText.length) {
        let matched = false

        for (const cmd of cmds) {
            const pattern = cmd.pattern
            const slice = trimmedText.slice(i, i + pattern.length)

            // Check if pattern matches and is a word boundary
            // "forall" matches but "forall67" does not
            if (slice === pattern) {
                const nextChar = trimmedText[i + pattern.length]
                const isWordBoundary = !nextChar || /[\s,]/.test(nextChar)

                if (isWordBoundary) {
                    res += cmd.symbol
                    i += pattern.length
                    matched = true 
                    break
                }
            }
        }

        // No command matched, just append the character
        if (!matched) {
            res += trimmedText[i]
            i++
        }
    }

    return res
}