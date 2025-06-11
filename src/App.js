import logo from './logo.svg';
import './App.css';
import NavMobile from './components/header/header'
import Playersboard from './components/players/playersBoard';
import GameInfo from './components/gameInfo/gameInfo';
import DiceRoller from './components/dice/dice';
import Login from './components/login/login';
import Register from './components/register/register';
import Boards from './components/boards/boards';
import Game from './components/game/game';
import React, { useState, useEffect } from 'react';

function App() {
  const [joinedBoard, setJoinedBoard] = useState('');
  const [playAgain, setPlayAgain] = useState(null);
  const [userLogedIn, setUserLogedIn] = useState(false)


 const onUserLogin = (userInfo) => {
  console.log(userInfo)
  if(userInfo.user){
    const user = userInfo.user
    const idToken =  userInfo._tokenResponse;
    localStorage.setItem("userId", user.uid );
    localStorage.setItem("idToken", idToken.idToken );
            // localStorage.setItem("userId", "admin" );
    setUserLogedIn(true)
  }
 }

  const onUserLogout = () => {
    setUserLogedIn(false)
 }

 const onJoinedBoard = (boardId)  => {
    console.log("Board Joined");
    setJoinedBoard(boardId)
    localStorage.setItem("joinedBoard", boardId );
 }

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
    <div className="App">
    {/* <Register/>    */}
      {
         
        userLogedIn ? 
          <>                
          <NavMobile userLogedOut = {onUserLogout}/>
            {
              joinedBoard ? 
              <>
                <Game gameConclusion ={onGameConclusion}/>
              </>
              :
              <>            
                <Boards boardJoined = {onJoinedBoard} playAgain ={playAgain}/>
              </>
            }
            

            {/* <GameInfo myScore= {myScore}/> */}

            {/* <Playersboard/> */}
            {/* <DiceRoller updateMyScore={handleScoreChange}/>  */}
            {/* <GameInfo myScore= {myScore}/>
            <DiceRoller updateMyScore={handleScoreChange}/>               */}
          </>

          :
          <>
             <Login userLogedIn = {onUserLogin}/>
          </>
  
      }
    </div>
  );
}

export default App;
