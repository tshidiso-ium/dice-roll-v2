
import Boards from '../components/boards/boards';
import Game from '../components/game/game';
import React, { useState, useEffect } from 'react';
import NavMobile from '../components/header/header'

export default function HomePage({userLoggedOut, redirect}){
  const [joinedBoard, setJoinedBoard] = useState('');
  const [playAgain, setPlayAgain] = useState(null);
  const [userLogedIn, setUserLogedIn] = useState(false);

  const onRedirect = (href) => {
        console.log("Home page on redirect")
        redirect(href)
  }

  const onUserLogout  = () => {
        console.log("User log out")
        localStorage.removeItem("userId");
        localStorage.removeItem("idToken");
        userLoggedOut();
    };

  const onJoinedBoard = (betAmount , boardId)  => {
        console.log("Board Joined");
        setJoinedBoard(true)
        localStorage.setItem("joinedBoard", boardId );
        localStorage.setItem("betAmount", betAmount );
    };

  const onGameConclusion = (res) => {
        console.log("Game res: ",res)
        console.log("Game Conclusion");
        if(res === 0){
        setJoinedBoard('');
        setPlayAgain(0);
        }
        else{
            setJoinedBoard('');
            setPlayAgain(res);
        }
    }

  return (
    <div className="h-screen bg-gradient-to-r from-black via-red-900 to-black text-yellow-300 font-mono">
        <NavMobile userLogedOut = {onUserLogout}  redirect={onRedirect}/>
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