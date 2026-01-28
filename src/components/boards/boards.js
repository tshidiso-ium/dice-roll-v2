import { useEffect, useState } from 'react';
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';
import BoardGenerator from '../randomBoardGenerator/boardGenerator';
import { BoardCard } from '../boardCards/BoardCard';
import { LoadingBoards } from '../boardCards/LoadingBoards';

export default function Boards ({boardJoined, playAgain}) {

    const [boards, setBoards] = useState('');
    const [countdowns, setCountdowns] = useState({});
    const [modalState, setStateModal] = useState({'showModal': false, "text": '', "title" :'', 'icon': ''});
    const BET_GROUPS = [5, 10];
    


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

    const getSouthAfricanNow = () =>
    new Date(
      new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" })
    ).getTime();

    const calculateTimeLeft = (startTime) => {
      const start = new Date(startTime).getTime();
      if (!Number.isFinite(start)) return null;

      const now = getSouthAfricanNow();
      const difference = start - now;
      if (difference <= 7199000) return null; // Countdown is over

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const newCountdowns = {};
            if(!boards) return;
            Object.entries(boards[5]).forEach(([roomId, room]) => {
                console.log("Calculating countdown for room: ", roomId);
                newCountdowns[roomId] = calculateTimeLeft(room.closesAt);
            });
            // Object.entries(boards[10]).forEach(([roomId, room]) => {
            //     newCountdowns[roomId] = calculateTimeLeft(room.closesAt);
            // });
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
                  localStorage.setItem("joinedBoard", result.boardId.boardId);
                  localStorage.setItem("betAmount", parseInt(amount.replace('R', '')));
                  // updateModelState();
                }
                else{
                  handleJoinBoard(parseInt(amount.replace('R', '')),result.boardId);
                  localStorage.setItem("joinedBoard", result.boardId.boardId);
                  localStorage.setItem("betAmount", parseInt(amount.replace('R', '')));
                  // updateModelState();
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
          setStateModal({'showModal': false, "text": '', "title" :'', 'icon': ''})
          console.log("Joining random board again");
          joinRandomBoardValue(playAgain.betAmount);
        }
    }, []);

    const getValidBoards = (boardsForBet, countdowns) =>
      Object.entries(boardsForBet || {}).filter(
        ([roomId, room]) =>
          room.status !== "Concluded" &&
          countdowns[roomId] !== null
    );
 
    return ( 
<>
  <div className="min-w-full sticky top-0 bg-gradient-to-b from-[#1a0000] via-[#330000] to-black border-b border-red-800 shadow-lg z-50 min-h-screen">
    <div className="grid grid-cols-1 text-center text-white text-lg font-bold tracking-wide">
      <button
        onClick={updateModelState}
        className="py-2 border-r border-red-700 bg-gradient-to-r from-[#660000] to-[#990000] hover:brightness-125 transition-all"
      >
        🎲 RANDOM BOARD
      </button>
      {/* <button className="py-2 bg-gradient-to-r from-[#990000] to-[#660000] hover:brightness-125 transition-all">
        ➕ CREATE BOARD
      </button> */}
    </div>
    <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent my-0" />

    <div className="text-center py-2 text-yellow-400 font-semibold text-md uppercase tracking-wide bg-black">
      🃏 Available Boards
    </div>
    <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

    <BoardGenerator modalState={modalState} joinRandomBoard={joinRandomBoardValue} />

    <div className="flex flex-col gap-10 p-4">
        {BET_GROUPS.map((bet) => {
          const boardsForBet = boards?.[bet];

          // Boards not loaded yet → loading
          if (!boardsForBet) {
            return (
              <div key={bet}>
                <h2 className="text-2xl font-extrabold text-yellow-400 mb-4">
                  💰 R{bet} Boards
                </h2>
                <LoadingBoards />
              </div>
            );
          }

          const validBoards = getValidBoards(boardsForBet, countdowns);

          return (
            <div key={bet}>
              <h2 className="text-2xl font-extrabold text-yellow-400 mb-4">
                💰 R{bet} Boards
              </h2>

              {/* 🔄 Show loader ONLY if no boards meet conditions */}
              {validBoards.length === 0 ? (
                <LoadingBoards />
              ) : (
              <div className="flex overflow-x-auto pb-4 scrollbar-hide gap-6">

                  {validBoards.map(([roomId, room]) => (
                    <div
                      className={`
                        transition-all duration-500 ease-in-out
                        ${countdowns[roomId] 
                          ? "opacity-100 scale-100 translate-y-0 board-in"
                          : "opacity-0 scale-95 translate-y-2 pointer-events-none board-out"}
                      `}
                    >
                    <BoardCard
                      key={roomId}
                      roomId={roomId}
                      room={room}
                      countdowns={countdowns}
                      handleJoinBoard={handleJoinBoard}
                    />
                  </div>
                ))}
              </div>
              )}
            </div>
          );
        })}
    </div>
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