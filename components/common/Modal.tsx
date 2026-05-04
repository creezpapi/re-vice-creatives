'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export default function Modal({ onClose, children, wide }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={'mx-auto my-12 rounded-2xl bg-white p-6 shadow-lg relative ' + (wide ? 'max-w-screen-lg' : 'max-w-screen-md')}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-rv-gray flex items-center justify-center hover:opacity-70 transition-all duration-250 active:scale-95"
        >
          <X size={16} strokeWidth={1.6} />
        </button>
        {children}
      </div>
    </div>
  );
}
