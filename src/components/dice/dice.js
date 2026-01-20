import React, { useEffect, useState, useRef } from 'react';
// import Image from 'next/image';
import Dice from 'react-dice-roll';
import  './home.css';
import { database } from '../../modules/firebase';
import { getDatabase, ref, update, onValue, off } from 'firebase/database';

export default function DiceRoller({updateMyScore}) {
  const [userData, setUserData] = useState('');
  const [data, setData] = useState(null);
  const [rollingData, setRollingData] = useState({id: "", onRole: "false", userName: ""});
  const [dice1, setDice1] = useState(0);
  const [dice2, setDice2] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [canVibrat, setCanVibrate] = useState('');
  const diceRef = useRef(null);
  const diceRef2 = useRef(null)
  //clear storage once playing again
  var userId = localStorage.getItem("userId" );
  var boardId = localStorage.getItem("joinedBoard");
  var betAmount = localStorage.getItem("betAmount");
  var userRef = ref(database, `boards/live/${betAmount}/${boardId}/players/${userId}`); 

  useEffect( () => {
    getScore();
    if ('vibrate' in navigator) {
      console.log('Vibration API supported, vibrating...');
      // Trigger vibration for 500ms
      //navigator.vibrate(500);
      setCanVibrate("Vibration API supported, vibrating...")
    } else {
      console.log('Vibration API not supported on this device.');
      setCanVibrate("Vibration API not supported")
    }
  }, []);

  useEffect(() => {
    console.log("userData changed:", userData);
    if( userData && userData.status === "Rolling"){
        diceRef.current.rollDice();
        diceRef2.current.rollDice();
        updateMyScore((dice1 + dice2));
    }
    else if( userData && userData.status === "Out"){
        diceRef.current.rollDice();
        diceRef2.current.rollDice();
    }

  }, [dice1,dice2]);


  const rollDice = async () => {
    console.log("is rolling ", rolling);
    const diceRoleRes = await rollDeDice(boardId, betAmount);
    if (diceRef.current && diceRef2.current ) {
      setRolling(true);
    }
    if (navigator.vibrate) {
      navigator.vibrate([50, 20, 50 , 20, 50, 50, 20, 50 , 20, 50, 50, 20, 50 , 20, 50]);
    }
    setTimeout( () => {
        setRolling(false);
    }, 1000)
  };

  useEffect(() => {
    console.log( "userData", userData);
  }, [userData]);

  useEffect(()=> {
    console.log(data);
    if(data){
        setRollingData(data.rolling);
    }
  },[data]);


const getScore = () => {
    // Listener for real-time updates
    const handleDataChange = (snapshot) => {
      setUserData(snapshot.val());
      console.log("Val Snapshot: ", snapshot.val());
      setDice1(snapshot.val().dice1);
      setDice2(snapshot.val().dice2);
    };
    // Attach listener
    onValue(userRef, handleDataChange);

    // Cleanup listener on unmount
    return () => {
      off(userRef, 'value', handleDataChange);
    };
};

const safeNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const sum = safeNumber(dice1) + safeNumber(dice2);


  return (
    <div className="flex flex-wrap items-center justify-evenly p-5 pt-5 bg-opacity-90 rounded-lg bg-transparent ">
      {/* Floating Score Result */}
      <div className={`flex flex-col justify-evenly absolute h-32 w-32 p-4 ${rolling ? 'opacity-0' : 'animate-floatUp'}`}>
        <p
          className={`flex justify-center text-7xl font-extrabold drop-shadow-lg
            ${sum === 7
              ? "text-yellow-400 animate-pulse"
              : sum === 0
                ? "text-transparent"
                : "text-green-500"
            }`}
        >
          +{sum}
        </p>
      </div>

      {/* Rolling Status Text */}
      <div className="w-full p-4 text-center">
        <p className="text-lg text-yellow-300 font-mono tracking-wide">
          {userData?.status === "Rolling" ? "🎲 Click Dice To Roll" : "❌ You Are Out"}
        </p>
      </div>

      {/* Dice Container */}
      <div
        className="flex flex-nowrap z-10 mt-2 gap-6 cursor-pointer"
        onClick={userData?.status === "Rolling" && !rolling ? rollDice : undefined}
      >
        {/* Dice One */}
        <div className={`flex flex-col justify-evenly h-32 w-32 p-4 rounded-lg
          ${rolling ? 'dice-rolling-One' : 'hover:border-yellow-400'} transition duration-300`}>
          <Dice ref={diceRef2} cheatValue={dice1} size={100} triggers={rolling ? [] : ['click']} />
        </div>

        {/* Dice Two */}
        <div className={`flex flex-col justify-evenly h-32 w-32 p-4 rounded-lg 
          ${rolling ? 'dice-rolling-Two' : 'hover:border-yellow-400'} transition duration-300`}>
          <Dice ref={diceRef} cheatValue={dice2} size={100} triggers={rolling ? [] : ['click']} />
        </div>
      </div>
    </div>
  );
}

const rollDeDice = async (boardId, betAmount) => {
    try{
        const userId = localStorage.getItem("userID");
        const idToken = localStorage.getItem("idToken");
        const url = new URL('https://app-2wtihj5jvq-uc.a.run.app/rollDice');
        console.log(idToken);
        console.log(userId);
        url.searchParams.append('userId', userId);
        const res = await fetch(url,{
            method: "POST",
            credentials: "include",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}` 
            },
            body: JSON.stringify({
            boardId: boardId,
            betAmount: betAmount
            })
        });
        console.log(res.status)
        if(res.status === 401 || res.status === 404 ){
            const data = await res.json();
            console.log(data);
            return {error: data.message }
        }
        else if(res.status === 200){
            const data = await res.json();
            console.log(data);
            return {status: "success",dice : data.data, boardId: data.boardId}
        }
        return {"data:" : "hello World"};
    }
    catch (err) {
        console.log("New User createUser: Error");
        console.log(err);
        throw new Error(err);
    }
}