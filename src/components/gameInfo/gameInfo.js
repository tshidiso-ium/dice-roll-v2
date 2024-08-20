import { useEffect, useState } from 'react';



export default function GameInfo ({myScore}) {
    return ( 
    <>
        <div className='relativ bg-opacity-75 min-w-[100%]'>
            <div className={`grid grid-cols-3 h-[35px] space-y-0 w-full mt-0`}>
                <label htmlFor="fullname" className="text-balance pl-[2%] content-center text-">Score</label>
                <label htmlFor="position" className="text-balance pl-[2%] content-center text-lg">Bet</label>
                <label htmlFor="Department" className="text-balance pl-[2%] content-center text-lg">Stake</label>
            </div>
            <div className={`grid grid-cols-3 h-[35px] space-y-0 w-full mt-0`}>
                <h1 htmlFor="fullname" className="text-balance pl-[2%] content-center text-sm">{myScore}</h1>
                <h1 htmlFor="position" className="text-balance pl-[2%] content-center text-sm ">R20</h1>
                <h1 htmlFor="Department" className="text-balance pl-[2%] content-center text-sm ">R180</h1>
            </div>
            <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent mb-0 h-[1px] w-full" />
        </div>
    </>
    )
}


