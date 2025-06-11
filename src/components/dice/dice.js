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
  var userId = localStorage.getItem("userId" );
  var boardId = localStorage.getItem("joinedBoard");
  var userRef = ref(database, `boards/${boardId}/players/${userId}`); 

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
    if( userData && userData.status === "Rolling"){
        diceRef.current.rollDice();
        diceRef2.current.rollDice();
        updateMyScore((dice1 + dice2));
    }

  }, [dice1,dice2]);


  const rollDice = async () => {
    console.log("is rolling ", rolling);
    const diceRoleRes = await rollDeDice(boardId);
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


  return (
    <div className="flex flex-wrap items-center justify-evenly p-5 pt-5">
        <div className={`flex flex-col justify-evenly absolute box-border h-32 w-32 p-4 ${rolling ? 'opacity-0' : 'animate-floatUp'}  `}>
            <p className={`flex justify-center text-7xl ${ dice1 + dice2 === 7 ? 'text-red-600' : dice1 + dice2 === 0 ? 'text-transparent' :'text-green-600'}`}>
                  +{ dice1 + dice2}
            </p>
        </div>
        <div className='w-full p-4'>
            <p className="flex justify-center text-l">
              {
                 userData && userData.status === "Rolling" ? 
                <>
                  Click Dice To Roll
                </>
                :
                <>
                  You Are Out
                </>
              }
          
            </p>
        </div>
      {
          <div className="flex flex-nowrap z-10 mt-2"         
                onClick={ userData && userData.status === "Rolling" ?  !rolling ? rollDice : null : null} 
            >
            <div className={`flex flex-col justify-evenly h-32 w-32 p-4 ${rolling ? 'dice-rolling-One' : ''} z-0`}>
              <Dice ref={diceRef2} cheatValue={dice1} size={100} triggers={rolling ? [] : ['click']} />
            </div>
            <div className={`flex flex-col justify-evenly h-32 w-32 p-4 ${rolling ? 'dice-rolling-Two' : ''} z-0`}>
              <Dice ref={diceRef} cheatValue={dice2} size={100} triggers={rolling ? [] : ['click']} />
            </div>
          </div>

      } 

    </div>
  );
}

const rollDeDice = async (boardId) => {
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
            boardId: boardId
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