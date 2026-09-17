import { useLocation } from "react-router-dom";
import Boards from '../components/boards/boards';
import Game from '../components/game/game';
import React, { useState } from 'react';
import NavMobile from '../components/header/header'
import { clearAuthSession } from '../modules/sessionStorage';

export default function HomePage({userLoggedOut, redirect}){
  const [joinedBoard, setJoinedBoard] = useState('');
  const [playAgain, setPlayAgain] = useState(null);
  const location = useLocation();
  const onRedirect = (href) => {
        redirect(href)
  }

  const onUserLogout  = () => {
        clearAuthSession();
        localStorage.removeItem("userEmail");
        userLoggedOut();
    };

  const onJoinedBoard = (betAmount , boardId)  => {
        setJoinedBoard(true)
        localStorage.setItem("joinedBoard", boardId );
        localStorage.setItem("betAmount", betAmount );
    };

  const onGameConclusion = (res) => {
        clearGameStorage();
        if(res === 0){
            setJoinedBoard('');
            setPlayAgain(null);
        }
        else{
            setJoinedBoard('');
            setPlayAgain(res);       
        }
    }

    function clearGameStorage() {
        try {
            localStorage.removeItem("joinedBoard");
            localStorage.removeItem("betAmount");
        } catch (err) {
            console.error("Error clearing localStorage", err);
        }
    }

  return (
    <div className="h-screen bg-gradient-to-r from-black via-red-900 to-black text-yellow-300 font-mono">
        <div className="overflow-hidden">
            <NavMobile userLogedOut = {onUserLogout}  redirect={onRedirect} currentPath={location.pathname}/>
        </div>
        {
            joinedBoard ? 
                <>
                    <Game gameConclusion ={onGameConclusion}/>
                </>
            :
                <>            
                    <Boards boardJoined = {onJoinedBoard} playAgain={playAgain}/>
                </>
        }
    </div>
  );
}
