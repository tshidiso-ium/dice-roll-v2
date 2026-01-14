import { useEffect, useState } from 'react';
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';
import BoardGenerator from '../randomBoardGenerator/boardGenerator';

export default function Boards ({boardJoined, playAgain}) {

    const [boards, setBoards] = useState('');
    const [countdowns, setCountdowns] = useState({});
    const [modalState, setStateModal] = useState({'showModal': false, "text": '', "title" :'', 'icon': ''});

    useEffect(() => {
        console.log(Date.now())
        const dataRef = ref(database, 'boards/live');

        const handleDataChange = (snapshot) => {
            console.log('Data changed:', snapshot.val());
            setBoards(snapshot.val());
        };

        onValue(dataRef, handleDataChange, (error) => {
            console.error('Listener failed: ', error);
        });

        return () => {
            off(dataRef, 'value', handleDataChange);
        };
    }, []);

    const handleJoinBoard = async (betAmount, boardId) => {
        try{
            console.log(boardId);
            const status = await joinBoard(betAmount,boardId);
            if(status && status?.boardId){
                boardJoined(betAmount, status.boardId)
            }
        }
        catch(err){
            console.log(err);
            throw new Error(err);
        }
    };

    const calculateTimeLeft = (startTime) => {
        const difference = new Date(startTime) - new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            };
        } else {
            return null; // Countdown is over
        }

        return timeLeft;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const newCountdowns = {};
            if(!boards) return;
            Object.entries(boards[5]).forEach(([roomId, room]) => {
                newCountdowns[roomId] = calculateTimeLeft(room.startsAt);
            });
            Object.entries(boards[10]).forEach(([roomId, room]) => {
                newCountdowns[roomId] = calculateTimeLeft(room.startsAt);
            });
            setCountdowns(newCountdowns);
        }, 1000);

        return () => clearInterval(interval);
    }, [boards]);

    const joinRandomBoardValue = async (amount) => {
        console.log("Amount: ", amount);
        try{
            if(amount !== 0 ){
                const result = await randomBoardJoin(amount);
                if(result?.status === "success"){
                    console.log("Board ID: ", result.boardId);
                    if(result?.boardId.message){
                      handleJoinBoard(parseInt(amount.replace('R', '')),result.boardId.boardId);
                      updateModelState();
                    }
                    else{
                      handleJoinBoard(parseInt(amount.replace('R', '')),result.boardId);
                      updateModelState();
                    }

                }
                console.log("Available Boards: ", result);
            }
            else{
                updateModelState();
            }

        }
        catch(err){
            throw new Error(err);
        }

        //here we look for an active board that has the same betting amount 
    }

    const updateModelState = async () =>{
        setStateModal({'showModal': !modalState.showModal, "text": '', "title" :'', 'icon': ''})
    }

    useEffect(()=> {
     console.log(playAgain);
        if(playAgain){
            joinRandomBoardValue(playAgain.betAmount);
        }
    }, []);

    return ( 
<>
  <div className="min-w-full sticky top-0 bg-gradient-to-b from-[#1a0000] via-[#330000] to-black border-b border-red-800 shadow-lg z-50 min-h-screen">
    <div className="grid grid-cols-2 text-center text-white text-lg font-bold tracking-wide">
      <button
        onClick={updateModelState}
        className="py-2 border-r border-red-700 bg-gradient-to-r from-[#660000] to-[#990000] hover:brightness-125 transition-all"
      >
        🎲 RANDOM BOARD
      </button>
      <button className="py-2 bg-gradient-to-r from-[#990000] to-[#660000] hover:brightness-125 transition-all">
        ➕ CREATE BOARD
      </button>
    </div>
    <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent my-2" />

    <div className="text-center py-2 text-yellow-400 font-semibold text-md uppercase tracking-wide bg-black">
      🃏 Available Boards
    </div>
    <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

    <BoardGenerator modalState={modalState} joinRandomBoard={joinRandomBoardValue} />

{
  boards
  &&
    <div className="flex flex-wrap justify-center align-middle gap-6 p-4">
      {
        boards[5] 
        &&
          <>
            {Object.entries(boards[5]).map(([roomId, room], index) =>
              room.status !== "Concluded" && countdowns[roomId] !== null ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinBoard( room.bet, roomId);
                  }}
                  key={roomId}
                  className="bg-gradient-to-br from-[#330000] to-[#0a0000] text-white p-4 rounded-2xl shadow-xl border border-yellow-500 relative  my-auto"
                >
                  <h2 className="text-center text-xl font-extrabold mb-2 text-yellow-400 tracking-wide drop-shadow-md">
                    🎰 {roomId}
                  </h2>
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent my-2" />
                  <p className="text-sm mb-1">💰 Bet Amount: <span className="font-bold">{room.bet}</span></p>
                  <p className="text-sm mb-1">👥 Players: <span className="font-bold">{Object.keys(room.players).length}</span></p>
                  <p className="text-sm mb-1">💵 Current Stake: <span className="font-bold">R190</span></p>
                  <p className="text-sm mb-4">⏱ Starting in: <span className="font-bold">
                    {countdowns[roomId]
                      ? `${countdowns[roomId].minutes}m ${countdowns[roomId].seconds}s`
                      : "Countdown is over!"}
                  </span></p>
                  <button
                      type="submit"
                      disabled={!countdowns[roomId]}
                      className={
                          countdowns[roomId]
                          ? `w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:brightness-125 text-black font-bold py-2 rounded-xl shadow-md transition-transform transform hover:-translate-y-1`
                          : `w-full bg-gray-300 text-gray-500 font-bold py-2 rounded-xl shadow-md cursor-not-allowed`
                      }
                  >
                      PLAY NOW
                  </button>
                  <div className={    countdowns[roomId]
                      ?
                      `absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 animate-ping`
                      :
                      `absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500`
                      }
                  >     
                  </div>
                </form>
              ) : null
            )}
          </>
        
      }
      {
        boards[10] 
        &&
          <>
            {Object.entries(boards[10]).map(([roomId, room], index) =>
              room.status !== "Concluded" && countdowns[roomId] !== null ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinBoard(room.bet, roomId);
                  }}
                  key={roomId}
                  className="bg-gradient-to-br from-[#330000] to-[#0a0000] text-white p-4 rounded-2xl shadow-xl border border-yellow-500 relative  my-auto"
                >
                  <h2 className="text-center text-xl font-extrabold mb-2 text-yellow-400 tracking-wide drop-shadow-md">
                    🎰 {roomId}
                  </h2>
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent my-2" />
                  <p className="text-sm mb-1">💰 Bet Amount: <span className="font-bold">{room.bet}</span></p>
                  <p className="text-sm mb-1">👥 Players: <span className="font-bold">{Object.keys(room.players).length}</span></p>
                  <p className="text-sm mb-1">💵 Current Stake: <span className="font-bold">R190</span></p>
                  <p className="text-sm mb-4">⏱ Starting in: <span className="font-bold">
                    {countdowns[roomId]
                      ? `${countdowns[roomId].minutes}m ${countdowns[roomId].seconds}s`
                      : "Countdown is over!"}
                  </span></p>

                  <button
                      type="submit"
                      disabled={!countdowns[roomId]}
                      className={
                          countdowns[roomId]
                          ? `w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:brightness-125 text-black font-bold py-2 rounded-xl shadow-md transition-transform transform hover:-translate-y-1`
                          : `w-full bg-gray-300 text-gray-500 font-bold py-2 rounded-xl shadow-md cursor-not-allowed`
                      }
                  >
                      PLAY NOW
                  </button>
                  <div className={    countdowns[roomId]
                      ?
                      `absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 animate-ping`
                      :
                      `absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500`
                      }
                  >     
                  </div>
                </form>
              ) : null
            )}
          </>
      }


      {/*{Object.entries(boards[15]).map(([roomId, room], index) =>
        room.status !== "Concluded" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoinBoard(roomId);
            }}
            key={roomId}
            className="bg-gradient-to-br from-[#330000] to-[#0a0000] text-white p-4 rounded-2xl shadow-xl border border-yellow-500 relative  my-auto"
          >
            <h2 className="text-center text-xl font-extrabold mb-2 text-yellow-400 tracking-wide drop-shadow-md">
              🎰 {roomId}
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent my-2" />
            <p className="text-sm mb-1">💰 Bet Amount: <span className="font-bold">{room.bet}</span></p>
            <p className="text-sm mb-1">👥 Players: <span className="font-bold">{Object.keys(room.players).length}</span></p>
            <p className="text-sm mb-1">💵 Current Stake: <span className="font-bold">R190</span></p>
            <p className="text-sm mb-4">⏱ Starting in: <span className="font-bold">
              {countdowns[roomId]
                ? `${countdowns[roomId].minutes}m ${countdowns[roomId].seconds}s`
                : "Countdown is over!"}
            </span></p>

            <button
                type="submit"
                disabled={!countdowns[roomId]}
                className={
                    countdowns[roomId]
                    ? `w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:brightness-125 text-black font-bold py-2 rounded-xl shadow-md transition-transform transform hover:-translate-y-1`
                    : `w-full bg-gray-300 text-gray-500 font-bold py-2 rounded-xl shadow-md cursor-not-allowed`
                }
            >
                PLAY NOW
            </button>
            <div className={    countdowns[roomId]
                ?
                `absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 animate-ping`
                :
                `absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500`
                }
            >     
            </div>
          </form>
        ) : null
      )}
            {Object.entries(boards[20]).map(([roomId, room], index) =>
        room.status !== "Concluded" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoinBoard(roomId);
            }}
            key={roomId}
            className="bg-gradient-to-br from-[#330000] to-[#0a0000] text-white p-4 rounded-2xl shadow-xl border border-yellow-500 relative  my-auto"
          >
            <h2 className="text-center text-xl font-extrabold mb-2 text-yellow-400 tracking-wide drop-shadow-md">
              🎰 {roomId}
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent my-2" />
            <p className="text-sm mb-1">💰 Bet Amount: <span className="font-bold">{room.bet}</span></p>
            <p className="text-sm mb-1">👥 Players: <span className="font-bold">{Object.keys(room.players).length}</span></p>
            <p className="text-sm mb-1">💵 Current Stake: <span className="font-bold">R190</span></p>
            <p className="text-sm mb-4">⏱ Starting in: <span className="font-bold">
              {countdowns[roomId]
                ? `${countdowns[roomId].minutes}m ${countdowns[roomId].seconds}s`
                : "Countdown is over!"}
            </span></p>

            <button
                type="submit"
                disabled={!countdowns[roomId]}
                className={
                    countdowns[roomId]
                    ? `w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:brightness-125 text-black font-bold py-2 rounded-xl shadow-md transition-transform transform hover:-translate-y-1`
                    : `w-full bg-gray-300 text-gray-500 font-bold py-2 rounded-xl shadow-md cursor-not-allowed`
                }
            >
                PLAY NOW
            </button>
            <div className={    countdowns[roomId]
                ?
                `absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 animate-ping`
                :
                `absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500`
                }
            >     
            </div>
          </form>
        ) : null
      )}
            {Object.entries(boards[25]).map(([roomId, room], index) =>
        room.status !== "Concluded" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoinBoard(roomId);
            }}
            key={roomId}
            className="bg-gradient-to-br from-[#330000] to-[#0a0000] text-white p-4 rounded-2xl shadow-xl border border-yellow-500 relative  my-auto"
          >
            <h2 className="text-center text-xl font-extrabold mb-2 text-yellow-400 tracking-wide drop-shadow-md">
              🎰 {roomId}
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent my-2" />
            <p className="text-sm mb-1">💰 Bet Amount: <span className="font-bold">{room.bet}</span></p>
            <p className="text-sm mb-1">👥 Players: <span className="font-bold">{Object.keys(room.players).length}</span></p>
            <p className="text-sm mb-1">💵 Current Stake: <span className="font-bold">R190</span></p>
            <p className="text-sm mb-4">⏱ Starting in: <span className="font-bold">
              {countdowns[roomId]
                ? `${countdowns[roomId].minutes}m ${countdowns[roomId].seconds}s`
                : "Countdown is over!"}
            </span></p>

            <button
                type="submit"
                disabled={!countdowns[roomId]}
                className={
                    countdowns[roomId]
                    ? `w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:brightness-125 text-black font-bold py-2 rounded-xl shadow-md transition-transform transform hover:-translate-y-1`
                    : `w-full bg-gray-300 text-gray-500 font-bold py-2 rounded-xl shadow-md cursor-not-allowed`
                }
            >
                PLAY NOW
            </button>
            <div className={    countdowns[roomId]
                ?
                `absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 animate-ping`
                :
                `absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500`
                }
            >     
            </div>
          </form>
        ) : null
      )} */}
    </div>
}

  </div>
</>
    )
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-[#00b060] to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-[#00b060]0 to-transparent" />
    </>
  );
};

const joinBoard = async (betAmount, boardId) => {
    try{
        const userId = localStorage.getItem("userID");
        const idToken = localStorage.getItem("idToken");
        const url = new URL('https://app-2wtihj5jvq-uc.a.run.app/joinBoard');
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
        // console.log(res.status)
        if(res.status === 401 || res.status === 404 ){
            const data = await res.json();
            console.log(data);
            return {error: data.message }
        }
        else if(res.status === 200){
            const data = await res.json();
            console.log(data);
            return {status: "success", boardId: data.boardId}
        }
        // const data = await res.json();
        // console.log(data)
        // console.log(await res.json());
        return {"data:" : "hello World"};
    }
    catch (err) {
        console.log("New User createUser: Error");
        console.log(err);
        throw new Error(err);
    }
}

const randomBoardJoin = async (betAmount) => {
    try{
        const userId = localStorage.getItem("userID");
        const idToken = localStorage.getItem("idToken");
        const url = new URL('https://app-2wtihj5jvq-uc.a.run.app/randomBoardJoin');
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
            betAmount: betAmount
          })
        });
        // console.log(res.status)
        if(res.status === 401 || res.status === 404 ){
            const data = await res.json();
            console.log(data);
            return {error: data.message }
        }
        else if(res.status === 200){
            const data = await res.json();
            console.log(data);
            return {status: "success", boardId: data.data}
        }
        // const data = await res.json();
        // console.log(data)
        // console.log(await res.json());
      return {"data:" : "hello World"};
    }
    catch (err) {
      console.log("New User createUser: Error");
      console.log(err);
      throw new Error(err);
    }
}