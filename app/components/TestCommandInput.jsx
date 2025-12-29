'use client'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { createEditor, Editor, Range, Transforms, Node, Path } from 'slate'
import { Slate, Editable, withReact, ReactEditor, useSelected, useFocused } from 'slate-react'
import { withHistory } from 'slate-history'

import katex from 'katex'
import 'katex/dist/katex.min.css'

import CommandInput from '../components/CommandInput'
import { commands } from '../../lib/command/CommandList.js'
import { parseCommandToLatex } from '../../lib/command/CommandParser.js'
import { withCommandInput } from '../../lib/command/CommandInline.js'

import '../sections/canvas.css'

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

    return <div ref={symbolRef}></div>
}

/**
 * MathElement - Renders inline LaTeX math symbols
 * This is a VOID inline element (no editable children)
 */
function MathElement({ attributes, element, children }) {
    const ref = useRef(null)
    const selected = useSelected()
    const focused = useFocused()

    useEffect(() => {
        if (ref.current) {
            katex.render(element.latex, ref.current, {
                throwOnError: false,
                displayMode: false,
            })
        }
    }, [element.latex])

    return (
        <span 
            {...attributes} 
            contentEditable={false} 
            className={`relative inline-flex items-center rounded-md select-none -my-1 ${
                selected && focused ? 'ring-1 ring-blue-500' : ''
            }`} 
            style={{ verticalAlign: 'middle' }}
        >
            {/* Visible LaTeX Content */}
            <span ref={ref} contentEditable={false} />

            {/* Void Anchor - invisible but required for Slate cursor */}
            <span style={{ position: 'absolute', opacity: 0, fontSize: 0 }}>
                {children}
            </span>
        </span>
    )
}

/**
 * Test component for CommandInput functionality
 */
export default function TestCommandInput() {
    const [showCommands, setShowCommands] = useState(false)
    const [commandPos, setCommandPos] = useState(null)
    const [activeCommandInputPath, setActiveCommandInputPath] = useState(null)
    
    const editor = useMemo(() => {
        const e = withHistory(withCommandInput(withReact(createEditor())))
        
        // Extend to recognize math as inline void element
        const { isInline, isVoid } = e
        e.isInline = element => element.type === 'math' ? true : isInline(element)
        e.isVoid = element => element.type === 'math' ? true : isVoid(element)
        
        return e
    }, [])
    
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
        if (props.element.type === 'math') {
            return <MathElement {...props} />
        }
        
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
     * Handle keyboard navigation and command parsing
     * - Arrow keys: Navigate into/out of command-input elements naturally
     * - Space key: Convert command-input to math symbol when pressed after component
     */
    const handleKeyDown = useCallback((event) => {
        const { selection } = editor
        
        // Only handle collapsed selections (cursor, not ranges)
        if (!selection || !Range.isCollapsed(selection)) return
        
        /**
         * Space key: Convert command-input to math symbol
         * Triggers when space is pressed immediately after a command-input element
         */
        if (event.key === ' ') {
            const { anchor } = selection
            const [node, path] = Editor.node(editor, anchor.path)
            
            // Check if we're at the start of a text node (position 0)
            if (anchor.offset === 0) {
                // Look at the previous node
                const prevEntry = Editor.previous(editor, { at: path })
                
                if (prevEntry) {
                    const [prevNode, prevPath] = prevEntry
                    
                    // Is it a command-input?
                    if (prevNode.type === 'command-input') {
                        event.preventDefault()
                        
                        // Get the text content from the command-input
                        const commandText = Node.string(prevNode)
                        
                        // Parse it to LaTeX
                        const latexSymbol = parseCommandToLatex(commandText, commands)
                        
                        // Replace command-input with math node at current cursor position
                        Transforms.removeNodes(editor, { at: prevPath })
                        Transforms.insertNodes(editor, {
                            type: 'math',
                            latex: latexSymbol,
                            children: [{ text: '' }]
                        })
                        
                        // Insert the space as regular text after the math node
                        //Transforms.insertText(editor, ' ')
                        
                        return
                    }
                }
            }
        }
        
        /**
         * Arrow Right: Navigate into command-input when at boundary
         * Fixes the "double skip" when entering component from the left
         */
        if (event.key === 'ArrowRight') {
            const { anchor } = selection
            const [node, path] = Editor.node(editor, anchor.path)
            
            // Case 1: Exiting command-input from inside
            // Check if we're at the END of a text node inside a command-input
            try {
                const [parentNode, parentPath] = Editor.parent(editor, path)
                if (parentNode.type === 'command-input' && anchor.offset === node.text.length) {
                    event.preventDefault()
                    
                    // Move to the position immediately AFTER the command-input
                    const afterPoint = Editor.after(editor, parentPath)
                    if (afterPoint) {
                        Transforms.select(editor, afterPoint)
                    }
                    return
                }
            } 
            catch (e) {
                // Not in a command-input, continue
            }
            
            // Case 2: Entering command-input from outside (existing logic)
            if (node.text && anchor.offset === node.text.length) {
                const nextEntry = Editor.next(editor, { at: path })
                
                if (nextEntry) {
                    const [nextNode, nextPath] = nextEntry
                    
                    if (nextNode.type === 'command-input') {
                        event.preventDefault()
                        
                        const firstTextPath = [...nextPath, 0]
                        Transforms.select(editor, {
                            anchor: { path: firstTextPath, offset: 0 },
                            focus: { path: firstTextPath, offset: 0 }
                        })
                    }
                }
            }
        }
        /**
         * Arrow Left: Navigate into command-input when at boundary
         * Fixes the "double skip" when entering component from the right
         */
        if (event.key === 'ArrowLeft') {
            const { anchor } = selection
            const [node, path] = Editor.node(editor, anchor.path)

            // Case 1: Exiting command-input from inside (going left)
            // Check if we're at the START of a text node inside a command-input
            try {
                // Parent to position of current cursor
                const [parentNode, parentPath] = Editor.parent(editor, path)
                // inside of command input & cursor is at an extrema
                if (parentNode.type === 'command-input' && anchor.offset === 0) {
                    event.preventDefault()

                    // Move to the position immediately BEFORE the command-input
                    const beforePoint = Editor.before(editor, parentPath)
                    if (beforePoint) {
                        Transforms.select(editor, beforePoint)
                    }
                    return
                }
            }
            catch (e) {
                // Not in a command-input, continue
            }

            // Case 2: Entering command-input from outside (existing logic)
            if (anchor.offset === 0) {
                const prevEntry = Editor.previous(editor, { at: path })
                
                if (prevEntry) {
                    const [prevNode, prevPath] = prevEntry
                    
                    if (prevNode.type === 'command-input') {
                        event.preventDefault()
                        
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
                                    {cmd.command[0]}
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
