'use client';
import { useMemo, useEffect, useRef } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact, useFocused, useSelected } from 'slate-react';
import { withHistory } from 'slate-history';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function MathElement({ attributes, children, element }) {
  const ref = useRef(null)
  const selected = useSelected()
  const focused = useFocused()
  
  useEffect(() => {
    if (ref.current) {
      katex.render(element.latex, ref.current, {
        throwOnError: false,
        displayMode: false,
      });
    }
  }, [element.latex]);

  return (
    <span
        {...attributes}
        contentEditable={false}
        className={`p-0 text-[18px] rounded-sm select-none ${
            selected && focused ? 'shadow-[0_0_0_2px_#30C5FF]' : ''
        }`}
    >
      <span ref={ref} className="inline-block"></span>
      {children}
    </span>
  )
}

export default function ProofCanvas() {
  const editor = useMemo(() => {
    const e = withHistory(withReact(createEditor()));
    
    // Tell Slate which nodes are void (atomic/non-editable)
    const { isInline, isVoid } = e;
    
    e.isInline = (element) => {
      return element.type === 'math' ? true : isInline(element);
    };
    
    e.isVoid = (element) => {
      return element.type === 'math' ? true : isVoid(element);
    };
    
    return e;
  }, []);
  
  const initialValue = useMemo(() => [
    {
      type: 'paragraph',
      children: [
        { text: 'Type here: ' },
        { type: 'math', latex: '\\forall', children: [{ text: '' }] },
        { text: ' and here ' },
        { type: 'math', latex: '\\mathbb{Z}', children: [{ text: '' }] },
        { text: ' continue typing' },
      ],
    },
  ], []);

  const renderElement = (props) => {
    if (props.element.type === 'math') {
      return <MathElement {...props} />;
    }
    return <p {...props.attributes}>{props.children}</p>;
  };

  return (
    <div className="w-full min-h-screen bg-black p-8">
      <Slate editor={editor} initialValue={initialValue}>
        <Editable 
          renderElement={renderElement}
          className="text-white text-lg leading-relaxed outline-none caret-white"
          placeholder="Start typing your proof..."
        />
      </Slate>
    </div>
  );
}

