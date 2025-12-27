'use client'
import { useMemo, useCallback } from 'react'
import { createEditor, Range, Editor, Transforms } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import CommandInput from './CommandInput'

/**
 * Extend Slate to recognize command-input as an inline element
 * IMPORTANT: command-input is NON-VOID (users can type in it)
 */
function withCommandInput(editor) {
    const { isInline, isVoid } = editor
    editor.isInline = element => element.type === 'command-input' ? true : isInline(element)
    // Ensure isVoid is NOT true for command-input
    editor.isVoid = element => element.type === 'command-input' ? false : isVoid(element)
    return editor
}

/**
 * Test component with a static command-input already in the document
 */
export default function TestCommandInput() {
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
    
    const renderElement = useCallback(props => {
        if (props.element.type === 'command-input') {
            return <CommandInput {...props} />
        }
        
        return <p {...props.attributes}>{props.children}</p>
    }, [])
    
    return (
        <div className="w-full min-h-screen bg-black p-8">
            <h1 className="text-white text-2xl mb-4">
                Test: Static CommandInput Element
            </h1>
            <p className="text-gray-400 text-sm mb-8">
                The command box should behave like inline text. Try:
                <br />• Clicking before/inside/after it
                <br />• Using arrow keys to navigate
                <br />• Typing in the gray box area
                <br />• Selecting text across boundaries
            </p>
            
            <Slate editor={editor} initialValue={initialValue}>
                <Editable
                    renderElement={renderElement}
                    className="text-white text-lg leading-relaxed outline-none"
                    placeholder="Start typing..."
                    spellCheck={false}
                />
            </Slate>
        </div>
    )
}