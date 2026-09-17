import GameInfo from "../gameInfo/gameInfo";
import Playersboard from "../players/playersBoard";
import DiceRoller from "../dice/dice";
import { useEffect, useRef, useState } from "react";
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';
import PlayAgain from "../PopupVariant/popupVariant";
import { getUserId } from "../../modules/sessionStorage";

function Game ({gameConclusion}) {
    const [data, setData] = useState(null);
    const shownWinnerRef = useRef(null);
    const betAmount = localStorage.getItem("betAmount");
    const boardId = localStorage.getItem("joinedBoard");
    const [modalState, setStateModal] = useState({
        showModal: false,
        text: "",
        title: "",
        icon: "",
        options: false,
    });
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
    }, [betAmount, boardId]);

    useEffect(()=> {
        let modalTimer;
        if (data) {
        const id = getUserId();

        if (data.winnerIs && shownWinnerRef.current !== data.winnerIs.playerId) {
            shownWinnerRef.current = data.winnerIs.playerId;
            const isWinner = data.winnerIs.playerId === id;

            // wait 2 seconds before showing the modal
            modalTimer = window.setTimeout(() => {
            if (isWinner) {
                setStateModal({
                showModal: true,
                text: `The winner is ${data.winnerIs.playerName}`,
                title: "WELL DONE!",
                icon: "warn",
                options: true,
                winer: data.winnerIs,
                id: id,
                });
            } else {
                setStateModal({
                showModal: true,
                text: `The winner of the game is ${data.winnerIs.playerName}`,
                title: "TOUGH LUCK",
                icon: "warn",
                options: true,
                winer: data.winnerIs,
                id: id,
                });
            }
            }, 2000); // 2000ms = 2 seconds
        }
        }
        return () => {
            if (modalTimer) window.clearTimeout(modalTimer);
        };
    }, [data]);

    function handleOptionSelect(optionSelected) {
        gameConclusion(optionSelected)
    }

    return (
        <div className="bg-gradient-to-r from-black via-red-900 to-black bg-opacity-90">         
            <PlayAgain modalState={modalState} joinRandomBoard={handleOptionSelect} />
            <GameInfo />
            <Playersboard/> 
            <DiceRoller />
        </div>
    )
}

export default Game; 

