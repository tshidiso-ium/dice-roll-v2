import { useEffect, useState } from 'react';
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';

export default function GameInfo ({myScore}) {
  const [data, setData] = useState(null);
  const [gameInfo, setGameInfo] = useState('');
  const [userInfo, setUserInfo] = useState('');
  var boardId = localStorage.getItem("joinedBoard");
  var betAmount = localStorage.getItem("betAmount");
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
            setUserInfo(getDataById(user, id))
        }
    }, [data]);

    const getDataById = (data, id) => {
        return data[id] || null; // Returns null if the ID is not found
    };

    return ( 
        <>
            <div className="sticky top-0 z-30 w-full bg-gradient-to-r from-black via-red-900 to-black bg-opacity-90 shadow-lg">
            {/* Header Labels */}
            <div className="grid grid-cols-3 h-[40px] text-yellow-300 text-center font-mono text-sm uppercase border-b-[2px] border-yellow-400">
                <label htmlFor="fullname" className="flex items-center justify-center">
                🎯 Score
                </label>
                <label htmlFor="position" className="flex items-center justify-center">
                💰 Bet
                </label>
                <label htmlFor="Department" className="flex items-center justify-center">
                🎲 Stake
                </label>
            </div>

            {/* User Info */}
            {gameInfo && userInfo ? (
                <>
                <div className="grid grid-cols-3 h-[40px] text-white text-center font-mono bg-black bg-opacity-60">
                    <h1 className="flex items-center justify-center text-sm">
                    {userInfo.score}
                    </h1>
                    <h1 className="flex items-center justify-center text-sm">
                    R{userInfo.bet}
                    </h1>
                    <h1 className="flex items-center justify-center text-sm">
                    R{(Object.entries(gameInfo.players).length) * userInfo.bet}
                    </h1>
                </div>

                {/* Glowing Divider */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-md" />
                </>
            ) : null}
            </div>
        </>
    )
}


