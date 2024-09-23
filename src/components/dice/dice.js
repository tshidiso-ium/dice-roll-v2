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
  const [total, setTotal] = useState(0)
  const [dice1, setDice1] = useState(0);
  const [dice2, setDice2] = useState(0);
  // var dice1 = 1;
  // var dice2 = 1;
  const [rolling, setRolling] = useState(false);
  const [canVibrat, setCanVibrate] = useState('');
  const diceRef = useRef(null);
  const diceRef2 = useRef(null)
  const  [randomNumber1, setRandomNumber1] = useState(0);
  const [randomNumber2, setRandomNumber2] = useState(0);
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

  }, [dice1]);

  useEffect(() => {
    if(dice1 != 0 &&  dice2 != 0){
      console.log(dice1, dice2)
        updateUserScore()
    }

  }, [dice1, dice2])

  

  const rollDice = () => {
    console.log("is rolling ", rolling)

    if (diceRef.current && diceRef2.current ) {
    //   console.log(diceRef)
      //dice1 = Math.floor(Math.random() * 6) + 1;

      //dice2= Math.floor(Math.random() * 6) + 1;
        // setRandomNumber1(Math.floor(Math.random() * 6) + 1);
        // setRandomNumber2( Math.floor(Math.random() * 6) + 1);
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);


          setRolling(true);
    }
    if (navigator.vibrate) {
      navigator.vibrate([50, 20, 50 , 20, 50, 50, 20, 50 , 20, 50, 50, 20, 50 , 20, 50]);
    }
    setTimeout( () => {
        setRolling(false);
    }, 1000)

    // setRolling(false);
    // setTimeout(() => {
    //   const randomNumber1 = Math.floor(Math.random() * 6) + 1;
    //   const randomNumber2 = Math.floor(Math.random() * 6) + 1;
    //   console.log("random1", randomNumber1)
    //   console.log("random2", randomNumber2)
    // if( (randomNumber1 + randomNumber2) == 7 ){
    //     setTotal(0)
    // }
    // else{
    //   setTotal(total + (randomNumber1 + randomNumber2))
    // }
    //   // setDice1(randomNumber1);
    //   // setDice2(randomNumber2);
    //   setRolling(false);
    // }, 700); // Duration of the animation
  };

  useEffect(() => {
    console.log( "userData", userData);
  }, [userData]);

    useEffect(() => {
    // Reference to the Firebase database path you want to listen to
    const dataRef = ref(database, 'room1');

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
    console.log(data);
    if(data){
        setRollingData(data.rolling);
    }
  },[data])



const updateUserScore = () => {
  if( (dice1 + dice2) !== 7) {
    update(userRef, { score: (userData.score + (dice1 + dice2)) })
      .then(() => {
        console.log('Score updated successfully');
      })
      .catch((error) => {
        console.error('Error updating score:', error);
      });
  }
  else{
    update(userRef, { status: "Out", chip_colour: "error" })
      .then(() => {
        console.log('Score updated successfully');
      })
      .catch((error) => {
        console.error('Error updating score:', error);
      });
  }

}

const getScore = () => {
  // Create a reference to the user's data


    // Listener for real-time updates
    const handleDataChange = (snapshot) => {
    setUserData(snapshot.val());
    };
        // Attach listener
    onValue(userRef, handleDataChange);

    // Cleanup listener on unmount
    return () => {
      off(userRef, 'value', handleDataChange);
    };
  // Update the user's score
  // update(userRef, { score: newScore })
  //   .then(() => {
  //     console.log('Score updated successfully');
  //   })
  //   .catch((error) => {
  //     console.error('Error updating score:', error);
  //   });
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