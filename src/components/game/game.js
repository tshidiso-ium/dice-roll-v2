import GameInfo from "../gameInfo/gameInfo";
import Playersboard from "../players/playersBoard";
import DiceRoller from "../dice/dice";
import react, { useEffect, useState } from "react";

function Game ({joinedBoard}) {
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
        <>            
            <GameInfo myScore= {myScore}/>
            <Playersboard/> 
            <DiceRoller updateMyScore={handleScoreChange}/>
     
        </>
    )
}

export default Game;

