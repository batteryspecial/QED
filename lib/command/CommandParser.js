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

//------------------------------------------------------------------------

/**
 * Generate all pattern combinations from aliases recursively
 * 
 * __Example__
 * Input: [['congruent to', 'equiv'], ['modulo', 'mod']]
 * Output: [
 *   'congruent to {} modulo {}',
 *   'congruent to {} mod {}',
 *   'equiv {} modulo {}',
 *   'equiv {} mod {}'
 * ]
 */
function generatePatterns(aliases) {
    if (aliases.length === 0) return ['']
    
    const [firstAliases, ...restAliases] = aliases
    const restPatterns = generatePatterns(restAliases)
    
    const patterns = []
    for (const alias of firstAliases) {
        for (const rest of restPatterns) {
            // Build pattern: alias + {} + rest
            if (rest) {
                patterns.push(`${alias} {}${rest}`)
            }
            else {
                patterns.push(`${alias} {}`)
            }
        }
    }
    
    return patterns
}

/**
 * Match a template pattern against text at position i
 * Returns: { matched: true, values: ['4', '4'], endIndex: 25 } or { matched: false }
 */
function matchTemplate(text, i, pattern) {
    // Split pattern by {} to get parts and placeholder positions
    // "modulo {}" → ["modulo ", ""]
    const parts = pattern.split('{}')
    //console.log(parts)
    
    let currentIndex = i
    const capturedValues = []
    
    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
        const part = parts[partIdx]
        
        // Match the literal text part
        if (part.length > 0) {
            const slice = text.slice(currentIndex, currentIndex + part.length)
            if (slice !== part) {
                return { matched: false }
            }
            currentIndex += part.length
        }
        
        // After each part (except the last), capture a placeholder value
        if (partIdx < parts.length - 1) {
            // Skip whitespace before the value
            while (text[currentIndex] === ' ') {
                currentIndex++
            }
            
            // Capture the value (digits, variables, etc. until next space or pattern part)
            let value = ''
            const nextPart = parts[partIdx + 1]
            
            // Keep reading until we hit the next pattern part or end
            while (currentIndex < text.length) {
                // Check if next pattern part is starting
                if (nextPart && text.slice(currentIndex, currentIndex + nextPart.length) === nextPart) {
                    break
                }
                
                // Stop at word boundary if next part starts with space
                if (nextPart && nextPart[0] === ' ' && /\s/.test(text[currentIndex])) {
                    break
                }
                
                value += text[currentIndex]
                currentIndex++
            }
            
            capturedValues.push(value.trim())
        }
    }
    
    return {
        matched: true,
        values: capturedValues,
        endIndex: currentIndex
    }
}

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
export function parseCommandToLatex(text, commands, templateCommands = []) {
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


    const templates = []
    templateCommands.forEach(tmpl => {
        const patterns = (tmpl.patterns) ? 
            tmpl.patterns  // Manual patterns (backward compatible)
            : generatePatterns(tmpl.aliases)  // Auto-generate
        
        patterns.forEach(pattern => {
            templates.push({
                pattern: pattern,
                template: tmpl.template
            })
        })
    })
    //console.log(templates)

    // Sort by pattern length (longest first) for greedy matching
    cmds.sort((a,b) => b.pattern.length - a.pattern.length)
    templates.sort((a, b) => b.pattern.length - a.pattern.length)

    let res = ''
    let i = 0

    // O(n * m * k) time complexity, n = text len, m = # of cmds, k = avg cmd len
    while (i < trimmedText.length) {
        let matched = false

        // Try template commands first (they're usually longer)
        for (const tmpl of templates) {
            const matchResult = matchTemplate(trimmedText, i, tmpl.pattern)
            
            if (matchResult.matched) {
                // Replace {0}, {1}, etc. with captured values
                // These represent positions in the template
                let out = tmpl.template
                matchResult.values.forEach((value, idx) => {
                    out = out.replace(`{${idx}}`, value)
                })
                
                res += out
                i = matchResult.endIndex
                matched = true
                break
            }
        }
        
        if (matched) continue

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
