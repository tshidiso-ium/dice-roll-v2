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
  const betAmount = localStorage.getItem("betAmount" );


  useEffect(() => {
    // Reference to the Firebase database path you want to listen to
    const dataRef = ref(database, `boards/live/${betAmount}/${boardId}`);

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
        const filteredPlayers = Object.entries(data.players).filter(([key, player]) => player.hasOwnProperty('bet'));
        const playersWithBet = Object.fromEntries(filteredPlayers);
        setPlayers(playersWithBet);
    }
  }, [data])

  useEffect(() => {
    const sortedEntries = Object.entries(players)
        .sort(([keyA, memberA], [keyB, memberB]) => memberB.score - memberA.score);
    setSortedEntries(sortedEntries);
  }, [players])

        console.log(players)
    return (
    <div className=" mt-2 font-mono text-sm text-yellow-300">
    <div>
        {/* Header Row */}
        <div className="bg-gradient-to-r from-black via-red-900 to-black text-yellow-300 border-y-2 border-yellow-400 w-full">
        <div className="grid grid-cols-5 h-[35px] text-center uppercase tracking-wide font-bold">
            <label className="flex items-center justify-center">Pos</label>
            <label className="flex items-center justify-start col-span-2 ">Player</label>
            <label className="flex items-center justify-center">Score</label>
            <label className="flex items-center justify-center">Status</label>
        </div>
        </div>

        {/* Divider */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent my-1" />

        {/* Player Rows */}
        <div className="bg-black bg-opacity-50 rounded-b-lg overflow-hidden">
            {players && sortedEntries.map(([key, member], index) => {
                // Assign medal emoji based on position
                let medal = '';
                if (index === 0) medal = ' 🥇';
                else if (index === 1) medal = ' 🥈';
                else if (index === 2) medal = ' 🥉';

                return (
                    <div
                        key={key}
                    className={`grid grid-cols-5 h-[40px] items-center w-full px-2 
                        ${key === userId ? 'bg-gradient-to-r from-yellow-900 to-red-800 text-white shadow-md' : 'text-yellow-200'}`}
                    >
                    {/* Position */}
                    <div className="flex justify-center">{index + 1}.</div>

                    {/* Player Info + Medal */}
                    <div className="flex col-span-2 items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-yellow-300">
                        <Avatar
                            alt={member.userName}
                            src={member.picture}
                            sx={{ width: 24, height: 24 }}
                        />
                        </div>
                        <label className="truncate">
                        {member.userName}
                        <span>{medal}</span>
                        </label>
                    </div>

                    {/* Score */}
                    <div className="flex justify-center">{member.score}</div>

                    {/* Status */}
                    <div className="flex justify-center">
                        <Chip
                        label={member.status}
                        size="small"
                        color={member.chip_colour}
                        variant="outlined"
                        style={{
                            fontWeight: 'bold',
                            borderColor: 'gold',
                            color: 'gold',
                        }}
                    />
                    </div>
                    </div>
                );
            })}
        </div>
    </div>
    </div>
    )
}
export default Playersboard; // Exporting the TeamMembers component