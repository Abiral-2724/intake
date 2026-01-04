import React from 'react';
import LoaderOne from './Loader-one';
import { HandWrittenTitle } from './HandWrittenText';


export default function LoadingPage() {
  return (
    <div className="h-screen flex justify-center align-bottom flex-col bg-gray-50">
      
        <HandWrittenTitle title="intake*" subtitle="A smarter way to ask" ></HandWrittenTitle>
      
        
        <LoaderOne />
      
    </div>
  );
}