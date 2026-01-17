import { useRef, useEffect } from "react"
import katex from 'katex'

/**
 * commands.js
 * 
 * Command list for mathematical symbols and notation.
 * Each command has a shorthand, LaTeX symbol, and description.
 */

export const commands = [
    {
        command: ['forall', 'for all'],
        symbol: '\\forall',
        description: 'for all'
    },
    {
        command: ['exists', 'exist'],
        symbol: '\\exists',
        description: 'there exists'
    },
    {
        command: ['and'],
        symbol: '\\wedge',
        description: 'logical and'
    },
    {
        command: ['or'],
        symbol: '\\vee',
        description: 'logical or'
    },
    {
        command: ['such that', 's.t.'],
        symbol: '\\colon',
        description: 'such that'
    },
    {
        command: ['neg', 'not'],
        symbol: '\\neg',
        description: 'negation'
    },
    {
        command: ['in', 'an element of'],
        symbol: '\\in',
        description: 'an element of'
    },
    {
        command: ['equiv', 'congruent to'],
        symbol: '\\equiv',
        description: 'logical equivalence'
    },
    {
        command: ['imp', 'implies'],
        symbol: '\\rightarrow',
        description: 'implication'
    },
    {
        command: ['iff', 'if and only if'],
        symbol: '\\leftrightarrow',
        description: 'if and only if'
    },
    {
        command: ['NN', 'naturals'],
        symbol: '\\mathbb{N}',
        description: 'natural numbers'
    },
    {
        command: ['pint', 'positive integers'],
        symbol: '\\mathbb{Z}^+',
        description: 'positive integers'
    },
    {
        command: ['nint', 'negative integers'],
        symbol: '\\mathbb{Z}^-',
        description: 'negative integers'
    },
    {
        command: ['ZZ', 'int', 'integers'],
        symbol: '\\mathbb{Z}',
        description: 'integers'
    },
    {
        command: ['QQ', 'rational', 'rational numbers'],
        symbol: '\\mathbb{Q}',
        description: 'rational numbers'
    },
    {
        command: ['irrational', 'irrational numbers'],
        symbol: '\\mathbb{Q}^c',
        description: 'irrational numbers'
    },
    {
        command: ['RR', 'reals'],
        symbol: '\\mathbb{R}',
        description: 'real numbers'
    },
    {
        command: ['CC', 'complex numbers'],
        symbol: '\\mathbb{C}',
        description: 'complex numbers'
    },
    {
        command: ['{', 'lbrace'],
        symbol: '\\{',
        description: 'left curly brace'
    },
    {   
        command: ['}', 'rbrace'],
        symbol: '\\}',
        description: 'right curly brace'
    },
]

export const nodisplay = [
    '\\}',
    '\\{',
]

/**
 * Template commands are commands that map to multiple symbols.
 */
export const templateCommands = [
    {
        // Define aliases for each placeholder position
        patterns: ['{}/{}'],
        template: '\\frac{{0}}{{1}}',
        description: 'modulo class'
    },
    {
        // Define aliases for each placeholder position
        patterns: ['if {} then {}', 'if {}, then {}'],
        template: '{{0}} \\rightarrow {{1}}',
        description: 'modulo class'
    },
    {
        // Define aliases for each placeholder position
        patterns: ['mod {}', '(mod {})', 'modulo {}'],
        template: '\\!\\pmod{{{0}}}',
        description: 'modulo class'
    },
]

/**
 * Simple LaTeX renderer for command symbols
 * Used in the CommandList to display shorthand-LaTeX conversions
 */
export function RenderSymbol({ latex }) {
    const symbolRef = useRef(null)

    useEffect(() => {
        if (symbolRef.current) {
            katex.render(latex, symbolRef.current, {
                throwOnError: false,
                displayMode: false,
            })
        }
    }, [latex])

    return <div ref={symbolRef}></div>
}
