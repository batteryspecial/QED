'use client'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { createEditor, Editor, Range, Transforms, Node, Path } from 'slate'
import { Slate, Editable, withReact, ReactEditor, useSelected, useFocused } from 'slate-react'
import { withHistory } from 'slate-history'

import katex from 'katex'
import 'katex/dist/katex.min.css'

import CommandInput from '../components/command/CommandInput.jsx'
import { handleKeyPress } from '../../lib/keybinds/KeyDown.js'
import { commands, nodisplay } from '../../lib/command/CommandList.js'
import { filterCommands, handleCommandSelection } from '../../lib/command/AutoComplete.js'
import { withCommandInput, getCommandInputContext, getCommandInputText, shouldShowAutocomplete } from '../../lib/command/CommandInline.js'
import CommandPalette from '../components/command/CommandPalette.jsx'

import './canvas.css'

// A randomly generated ID on every browser reload (Next.js Hot Module Reload to enforce modifications to MathNodes)
const HMR_ID = Math.random() 

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
        <span {...attributes} contentEditable={false} className={`relative inline-flex items-center rounded-md select-none -my-1 align-middle ${ (selected && focused) ? 'ring-1 ring-blue-500' : '' }`}>
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
 * Component for CommandInput functionality
 */
export default function BlockEditor() {
    const [showCommands, setShowCommands] = useState(false)
    const [commandPos, setCommandPos] = useState(null)
    const [activeCommandInputPath, setActiveCommandInputPath] = useState(null)
    const [filteredCommands, setFilteredCommands] = useState([]) // Filtered commands
    const [selectedIndex, setSelectedIndex] = useState(0) // For arrow key navigation
    
    const editor = useMemo(() => {
        const e = withHistory(withCommandInput(withReact(createEditor())))
        
        // Extend to recognize math as inline void element
        const { isInline, isVoid } = e
        e.isInline = element => (element.type === 'math') ? true : isInline(element)
        e.isVoid = element => (element.type === 'math') ? true : isVoid(element)
        
        return e
    }, [HMR_ID])
    
    // Initial value with a command-input element already inserted
    const initialValue = useMemo(() => [
        {
            type: 'paragraph',
            children: [
                { 
                    text: 'Type here before ' 
                },
                { 
                    type: 'command-input', 
                    children: [{ text: 'forall' }] 
                },
                { 
                    text: ' and type here after' 
                },
            ],
        },
    ], [])
    
    /**
     * Check if cursor is currently inside a command-input element
     * Updates autocomplete state based on cursor position
     */
    const checkIfInCommandInput = useCallback(() => {
        const context = getCommandInputContext(editor)
        
        if (context.isInCommandInput) {
            setActiveCommandInputPath(context.path)
            setCommandPos(context.position)
            
            // Filter commands based on current input
            const inputText = getCommandInputText(context.node)
            const filtered = filterCommands(commands, inputText)
            //console.log('matches from filterCommands:', filtered, 'is array?', Array.isArray(filtered))
            setFilteredCommands(filtered)
            
            // Reset selection if it's out of bounds
            setSelectedIndex(prev => prev >= filtered.length ? 0 : prev)
            
            // Show palette
            setShowCommands(shouldShowAutocomplete(filtered, true))
        } else {
            setShowCommands(false)
            setActiveCommandInputPath(null)
            setSelectedIndex(0)
        }
    }, [editor])

    /**
     * Slate's onChange fires whenever content or selection changes
     * Rule 1: "If we are typing, show the list"
     */
    const handleChange = useCallback(() => {
        checkIfInCommandInput()
    }, [checkIfInCommandInput])
    
    /**
     * Handle command selection from palette
     * Uses Autocomplete module function
     */
    const handleCommandSelect = useCallback((matchData) => {
        handleCommandSelection(editor, activeCommandInputPath, matchData, setShowCommands)
    }, [activeCommandInputPath, editor])
    
    /**
     * Callback to show palette when user clicks the backslash
     * Rule 2: "Click the / span, show it"
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
        setTimeout(() => { checkIfInCommandInput()}, 0)
    }, [editor, checkIfInCommandInput])
    
    const renderElement = useCallback(props => {
        if (props.element.type === 'math') {
            return <MathElement {...props} />
        }
        
        if (props.element.type === 'command-input') {
            // Get the path of this specific command-input element
            const elementPath = ReactEditor.findPath(editor, props.element)
            
            return (
                <CommandInput {...props} onBackslashClick={() => handleBackslashClick(elementPath)}/>
            )
        }
        
        return (<p {...props.attributes}>{props.children}</p>)
    }, [handleBackslashClick, editor])
    
    /**
     * Handle keyboard navigation and command parsing
     * - Arrow keys: Navigate in/out of command-input elements naturally
     * - Space key: Convert command-input to math symbol when pressed after component
     */
    const handleKeyDown = useCallback((event) => {
        const { selection } = editor
        
        // Only handle collapsed selections (cursor, not ranges)
        if (!selection || !Range.isCollapsed(selection)) return
        
        // just ONE LINE for all key handlers:
        if (handleKeyPress(event.key, editor, selection)) {
            event.preventDefault()
        }
    }, [editor])

    /**
     * The HTML section
     * - Fully black background, pre-rendered text
     * - Written in Slate.js, includes the command list UI
     */
    return (
        <div className="p-8 bg-[#fcfcfc]">
            <Slate key={HMR_ID} editor={editor} initialValue={initialValue} onChange={handleChange}>
                <Editable
                    renderElement={renderElement}
                    onKeyDown={handleKeyDown}
                    className="text-lg leading-relaxed outline-none"
                    placeholder="Start typing..."
                    spellCheck={false}
                />
            </Slate>
            
            {/* Command Palette */}
            {showCommands && commandPos && filteredCommands.length > 0 && (
                <CommandPalette
                    filteredCommands={filteredCommands}
                    position={commandPos}
                    editor={editor}
                    nodisplay={nodisplay}
                    activeCommandInputPath={activeCommandInputPath}
                    onSelect={handleCommandSelect}
                />
            )}
        </div>
    )
}
