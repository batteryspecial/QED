'use client';
import { useState, useEffect } from 'react';

import { IoArrowBackSharp } from "react-icons/io5";
import { FaCopy } from "react-icons/fa";
import { FaCut } from "react-icons/fa";
import { FaPaste } from "react-icons/fa";
import { IoAdd } from "react-icons/io5";



export default function Navbar({ onBack, onCopy, onCut, onPaste, onAdd }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder with same dimensions during SSR
  if (!mounted) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2">
        <div 
          className="relative flex items-center justify-center overflow-hidden"
          style={{ width: '600px', height: '56px', borderRadius: '9999px' }}
        />
      </div>
    );
  }

  return (
    <div className="fixed top-6 start-7.5 z-10">
      <div className='backdrop-blur-md bg-white/10 border border-white/20 shadow-xl rounded-full'>
        <div className="w-full px-8">
          <nav className="h-full flex items-center justify-between gap-12">
            <ul className="flex items-center gap-10">
              <li>
                <a className="transition text-sm" href="#">
                  <IoArrowBackSharp />
                </a>
              </li>
              <li>
                <a className="transition text-sm" href="#">
                  <FaCopy />
                </a>
              </li>
              <li>
                <a className="transition text-sm" href="#">
                  <FaCut />
                </a>
              </li>
              <li>
                <a className="transition text-sm" href="#">
                  <FaPaste />
                </a>
              </li>
            </ul>
            
            <button type="button" className="text-gray-700 text-sm transition-all end-0 h-9 rounded-full">
              <a onClick={onAdd} className='cursor-pointer'>
                <IoAdd />
              </a>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
