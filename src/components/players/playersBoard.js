import React, { useState, useEffect } from 'react';
import teamJson from './playerList.json'; // Importing JSON data for team members
import teamstyle from "./Team.css"; // Importing CSS file for styling
import Avatar from '@mui/material/Avatar'; // Importing Avatar component from MUI
import Stack from '@mui/material/Stack'; // Importing Stack component from MUI
import Chip from '@mui/material/Chip'; // Importing Chip component from MUI
import { Leaderboard } from '@mui/icons-material';
import { database } from '../../modules/firebase';
import { ref, onValue, off } from 'firebase/database';

// Functional component to display team members
const Playersboard = () => {
  const [data, setData] = useState(null);
  const [players, setPlayers] = useState('');
  const [sortedEntries, setSortedEntries] = useState('');
  const userId = localStorage.getItem("userId" );
  const boardId = localStorage.getItem("joinedBoard" );


  useEffect(() => {
    // Reference to the Firebase database path you want to listen to
    const dataRef = ref(database, `boards/${boardId}`);

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
        setPlayers(data.players);
    }
  }, [data])

  useEffect(() => {
    const sortedEntries = Object.entries(players)
        .sort(([keyA, memberA], [keyB, memberB]) => memberB.score - memberA.score);
    setSortedEntries(sortedEntries);
  }, [players])

        console.log(players)
    return (
        <div className="teamContent mt-2"> {/* Container for the team content */}
            <div className="teamList"> 
            <div className='relativ bg-opacity-75 min-w-[100%]'>
                <div className={`grid grid-cols-5 h-[35px] space-y-0 w-full mt-0`}>
                    <label htmlFor="fullname" className="text-balance pl-[2%] content-center text-l">Pos</label>
                    <label htmlFor="fullname" className="text-balance pl-[2%] content-center text-l">Player</label>
                    <div></div>
                    <label htmlFor="position" className="text-balance pl-[2%] content-center text-l">Score</label>
                    <label htmlFor="Department" className="text-balance pl-[2%] content-center text-l">status</label>
                </div>
            </div>
            <div className="bg-gradient-to-r from-transparent via-red-700 dark:via-neutral-700 to-transparent mb-3 h-[1px] w-full" />
                <div className='relativ bg-opacity-75 min-w-[100%]'>
                {/* Mapping through the teamJson array to render team members */}
                {
                    players ? 
                    <>
                    {sortedEntries.map(([key, member], index) => (
    
                        <div className={`grid grid-cols-5 h-[35px] space-y-0 w-full mt-0 ${ key === userId ? "bg-slate-200": "" } `}>
                            <div className="text-balance content-center text-sm">
                                {1 + index}.                                    
                            </div>

                            <div className="flex col-span-2 text-balance content-center text-sm pt-2 pb-2">       
                                <Avatar
                                    alt={member.userName} // Alt text for the Avatar
                                    src={member.picture} // Source of the Avatar image
                                    sx={{ width: 24, height: 24 }} // Styling for the Avatar
                                />                           
                            <labe className={`pl-2 text-sm text-balance align-middle text-center `}> {member.userName}</labe>
                            </div>
                            <label htmlFor="position" className="text-balance pl-[1%] content-center text-sm">{member.score}</label>
                            <label htmlFor="Department" className="text-balance pl-[1%] content-center text-sm">
                                <Chip label={member.status}  size="small" color={member.chip_colour} variant="outlined"/>
                            </label>
                        </div>
                    ))}
                    </>
                    :
                    <>
                    </>

                }

                </div>
            </div>
        </div>
    )
}
export default Playersboard; // Exporting the TeamMembers component