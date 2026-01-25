'use client'
import BlockEditor from '../../canvas/BlockEditor'

/**
 * Block - A Jupyter-style cell with blue indicator bar
 * Contains a BlockEditor (Slate instance)
 */
export default function Block({id, isSelected, onSelect, onChange}) {
    return (
        <>
            <div className='mt-12 lg:p-10 flex' onClick={onSelect}>
                <div className={`w-1 transition-colors ${
                    isSelected ? 'bg-blue-500' : 'bg-transparent'
                }`}></div>

                <div className='flex-1 p-4 border border-l-0 border-gray-300 rounded-r bg-white'>
                    <BlockEditor 
                        onChange={onChange}
                        onFocus={onSelect}
                    />
                </div>
            </div>
        </>
    )
}