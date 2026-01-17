/**
 * CommandParser.js
 * 
 * Converts command-input text to LaTeX symbols.
 * Supports nested template commands via recursive parsing.
 */

/**
 * Generate all pattern combinations from aliases recursively.
 * Each alias position creates a {} placeholder in the pattern.
 * 
 * Example:
 *   Input: [['congruent to', 'equiv'], ['modulo', 'mod']]
 *   Output: [
 *     'congruent to {} modulo {}',
 *     'congruent to {} mod {}',
 *     'equiv {} modulo {}',
 *     'equiv {} mod {}'
 *   ]
 */
function generatePatterns(aliases) {
    // Base case: no more alias groups
    if (aliases.length === 0) return ['']
    
    const [firstAliases, ...restAliases] = aliases
    const restPatterns = generatePatterns(restAliases)
    const patterns = []
    
    for (const alias of firstAliases) {
        for (const rest of restPatterns) {
            // Build: alias + space + {} + rest
            // "if" + " {}" + "then {}" = "if {}then {}"
            if (rest) {
                patterns.push(`${alias} {}${rest}`)
            } else {
                patterns.push(`${alias} {}`)
            }
        }
    }
    
    return patterns
}

/**
 * Match a template pattern against text starting at position i.
 * Captures values between {} placeholders.
 * 
 * Pattern: "mod {}"  → parts: ["mod ", ""]
 * Text: "mod 5"
 * Result: { matched: true, values: ["5"], endIndex: 5 }
 * 
 * Pattern: "if {} then {}" → parts: ["if ", " then ", ""]
 * Text: "if P then Q"
 * Result: { matched: true, values: ["P", "Q"], endIndex: 11 }
 */
function matchTemplate(text, i, pattern) {
    // Split pattern by {} to get literal parts
    const parts = pattern.split('{}')
    let currentIndex = i
    const capturedValues = []
    
    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
        const part = parts[partIdx]
        
        // Match the literal text part exactly
        if (part.length > 0) {
            const slice = text.slice(currentIndex, currentIndex + part.length)
            if (slice !== part) {
                return { matched: false }
            }
            currentIndex += part.length
        }
        
        // After each part (except last), capture the placeholder value
        if (partIdx < parts.length - 1) {
            // Skip leading whitespace before the value
            while (text[currentIndex] === ' ') {
                currentIndex++
            }
            
            // Capture until we hit the next literal part or end
            let value = ''
            const nextPart = parts[partIdx + 1]
            
            while (currentIndex < text.length) {
                // Stop if we've reached the next literal pattern part
                if (nextPart && text.slice(currentIndex, currentIndex + nextPart.length) === nextPart) {
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
 * Recursively parse text, handling nested templates.
 * 
 * Algorithm:
 * 1. Try matching template commands (longer patterns first)
 * 2. If template matches, recursively parse each captured value
 * 3. If no template, try regular commands with word boundary check
 * 4. If nothing matches, append character as-is
 * 
 * This recursion enables arbitrary nesting:
 *   "if forall x mod 3 then x in ZZ"
 *   → outer template captures "forall x mod 3" and "x in ZZ"
 *   → recursive call parses "mod 3" as another template
 *   → base case: regular commands like "forall", "in", "ZZ"
 * 
 * @param {string} text - Text to parse
 * @param {Array} cmds - Sorted regular commands [{pattern, symbol}]
 * @param {Array} templates - Sorted template commands [{pattern, template}]
 * @returns {string} - Parsed LaTeX output
 */
function parseRecursive(text, cmds, templates) {
    // Base case: empty input produces empty output
    if (!text) return ''
    
    let result = ''
    let i = 0
    
    while (i < text.length) {
        let matched = false
        
        // Priority 1: Template commands (longer, more specific)
        for (const tmpl of templates) {
            const matchResult = matchTemplate(text, i, tmpl.pattern)
            
            if (matchResult.matched) {
                let output = tmpl.template
                
                // RECURSIVE CALL: parse each captured value
                // This is where nesting happens - captured value may contain templates
                matchResult.values.forEach((value, idx) => {
                    const parsedValue = parseRecursive(value, cmds, templates)
                    output = output.replace(`{${idx}}`, parsedValue)
                })
                
                result += output
                i = matchResult.endIndex
                matched = true
                break
            }
        }
        
        // Priority 2: Regular commands
        if (!matched) {
            for (const cmd of cmds) {
                const slice = text.slice(i, i + cmd.pattern.length)
                
                if (slice === cmd.pattern) {
                    // Word boundary check: "forall" matches but "forall67" does not
                    const nextChar = text[i + cmd.pattern.length]
                    const isWordBoundary = !nextChar || /[\s,]/.test(nextChar)
                    
                    if (isWordBoundary) {
                        result += cmd.symbol
                        i += cmd.pattern.length
                        matched = true
                        break
                    }
                }
            }
        }
        
        // Fallback: append character unchanged
        if (!matched) {
            result += text[i]
            i++
        }
    }
    
    return result
}

/**
 * Parse command text and convert to LaTeX.
 * Entry point that builds data structures and delegates to recursive parser.
 * 
 * @param {string} text - Raw input text
 * @param {Array} commands - Regular command definitions
 * @param {Array} templateCommands - Template command definitions
 * @returns {string} - LaTeX output
 *
 * parseCommandToLatex('forall x in RR', commands)
 * // Returns '\\forall x \\in \\mathbb{R}'
 * 
 * parseCommandToLatex('if forall x mod 3 then x in ZZ', commands, templates)
 * // Returns '(\\forall x \\!\\pmod{3}) \\rightarrow (x \\in \\mathbb{Z})'
 */
export function parseCommandToLatex(text, commands, templateCommands = []) {
    const trimmedText = text.trim()
    if (!trimmedText) return ''
    
    // Build regular commands array from all aliases
    const cmds = []
    commands.forEach(cmd => {
        cmd.command.forEach(alias => {
            cmds.push({ pattern: alias, symbol: cmd.symbol })
        })
    })
    
    // Build templates array with auto-generated or manual patterns
    const templates = []
    templateCommands.forEach(tmpl => {
        const patterns = tmpl.patterns || generatePatterns(tmpl.aliases)
        
        patterns.forEach(pattern => {
            templates.push({ pattern, template: tmpl.template })
        })
    })
    
    // Sort by length descending: greedy matching (longest pattern wins)
    cmds.sort((a, b) => b.pattern.length - a.pattern.length)
    templates.sort((a, b) => b.pattern.length - a.pattern.length)
    
    // Run recursive parser
    let result = parseRecursive(trimmedText, cmds, templates)
    
    // Add spacing after commas for LaTeX readability
    result = result.replace(/,/g, ',\\;')
    
    return result
}
