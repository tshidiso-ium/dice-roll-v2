import { useEffect, useState } from 'react';
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';

export default function GameInfo ({myScore}) {
  const [data, setData] = useState(null);
  const [gameInfo, setGameInfo] = useState('');
  const [userInfo, setUserInfo] = useState('');
  var boardId = localStorage.getItem("joinedBoard");
    useEffect(() => {
        // Reference to the Firebase database path you want to listen to
        const dataRef = ref(database, `boards/${boardId}`);
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
            setUserInfo(getDataById(user, id))
        }
    }, [data]);

    const getDataById = (data, id) => {
        return data[id] || null; // Returns null if the ID is not found
    };

    return ( 
        <>
            <div className=' bg-opacity-75 min-w-[100%] sticky top-0 bg-white'>
                <div className={`grid grid-cols-3 h-[35px] space-y-0 w-full mt-0  bg-white z-10`}>
                    <label htmlFor="fullname" className="text-balance pl-[2%] content-center">Score</label>
                    <label htmlFor="position" className="text-balance pl-[2%] content-center">Bet</label>
                    <label htmlFor="Department" className="text-balance pl-[2%] content-center">Stake</label>
                </div>
                {
                    gameInfo && userInfo ? 
                    <>
                        <div className={`grid grid-cols-3 h-[35px] space-y-0 w-full mt-0`}>
                            <h1 htmlFor="fullname" className="text-balance pl-[2%] content-center text-sm">{userInfo.score}</h1>
                            <h1 htmlFor="position" className="text-balance pl-[2%] content-center text-sm ">{userInfo.bet}</h1>
                            <h1 htmlFor="Department" className="text-balance pl-[2%] content-center text-sm ">{((Object.entries(gameInfo.players).length)*userInfo.bet)}</h1>
                        </div>
                        <div className="bg-gradient-to-r from-transparent via-red-700 dark:via-red-700 to-transparent mb-0 h-[1px] w-full" />
                    </>
                    :
                    <>
                    </>
                }

            </div>
        </>
    )
}


