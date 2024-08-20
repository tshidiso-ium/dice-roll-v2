import logo from './logo.svg';
import './App.css';
import NavMobile from './components/header/header'
import Playersboard from './components/players/playersBoard';
import GameInfo from './components/gameInfo/gameInfo';
import DiceRoller from './components/dice/dice';
import React, { useState, useEffect } from 'react';

function App() {
  const [myScore, setMyScore] = useState(0)

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
  return (
    <div className="App">
      <NavMobile/>
      <GameInfo myScore= {myScore}/>
      <Playersboard/>
      <DiceRoller updateMyScore={handleScoreChange}/>
    </div>
  );
}

export default App;
