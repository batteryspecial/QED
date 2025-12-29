'use client'
import { useSelected, useFocused } from 'slate-react'

/**
 * CommandInput - A Discord-style inline command element
 * 
 * This is an INLINE, NON-VOID element in Slate.
 * - Inline: renders within text flow
 * - Non-void: children are editable through Slate's contentEditable
 * 
 * The "input box" appearance is pure CSS styling.
 * Users type directly into Slate's system - no separate input element.
 */
export default function CommandInput({ attributes, children, element, onBackslashClick }) {
    const selected = useSelected()
    const focused = useFocused()

    return (
        <span 
            {...attributes}
            className={`inline-flex items-center rounded-md mx-0.5 transition-all ${
                selected && focused 
                    ? 'ring-2 ring-blue-500' 
                    : 'ring-1 ring-gray-600'
            }`}>
            {/* Left side: backslash trigger */}
            <span contentEditable={false} className="bg-black text-gray-400 text-xs px-1.5 py-1 rounded-l-md select-none cursor-pointer"
                onMouseDown={(e) => {
                    e.preventDefault() // Prevent default selection behavior
                    e.stopPropagation() // Stop Slate from handling this click
                    onBackslashClick?.()
                }}>
                /
            </span>
            
            {/* Right side: editable content (controlled by Slate) */}
            <span className="bg-gray-800 text-white text-sm px-2 py-1 rounded-r-md min-w-2">
                {children}
            </span>
        </span>
    )
}