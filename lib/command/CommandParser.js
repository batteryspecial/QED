/**
 * CommandParser.js
 * 
 * Converts command-input text to LaTeX symbols.
 * Supports nested template commands via recursive parsing.
 */

/**
 * Match a template pattern against text starting at position i.
 * Captures values between {} placeholders with parenthesis-aware grouping.
 * 
 * Parentheses act as explicit grouping delimiters
 */
function matchTemplate(text, i, pattern) {
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
            // Skip leading whitespace
            while (text[currentIndex] === ' ') {
                currentIndex++
            }
            
            let value = ''
            let depth = 0  // Parenthesis depth tracker
            const nextPart = parts[partIdx + 1]
            
            while (currentIndex < text.length) {
                const char = text[currentIndex]
                
                // Track parenthesis depth
                if (char === '(') depth++
                if (char === ')') {
                    if (depth === 0) {
                        // Unmatched ')' belongs to outer scope, stop capturing
                        break
                    }
                    depth--
                }
                
                // Only stop at next pattern part when depth === 0
                // This ensures "(if x then y)" is captured whole
                if (depth === 0 && nextPart) {
                    if (text.slice(currentIndex, currentIndex + nextPart.length) === nextPart) {
                        break
                    }
                }
                
                value += char
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
                    // Empty values get a visible placeholder (box symbol)
                    const finalValue = parsedValue || '\\square'
                    output = output.replace(`{${idx}}`, finalValue)
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
                    // Word boundary: whitespace, punctuation, or math operators
                    // "forall" matches, "forall67" does not, "RR^2" matches RR
                    // Also match before: } ) , : ] for cases like {RR} or RR
                    const nextChar = text[i + cmd.pattern.length]
                    const isWordBoundary = !nextChar || /[\s,\^_{}()\[\]:.]/.test(nextChar)
                    
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
 */
export function parseCommandToLatex(text, commands, templateCommands = []) {
    const trimmedText = text.trim()
    if (!trimmedText) return ''
    
    // Pre-process: escape literal curly braces BEFORE template matching
    // Replace { and } with temporary tokens, then convert to LaTeX at the end
    const LBRACE_TOKEN = '___LBRACE___'
    const RBRACE_TOKEN = '___RBRACE___'
    let processedText = trimmedText
        .replace(/\{/g, LBRACE_TOKEN)
        .replace(/\}/g, RBRACE_TOKEN)
    
    // Build regular commands array from all aliases
    const cmds = []
    commands.forEach(cmd => {
        cmd.command.forEach(alias => {
            cmds.push({ pattern: alias, symbol: cmd.symbol })
        })
    })
    
    // Build templates array from pattern strings
    // Each template has: patterns (array of strings), template (output format)
    const templates = []
    templateCommands.forEach(tmpl => {
        // patterns can be a string or array of strings
        const patternList = Array.isArray(tmpl.patterns) ? tmpl.patterns : [tmpl.patterns]
        
        patternList.forEach(pattern => {
            templates.push({ pattern, template: tmpl.template })
        })
    })
    
    // Sort by length descending: greedy matching (longest pattern wins)
    cmds.sort((a, b) => b.pattern.length - a.pattern.length)
    templates.sort((a, b) => b.pattern.length - a.pattern.length)
    
    // Run recursive parser
    let result = parseRecursive(processedText, cmds, templates)
    
    // convert brace tokens to LaTeX escaped braces
    result = result
        .replace(new RegExp(LBRACE_TOKEN, 'g'), '\\{')
        .replace(new RegExp(RBRACE_TOKEN, 'g'), '\\}')
    
    // Add spacing after commas for LaTeX readability
    result = result.replace(/,/g, ',\\;')
    
    return result
}