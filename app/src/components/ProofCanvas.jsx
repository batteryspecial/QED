'use client';
import { useEffect, useRef } from 'react'
import katex from 'katex'

import './canvas.css'

export default function ProofCanvas() {
    const testRef = useRef(null);

    useEffect(() => {
        if (testRef.current) {
            katex.render('\\forall x \\in \\mathbb{N}', testRef.current);
        }
    }, [])

    return (
        <div className="w-full min-h-screen bg-black p-8">
            <div ref={testRef} style={{color: '#fff', marginBottom: '2rem'}}></div>
            <div
                contentEditable={true}
                className="editor text-[18px]/[1.6] text-white outline-none caret-white"
                suppressContentEditableWarning={true}    
            >
            </div>
        </div>
    )
}