import logo from './logo.svg';
import './App.css';
import NavMobile from './components/header/header'
import Playersboard from './components/players/playersBoard';
import GameInfo from './components/gameInfo/gameInfo';
import DiceRoller from './components/dice/dice';
import Login from './components/login/login';
import Register from './components/register/register';
import React, { useState, useEffect } from 'react';

function App() {
  const [myScore, setMyScore] = useState(0)
  const [userLogedIn, setUserLogedIn] = useState(false)
  const handleScoreChange = (score) => {
    console.log(score);
    if (score === 7) {
      setMyScore(0)
    }else{
      setTimeout( () => {
        setMyScore(myScore + score) 
    }, 1000)
    }
 }

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
  return (
    <div className="App">
      {/* <Register/> */}   
      {
         
        userLogedIn ? 
          <>
            <NavMobile userLogedOut = {onUserLogout}/>
            <GameInfo myScore= {myScore}/>
            <Playersboard/>
            <DiceRoller updateMyScore={handleScoreChange}/> 

            {/* 
              <GameInfo myScore= {myScore}/>
              <DiceRoller updateMyScore={handleScoreChange}/> 
            */}
          </>
          :
          <Login userLogedIn = {onUserLogin}/>
      }
    </div>
  );
}

export default App;
