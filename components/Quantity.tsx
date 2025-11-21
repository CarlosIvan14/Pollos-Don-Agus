'use client'
export default function Quantity({ value, onChange }:{ value:number; onChange:(n:number)=>void }){
  return (
    <div className="flex items-center gap-2">
      <button className="btn px-3 py-2" onClick={()=>onChange(Math.max(0, value-1))}>-</button>
      <div className="min-w-[3ch] text-center text-xl">{value}</div>
      <button className="btn px-3 py-2" onClick={()=>onChange(value+1)}>+</button>
    </div>
  )
}
