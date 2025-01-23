import { useEffect, useState } from 'react';
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';
import BoardGenerator from '../randomBoardGenerator/boardGenerator';

export default function Boards ({boardJoined}) {

    const [boards, setBoards] = useState('');
    const [countdowns, setCountdowns] = useState({});
    const [modalState, setStateModal] = useState({'showModal': false, "text": '', "title" :'', 'icon': ''});

    useEffect(() => {
        console.log(Date.now())
        const dataRef = ref(database, 'boards/');

        const handleDataChange = (snapshot) => {
            console.log('Data changed:', snapshot.val());
            var data = snapshot.val();

            if (data) {
                // Filter the boards where status is "concluded"
                const concludedBoards = Object.values(data).filter(board => board.status !== "Concluded");
                console.log('Concluded Boards:', concludedBoards);
                setBoards(concludedBoards); // Set the state to the filtered boards
            }
        };

        onValue(dataRef, handleDataChange, (error) => {
            console.error('Listener failed: ', error);
        });

        return () => {
            off(dataRef, 'value', handleDataChange);
        };
    }, []);
    const handleJoinBoard = async (boardId) => {
        try{
            console.log(boardId);
            const status = await joinBoard(boardId);
            if(status && status?.boardId){
                boardJoined(status.boardId)
            }
        }
        catch(err){
            console.log(err);
            throw new Error(err);
        }
    }
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
            Object.entries(boards).forEach(([roomId, room]) => {
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
                    console.log("Board ID: ", result.boardId.boardId);
                    handleJoinBoard(result.boardId.boardId)
                    updateModelState();
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

    // useEffect(()=> {
    //  console.log(boards);
    //     if(boards){
    //         setGameInfo(data);
    //         const user = data.players
    //         console.log(user)
    //         const id = localStorage.getItem("userId" );;
    //         setUserInfo(getDataById(user, id))
    //     }
    // }, [boards]);

    return ( 
        <>
            <div className="bg-opacity-75 min-w-[100%] sticky top-0 bg-white">
                <div className={`grid grid-cols-2 h-[35px] space-y-0 w-full mt-0 bg-white z-10`}>
                    <label
                    htmlFor="fullname"
                    className="text-balance content-center border-r border-red-700 dark:border-red-700 pr-[2%]"
                    onClick={updateModelState}
                    >
                    RANDOM BOARD
                    </label>
                    <label
                    htmlFor="Department"
                    className="text-balance content-center"
                    >
                    CREATE BOARD
                    </label>
                </div>
                <div className="bg-gradient-to-r from-transparent via-red-800 dark:via-red-700 to-transparent mb-0 h-[1px] w-full" />

                <div className={`grid grid-cols-1 h-[35px] space-y-0 w-full  bg-white z-10 mt-3`}>
                <label
                    htmlFor="Department"
                    className="text-balance content-center"
                    >
                    AVIALABLE  BOARDS
                    </label>
                </div>
                <div className="bg-gradient-to-r from-transparent via-red-800 dark:via-red-800 to-transparent mb-0 h-[1px] w-full" />
                <BoardGenerator modalState={modalState} joinRandomBoard={joinRandomBoardValue} />
                <div className="flex flex-cols-2 gap-4 p-4 flex-wrap justify-center mt-2">
                    {Object.entries(boards).map(([roomId, room], index) => (
                        <form onSubmit={(e) => { e.preventDefault(); handleJoinBoard(roomId)}} >
                            <div className={`grid grid-cols-1 space-y-0 w-full mt-0 bg-white z-10 border-r-2 border-t-2 border-b-2 border-red-800 rounded-lg`}>
                            <h1
                            htmlFor="fullname"
                            className="py-2 text-center content-center "
                            >
                                {roomId}
                            </h1>
                            <div className="bg-gradient-to-r from-transparent via-red-800 dark:via-red-700 to-transparent mb-0 h-[1px] w-full" />
                            <label
                            htmlFor="fullname"
                            className="py-1 px-4 text-left content-cente"
                            >
                            Bet Amount: {room.bet}
                            </label>
                            <label
                            htmlFor="fullname"
                            className="py-1 px-4 text-left content-center"
                            >
                            Players Count: {Object.keys(room.players).length}
                            </label>
                            <label
                            htmlFor="fullname"
                            className="py-1 px-4 text-left content-center"
                            >
                            Current Stake: R190
                            </label>
                            <label className="py-1 px-4 text-left content-center">
                                Starting in: {countdowns[roomId] ? 
                                    ` ${countdowns[roomId].minutes}m ${countdowns[roomId].seconds}s`
                                    : 'Countdown is over!'}
                            </label>

                            <button
                            className="transition ease-in-out delay-75 duration-75 hover:-translate-y-1 hover:scale-105 px-2 bg-gradient-to-br relative group/btn from-black dark:from-mt-20 dark:to-red-900 to-red-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
                            type="submit"
                            >
                                PLAY
                        </button>
                            </div>
                        </form>
                    ))
                    }
                {/* <div className="bg-green-500 p-4 rounded-lg shadow-md">
                                        <div className={`grid grid-cols-1 space-y-0 w-full mt-0 bg-white z-10`}>
                        <label
                            htmlFor="fullname"
                            className="text-center content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            RANDOM BOARD
                        </label>
                        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent mb-0 h-[1px] w-full" />
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Bet Amount: R20
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Players Count: 10
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Current Stake: R190
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Starting in: 25s
                        </label>
                    </div>
                </div>
                <div className="bg-red-500 p-4 rounded-lg shadow-md">
                                        <div className={`grid grid-cols-1 space-y-0 w-full mt-0 bg-white z-10`}>
                        <label
                            htmlFor="fullname"
                            className="text-center content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            RANDOM BOARD
                        </label>
                        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent mb-0 h-[1px] w-full" />
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Bet Amount: R20
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Players Count: 10
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Current Stake: R190
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Starting in: 25s
                        </label>
                    </div>
                </div>
                <div className="bg-yellow-500 p-4 rounded-lg shadow-md">
                    <div className={`grid grid-cols-1 space-y-0 w-full mt-0 bg-white z-10`}>
                        <label
                            htmlFor="fullname"
                            className="text-center content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            RANDOM BOARD
                        </label>
                        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent mb-0 h-[1px] w-full" />
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Bet Amount: R20
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Players Count: 10
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Current Stake: R190
                        </label>
                        <label
                            htmlFor="fullname"
                            className="pl-4 text-left content-center border-r border-neutral-300 dark:border-neutral-700 pr-[2%]"
                        >
                            Starting in: 25s
                        </label>
                    </div>
                </div> */}
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

const joinBoard = async (boardId) => {
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
            boardId: boardId
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