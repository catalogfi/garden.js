import React from 'react'
import { useState } from 'react'

interface HeaderProps {
    bgcolor?: string; // Ensure this is correctly typed as string
  }
  export default function Header({ bgcolor }: HeaderProps) { // Destructure props here
    const [count, setCount] = useState(0);
    return (
      <div className={`w-full ${bgcolor} p-10`}>
        <button className="font-semibold bg-yellow-400" onClick={() => setCount(count + 1)}>Click me {count}</button>
      </div>
    );
  }
