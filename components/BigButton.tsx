import { twMerge } from 'tailwind-merge';

export default function BigButton({ children, className='', onClick }:{ children: React.ReactNode; className?: string; onClick?: ()=>void }){
  return (
    <button onClick={onClick} className={twMerge('btn text-lg md:text-xl h-16 rounded-2xl', className)}>
      {children}
    </button>
  );
}
