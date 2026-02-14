'use client'

import { useState } from "react"
import Block from '../sections/Block'
import Navbar from '../sections/Navbar'

/**
 * Manages the blocks in Block
 */
export default function BlockContainer() {
    const [blocks, setBlocks] = useState([{
        id: 1,
        content: [{
            type: 'paragraph',
            children: [{ text: 'First block, start typing...' }],
        }]
    }])

    const [selectBlock, setSelectBlock] = useState(1)

    const handleAddBlock = () => {
        const newBlock = {
            id: Date.now(),
            content: [{
                type: 'paragraph',
                children: [{ text: '' }]
            }]
        }
        setBlocks([...blocks, newBlock])
        setSelectBlock(blocks.id)
    }
    
    const handleBlockChange = (id, newcontent) => {
        setBlocks(blocks.map(b => 
            b.id === id ? {...b, content: newcontent} : b
        ))
    }
    
    return (
        <>
            <Navbar 
                onBack={() => console.log('Back')}
                onCut={() => console.log('Cut')}
                onCopy={() => console.log('Copy')}
                onPaste={() => console.log('Paste')}
                onAdd={handleAddBlock}
            />
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-y-2">
                    {blocks.map(block => (
                        <Block
                            key={block.id}
                            id={block.id}
                            content={block.content}
                            isSelected={selectBlock === block.id}
                            onSelect={() => setSelectBlock(block.id)}
                            onChange={(content) => handleBlockChange(block.id, content)}
                        />
                    ))}
                </div>
            </div>
        </>
    )
}