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
        command: ['exists'],
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
        command: ['neg'],
        symbol: '\\neg',
        description: 'negation'
    },
    {
        command: ['in'],
        symbol: '\\in',
        description: 'an element of'
    },
    {
        command: ['equiv'],
        symbol: '\\equiv',
        description: 'congruent to'
    },
    {
        command: ['Implies'],
        symbol: '\\rightarrow',
        description: 'implication'
    },
    {
        command: ['Iff'],
        symbol: '\\leftrightarrow',
        description: 'if and only if'
    },
    {
        command: ['naturals'],
        symbol: '\\mathbb{N}',
        description: 'natural numbers'
    },
    {
        command: ['pint'],
        symbol: '\\mathbb{Z}^+',
        description: 'positive integers'
    },
    {
        command: ['nint'],
        symbol: '\\mathbb{Z}^-',
        description: 'negative integers'
    },
    {
        command: ['int'],
        symbol: '\\mathbb{Z}',
        description: 'integers'
    },
    {
        command: ['rational'],
        symbol: '\\mathbb{Q}',
        description: 'rational numbers'
    },
    {
        command: ['irrational'],
        symbol: '\\mathbb{Q}^c',
        description: 'irrational numbers'
    },
    {
        command: ['real'],
        symbol: '\\mathbb{R}',
        description: 'real numbers'
    },
    {
        command: ['complex'],
        symbol: '\\mathbb{C}',
        description: 'complex numbers'
    }
]