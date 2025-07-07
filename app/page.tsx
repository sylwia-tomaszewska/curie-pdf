'use client';

import dynamic from 'next/dynamic';
import Search from './components/Search';

const PdfViewer = dynamic(() => import('@/app/components/PdfViewer'), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main className='flex flex-col'>
      <h1 className='text-2xl font-bold text-center mt-4'>Bitcoin Whitepaper - Strona 1</h1>
      <div className='w-full flex justify-center py-4'>
        <Search />
      </div>
      <PdfViewer />
    </main>
  );
}
