'use client'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { createEditor, Editor, Range, Transforms, Node } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'

import katex from 'katex'
import 'katex/dist/katex.min.css'

import { withHistory } from 'slate-history'
import CommandInput from './CommandInput'

import '../sections/canvas.css'

/**
 * Sample commands list
 */
const commands = [
    {
            command: 'forall',
            symbol: '\\forall',  // LaTeX syntax for KaTeX
            description: 'for all'
        },
        {
            command: 'exists',
            symbol: '\\exists',
            description: 'there exists'
        },
        {
            command: 'and',
            symbol: '\\wedge',
            description: 'logical and'
        },
        {
            command: 'or',
            symbol: '\\vee',
            description: 'logical or'
        },
        {
            command: 'neg',
            symbol: '\\neg',
            description: 'negation'
        },
        {
            command: 'element',
            symbol: '\\in',
            description: 'an element of'
        },
        {
            command: 'equiv',
            symbol: '\\equiv',
            description: 'congruent to'
        },
        {
            command: 'Implies',
            symbol: '\\rightarrow',
            description: 'implication'
        },
        {
            command: 'Iff',
            symbol: '\\leftrightarrow',
            description: 'if and only if'
        },
        {
            command: 'naturals',
            symbol: '\\mathbb{N}',
            description: 'natural numbers'
        },
        {
            command: 'pint',
            symbol: '\\mathbb{Z}^+',
            description: 'positive integers'
        },
        {
            command: 'nint',
            symbol: '\\mathbb{Z}^-',
            description: 'negative integers'
        },
        {
            command: 'int',
            symbol: '\\mathbb{Z}',
            description: 'integers'
        },
        {
            command: 'rational',
            symbol: '\\mathbb{Q}',
            description: 'rational numbers'
        },
        {
            command: 'irrational',
            symbol: '\\mathbb{Q}^c',
            description: 'irrational numbers'
        },
        {
            command: 'real',
            symbol: '\\mathbb{R}',
            description: 'real numbers'
        },
        {
            command: 'complex',
            symbol: '\\mathbb{C}',
            description: 'complex numbers'
        }
]

/**
 * Extend Slate to recognize command-input as an inline element
 * IMPORTANT: command-input is NON-VOID (users can type in it)
 */
function withCommandInput(editor) {
    const { isInline } = editor
    
    editor.isInline = element => {
        return element.type === 'command-input' ? true : isInline(element)
    }
    
    return editor
}

/**
 * Test component with a static command-input already in the document
 */
export default function TestCommandInput() {
    const [showCommands, setShowCommands] = useState(false)
    const [commandPos, setCommandPos] = useState(null)
    const [activeCommandInputPath, setActiveCommandInputPath] = useState(null)
    
    const editor = useMemo(() => 
        withHistory(withCommandInput(withReact(createEditor()))), 
        []
    )
    
    // Initial value with a command-input element already inserted
    const initialValue = useMemo(() => [
        {
            type: 'paragraph',
            children: [
                { text: 'Type here before ' },
                { 
                    type: 'command-input', 
                    children: [{ text: 'forall' }] 
                },
                { text: ' and type here after' },
            ],
        },
    ], [])
    
    /**
     * Check if cursor is currently inside a command-input element
     * This is the Slate way - read from editor.selection, not DOM
     */
    const checkIfInCommandInput = useCallback(() => {
        const { selection } = editor
        
        if (!selection || !Range.isCollapsed(selection)) {
            setShowCommands(false)
            setActiveCommandInputPath(null)
            return
        }
        
        try {
            // Get the parent node at current cursor position
            const [node, path] = Editor.parent(editor, selection.focus.path)
            
            if (node.type === 'command-input') {
                setActiveCommandInputPath(path)
                
                // Calculate position for palette
                const domNode = ReactEditor.toDOMNode(editor, node)
                const rect = domNode.getBoundingClientRect()
                const distanceToBottom = window.innerHeight - rect.bottom
                
                if (distanceToBottom < 160) {
                    setCommandPos({
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        isAbove: true
                    })
                } else {
                    setCommandPos({
                        top: rect.bottom + window.scrollY,
                        left: rect.left + window.scrollX,
                        isAbove: false
                    })
                }
                
                // Show palette when typing (selection changed while in command-input)
                setShowCommands(true)
            } else {
                setShowCommands(false)
                setActiveCommandInputPath(null)
            }
        } catch (e) {
            setShowCommands(false)
            setActiveCommandInputPath(null)
        }
    }, [editor])

    /**
     * Simple LaTeX renderer for command symbols
     */
    function RenderSymbol({ latex }) {
        const symbolRef = useRef(null)

        useEffect(() => {
            if (symbolRef.current) {
                katex.render(latex, symbolRef.current, {
                    throwOnError: false,
                    displayMode: false,
                })
            }
        }, [latex])

        return <div ref={ symbolRef }></div>
    }
    
    /**
     * Slate's onChange - fired whenever content or selection changes
     * Rule 1: "If we are typing, show the list"
     */
    const handleChange = useCallback(() => {
        checkIfInCommandInput()
    }, [checkIfInCommandInput])
    
    /**
     * Handle command selection from palette
     */
    const handleCommandSelect = useCallback((cmd) => {
        if (!activeCommandInputPath) return
        
        // TODO: Replace command-input with math symbol (Step 5)
        console.log('Selected command:', cmd)
        setShowCommands(false)
    }, [activeCommandInputPath])
    
    /**
     * Callback to show palette when user clicks the backslash
     * Rule 2: "Click the \ span, show it"
     */
    const handleBackslashClick = useCallback((elementPath) => {
        console.log("Backslash clicked!")
        // Move cursor to START of command-input's first text child
        const firstTextPath = [...elementPath, 0]
        
        Transforms.select(editor, {
            anchor: { path: firstTextPath, offset: 0 },
            focus: { path: firstTextPath, offset: 0 }
        })
        
        // Force a re-check to show palette
        setTimeout(() => {
            checkIfInCommandInput()
        }, 0)
    }, [editor, checkIfInCommandInput])
    
    const renderElement = useCallback(props => {
        if (props.element.type === 'command-input') {
            // Get the path of this specific command-input element
            const elementPath = ReactEditor.findPath(editor, props.element)
            
            return (
                <CommandInput 
                    {...props} 
                    onBackslashClick={() => handleBackslashClick(elementPath)}
                />
            )
        }
        
        return <p {...props.attributes}>{props.children}</p>
    }, [handleBackslashClick, editor])
    
    /**
     * Handle arrow key navigation into command-input elements
     */
    const handleKeyDown = useCallback((event) => {
        const { selection } = editor
        
        // Only handle collapsed selections (cursor, not ranges)
        if (!selection || !Range.isCollapsed(selection)) return
        
        if (event.key === 'ArrowRight') {
            const { anchor } = selection
            const [node, path] = Editor.node(editor, anchor.path)
            
            // Are we at the end of current text node?
            if (node.text && anchor.offset === node.text.length) {
                // Get the next node in document order
                const nextEntry = Editor.next(editor, { at: path })
                
                if (nextEntry) {
                    const [nextNode, nextPath] = nextEntry
                    
                    // Is the next node a command-input?
                    if (nextNode.type === 'command-input') {
                        event.preventDefault()
                        
                        // Move cursor to the START of the command-input's first text child
                        const firstTextPath = [...nextPath, 0]
                        Transforms.select(editor, {
                            anchor: { path: firstTextPath, offset: 0 },
                            focus: { path: firstTextPath, offset: 0 }
                        })
                    }
                }
            }
        }
        
        if (event.key === 'ArrowLeft') {
            const { anchor } = selection
            const [node, path] = Editor.node(editor, anchor.path)
            
            // Are we at the start of current text node?
            if (anchor.offset === 0) {
                // Get the previous node in document order
                const prevEntry = Editor.previous(editor, { at: path })
                
                if (prevEntry) {
                    const [prevNode, prevPath] = prevEntry
                    
                    // Is the previous node a command-input?
                    if (prevNode.type === 'command-input') {
                        event.preventDefault()
                        
                        // Move cursor to the END of the command-input's last text child
                        const lastTextPath = [...prevPath, 0]
                        const lastTextNode = Node.get(editor, lastTextPath)
                        const lastOffset = lastTextNode.text ? lastTextNode.text.length : 0
                        
                        Transforms.select(editor, {
                            anchor: { path: lastTextPath, offset: lastOffset },
                            focus: { path: lastTextPath, offset: lastOffset }
                        })
                    }
                }
            }
        }
    }, [editor])


    
    return (
        <div className="w-full min-h-screen bg-black p-8">
            <h1 className="text-white text-2xl mb-4">
                Test: Command Palette
            </h1>
            <p className="text-gray-400 text-sm mb-8">
                The command palette should show when:
                <br />• Typing inside the command box
                <br />• Clicking the \ symbol
                <br />
                <br />It should hide when clicking outside.
            </p>
            
            <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
                <Editable
                    renderElement={renderElement}
                    onKeyDown={handleKeyDown}
                    className="text-white text-lg leading-relaxed outline-none"
                    placeholder="Start typing..."
                    spellCheck={false}
                />
            </Slate>
            
            {/* Command Palette */}
            {showCommands && commandPos && (
                <div
                    className="absolute command-palette overflow-y-auto max-h-46 p-2 mt-2 rounded-lg bg-gray-900 border border-gray-600 editor"
                    style={{
                        top: `${commandPos.top}px`,
                        left: `${commandPos.left}px`,
                        transform: commandPos.isAbove ? 'translateY(-105%)' : 'none'
                    }}
                >
                    {commands.map((cmd, idx) => (
                        <div
                            key={idx}
                            className="flex flex-row items-center text-white px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer"
                            onMouseDown={(e) => {
                                e.preventDefault() // Prevents selection from moving
                                handleCommandSelect(cmd)
                            }}
                        >
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded text-xl text-white">
                                <RenderSymbol latex={cmd.symbol} />
                            </div>

                            <div className="ms-3 flex flex-col">
                                <div className="text-white font-mono text-sm">
                                    {cmd.command}
                                </div>
                                <div className="text-gray-400 text-xs mt-1">
                                    {cmd.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
