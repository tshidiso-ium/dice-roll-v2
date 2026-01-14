import GameInfo from "../gameInfo/gameInfo";
import Playersboard from "../players/playersBoard";
import DiceRoller from "../dice/dice";
import react, { useEffect, useState } from "react";
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';
import PlayAgain from "../PopupVariant/popupVariant";

function Game ({gameConclusion}) {
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

    const [data, setData] = useState(null);
    const [gameInfo, setGameInfo] = useState('');
    const [userInfo, setUserInfo] = useState('');
    var betAmount = localStorage.getItem("betAmount");
    var boardId = localStorage.getItem("joinedBoard");
    const [modalState, setStateModal] = useState({
        showModal: false,
        text: "",
        title: "",
        icon: "",
        options: false,
    });
    const [selectOption, setSelectOption] = useState();

    useEffect(() => {
        // Reference to the Firebase database path you want to listen to
        const dataRef = ref(database, `boards/live/${betAmount}/${boardId}`);
        console.log("Data ref:", dataRef)
        // Listener for real-time updates
        const handleDataChange = (snapshot) => {
            setData(snapshot.val());
        };

        // Attach listener
        onValue(dataRef, handleDataChange);

        // Cleanup listener on unmount
        return () => {
            off(dataRef, 'value', handleDataChange);
        };
    }, []);

    useEffect(()=> {
        if(data){
            setGameInfo(data);
            const user = data.players
            console.log(user)
            const id = localStorage.getItem("userId" );;
            // setUserInfo(getDataById(user, id))

            if(data.winnerIs){
                console.log("Winner: ", data.winnerIs);
                if(data.winnerIs.playerId ===id)
                {
                    setStateModal({
                        showModal: true,
                        text: `The winer is ${data.winnerIs.playerName}`,
                        title: "WELL DONE!",
                        icon: "warn",
                        options: true,
                        winer: data.winnerIs,
                        id: id
                    });
                }
                else {
                    setStateModal({
                        showModal: true,
                        text: `The winer of the game is ${data.winnerIs.playerName}`,
                        title: "TOUGH LUCK",
                        icon: "warn",
                        options: true,
                        winer: data.winnerIs,
                        id: id
                    });
                }

            }
        }
    }, [data]);

    function handleOptionSelect(optionSelected) {
        console.log("Option Selected: ", optionSelected);
        console.log(optionSelected);
        console.log("modal state: ", modalState);
        gameConclusion(optionSelected)
    }

    return (
        <div className="bg-gradient-to-r from-black via-red-900 to-black bg-opacity-90">         
            <PlayAgain modalState={modalState} joinRandomBoard={handleOptionSelect} />
            <GameInfo myScore= {myScore} />
            <Playersboard/> 
            <DiceRoller updateMyScore={handleScoreChange}/>
        </div>
    )
}

export default Game; 

