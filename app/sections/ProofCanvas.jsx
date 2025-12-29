'use client';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, Editable, withReact, useFocused, useSelected } from 'slate-react';

import katex from 'katex';
import 'katex/dist/katex.min.css';

import './canvas.css'

// --- 1. Move Static Definitions Outside ---
// Keeping this stable prevents re-allocation during HMR
const HMR_ID = Math.random() // Optional. A randomly generated ID on every browser reload

const INITIAL_VALUE = [{
    type: 'paragraph',
    children: [
        { text: 'Type here ' },
        { type: 'math', latex: '\\forall x \\in \\mathbb{Z}', children: [{ text: '' }] },
        { text: ' continue typing' },
    ],
}];

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
    <span {...attributes} contentEditable={false} className={`relative inline-flex items-center rounded-md select-none -my-1 ${selected && focused ? 'ring-1 ring-blue-500' : ''}`} style={{ verticalAlign: 'middle' }}>
        {/* Visible Content */}
        <span ref={ref} contentEditable={false} />

        {/* Void Anchor - Kept invisible but technically present for cursor */}
        <span style={{ position: 'absolute', opacity: 0, fontSize: 0 }}>
            {children}
        </span>
    </span>
  )
}

function withMath(editor) {
    const { isInline, isVoid } = editor
    editor.isInline = element => element.type === 'math' ? true : isInline(element)
    editor.isVoid = element => element.type === 'math' ? true : isVoid(element)
    return editor
}

export default function ProofCanvas() {
    // --- 2. Use Lazy State for Editor Stability ---
    // This runs exactly once and persists better than useMemo during HMR
    const editor = useMemo(() => 
        withHistory(withMath(withReact(createEditor()))), 
    [HMR_ID]);

    const renderElement = useCallback((props) => {
        if (props.element.type === 'math') {
            return <MathElement {...props} />
        }
        return <p {...props.attributes} className="mb-2">{props.children}</p>
    }, [])

    return (
        <div className="w-full min-h-screen bg-black p-8">
            <Slate key={HMR_ID} editor={editor} initialValue={INITIAL_VALUE}>
                <Editable 
                    renderElement={renderElement}
                    className="text-white text-lg leading-relaxed outline-none caret-white"
                    placeholder="Start typing your proof..."
                    spellCheck={false} // Helps prevent browser interference
                />
            </Slate>
        </div>
    );
}