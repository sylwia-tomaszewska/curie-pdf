'use client';

import { useDebouncedCallback } from 'use-debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Zoom() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleZoom = useDebouncedCallback((search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('scale', search);
    } else {
      params.delete('scale');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 500);

  return (
    <input
      type='number'
      name='scale'
      placeholder='Zoom'
      min='0.5'
      max='3'
      step='0.1'
      onChange={(e) => handleZoom(e.target.value)}
      defaultValue={searchParams.get('scale')?.toString()}
      className='border-2 border-gray-300 rounded-md px-2 py-1'
    />
  );
}
