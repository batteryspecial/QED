'use client';

import Navbar from '../components/layout/Navbar'
import Block from '../components/layout/Block'

export default function Home() {
  return (
    <>
      <Navbar 
        onBack={() => console.log('Back')}
        onCut={() => console.log('Cut')}
        onCopy={() => console.log('Copy')}
        onPaste={() => console.log('Paste')}
        onAdd={() => console.log('Add block')}
      />
      <Block />
    </>
  );
}
