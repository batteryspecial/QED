`use client`
import { RenderSymbol } from "../../lib/command/CommandList.js"
import { getTypedText, getBoldedAliasParts } from "../../lib/command/AutoComplete.js"

/**
 * CommandPalette - Dropdown list of filtered commands
 * 
 * @param {Object} props
 * @param {Array} props.filteredCommands - Array of { command, displayAlias, matchIndex }
 * @param {Object} props.position - { top, left, isAbove }
 * @param {Object} props.editor - Slate editor instance
 * @param {Array} props.activeCommandInputPath - Path to active command-input
 * @param {Function} props.onSelect - Callback when command is selected
 */
export default function CommandPalette({filteredCommands, position, editor,  activeCommandInputPath, onSelect}) {
    return (
        <>
            <div className="absolute command-palette overflow-y-auto max-h-46 p-2 mt-2 rounded-lg bg-gray-900 border border-gray-600 editor" 
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    transform: position.isAbove ? 'translateY(-120%)' : 'none'
                }}>
                {filteredCommands.map((matchData, idx) => {
                    const { command: cmd, displayAlias } = matchData
                    
                    // Get typed text and bold parts using Autocomplete helpers
                    const typedText = getTypedText(editor, activeCommandInputPath)
                    const { boldPart, normalPart, matchLength } = getBoldedAliasParts(displayAlias, typedText)
                    
                    return (
                        <div 
                            key={`${cmd.symbol}-${idx}`} 
                            className="flex flex-row items-center text-white px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer" 
                            onMouseDown={(e) => { 
                                e.preventDefault()
                                onSelect(matchData)
                            }}
                        >
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded text-xl text-white">
                                <RenderSymbol latex={cmd.symbol} />
                            </div>

                            <div className="ms-3 flex flex-col">
                                <div className="text-white font-mono text-sm">
                                    {matchLength > 0 ? (
                                        <>
                                            <span className="font-bold">{boldPart}</span>
                                            <span>{normalPart}</span>
                                        </>
                                    ) : (
                                        displayAlias
                                    )}
                                </div>
                                <div className="text-gray-400 text-xs mt-1">
                                    {cmd.description}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}