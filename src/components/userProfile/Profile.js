import React, { useEffect, useState } from 'react';
import { getDatabase, ref as dbRef, onValue, set } from 'firebase/database';
import { ClearBrowserCache } from '../utils/clearCashe';
import { ClearMediaCache } from '../utils/clearMediaCache';
const STORAGE_KEY = 'dice_profile_v1';

function defaultProfile() {
    return {
        fullName: 'Player',
        email: '',
        avatarUrl: '',
        wallet: '',
        createdAt: Date.now(),
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalWagered: 0,
            totalWon: 0
        }
    };
}

export default function Profile({ userId = null, rollResult = null, onProfileUpdate }) {
    const [profile, setProfile] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : defaultProfile();
        } catch {
            return defaultProfile();
        }
    });
    const [editing, setEditing] = useState(false);
    const [nameDraft, setNameDraft] = useState(profile.fullName);
    const [avatarDraft, setAvatarDraft] = useState(profile.avatarUrl);
    const [walletDraft, setWalletDraft] = useState(() => {
        // keep draft as string for the input; stringify objects returned from Firebase
        return profile && typeof profile.wallet === 'object' ? JSON.stringify(profile.wallet) : profile.wallet;
    });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const formatWallet = (w) => {
        if (w === null || typeof w === 'undefined' || w === '') return '—';
        if (typeof w === 'string' || typeof w === 'number') return String(w);
        if (typeof w === 'object') {
            // prefer showing balance/lockedBalance if present
            const parts = [];
            if (typeof w.balance !== 'undefined') parts.push(`balance: ${w.balance}`);
            if (typeof w.lockedBalance !== 'undefined') parts.push(`locked: ${w.lockedBalance}`);
            if (parts.length) return parts.join(' | ');
            try { return JSON.stringify(w); } catch { return '—'; }
        }
        return String(w);
    };

    useEffect(() => {
        const userDetails = async () => {
            try {
                const data = await getUserProfile();
                console.log("Fetched user profile data: ", data);
                if (data) {
                    // merge with previous state and persist the merged result
                    setProfile(prev => {
                        const merged = { ...prev, ...data };
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                        return merged;
                    });
                    // if wallet came back as object, update walletDraft so editor shows sensible value
                    if (data.wallet && typeof data.wallet === 'object') {
                        setWalletDraft(JSON.stringify(data.wallet));
                    }
                    // keep avatarDraft in sync too
                    if (data.avatarUrl) setAvatarDraft(data.avatarUrl);
                }
            } catch (e) {
                console.error('Failed to fetch user profile', e);
            }       
        };
        userDetails();
    }, []);

    // helper: persist profile to localStorage and Realtime DB if available
    const writeProfile = async (updated) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            if (userId) {
                const db = getDatabase();
                await set(dbRef(db, `profiles/${userId}`), updated);
            }
            if (onProfileUpdate) onProfileUpdate(updated);
        } catch (e) {
            console.error('Profile write failed', e);
        }
    };

    // handle avatar file: upload to Firebase Storage when possible, otherwise convert to data URL

    // const handleAvatarFile = async (file) => {
    //     if (!file) return;
    //     setUploadingAvatar(true);
    //     setUploadProgress(0);
    //     try {
    //         // try Firebase Storage if initialized and userId present
    //         if (userId) {
    //             try {
    //                 const storage = getStorage();
    //                 const path = `avatars/${userId}/${Date.now()}_${file.name}`;
    //                 const sRef = storageRef(storage, path);
    //                 // uploadBytes doesn't provide progress in this helper; for simplicity we call it
    //                 await uploadBytes(sRef, file);
    //                 const url = await getDownloadURL(sRef);
    //                 setAvatarDraft(url);
    //                 // persist immediately
    //                 const updated = { ...profile, avatarUrl: url };
    //                 setProfile(updated);
    //                 await writeProfile(updated);
    //                 setUploadingAvatar(false);
    //                 return;
    //             } catch (err) {
    //                 console.warn('Firebase Storage upload failed, falling back to data URL', err);
    //             }
    //         }

    //         // fallback: read as data URL and store inline
    //         await new Promise((resolve, reject) => {
    //             const reader = new FileReader();
    //             reader.onload = () => {
    //                 const url = reader.result;
    //                 setAvatarDraft(url);
    //                 const updated = { ...profile, avatarUrl: url };
    //                 setProfile(updated);
    //                 writeProfile(updated).then(resolve).catch(resolve);
    //             };
    //             reader.onerror = (e) => reject(e);
    //             reader.readAsDataURL(file);
    //         });
    //     } catch (e) {
    //         console.error('Avatar upload failed', e);
    //     } finally {
    //         setUploadingAvatar(false);
    //     }
    // };

    const handleAvatarFile = async (file) => {
        console.log("file handleAvatarFile: ", file);
        if (!file) return;

        setUploadingAvatar(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("avatar", file);
            // console.log( formData.append("avatar", file));
            for (const [key, value] of formData.entries()) {
                console.log(key, value);
            }
            const idToken = localStorage.getItem("idToken");
            const url = new URL('https://uploader-2wtihj5jvq-uc.a.run.app/uploadProfilePicture');
            url.searchParams.append('userId',  localStorage.getItem("userID"));
            const res = await fetch(
               url,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: formData,
                }
            );

            if (!res.ok) {
            throw new Error("Failed to upload avatar");
            }

            const data = await res.json();

            // ✅ Update UI + persist profile
            console.log("avat url: ", data.result.avatarUrl);
            setAvatarDraft(data.result.avatarUrl);

            const updated = { ...profile, avatarUrl: data.result.avatarUrl, url:data.result.avatarUrl,  fullName: nameDraft};
            console.log("profile: ", updated);
            setProfile(updated);
            await updateUserProfile(updated);
            await writeProfile(updated);
            // Only clear cached media so new avatar fetches fresh copy; automatically refresh media elements
            try { await ClearMediaCache({ refresh: true }); } catch (e) { console.warn('ClearMediaCache failed', e); }
        } catch (err) {
            console.error("Avatar upload failed", err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const winRate = profile.stats.gamesPlayed
        ? ((profile.stats.gamesWon / profile.stats.gamesPlayed) * 100).toFixed(1) + '%'
        : '—';

    const initials = (profile.fullName || 'P')
        .split(' ')
        .map(s => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const saveProfile = () => {
        // try to parse walletDraft as JSON if the user entered an object
        let walletValue = walletDraft;
        if (typeof walletDraft === 'string') {
            const trimmed = walletDraft.trim();
            if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
                try { walletValue = JSON.parse(trimmed); } catch (e) { /* leave as string */ }
            }
        }

        const updated = {
            ...profile,
            fullName: nameDraft || 'Player',
            avatarUrl: avatarDraft || '',
            wallet: walletValue || ''
        };
        setProfile(updated);
        writeProfile(updated);
        setEditing(false);
    };

    // const resetStats = () => {
    //     const updated = {
    //         ...profile,
    //         stats: {
    //             gamesPlayed: 0,
    //             gamesWon: 0,
    //             gamesLost: 0,
    //             totalWagered: 0,
    //             totalWon: 0
    //         }
    //     };
    //     setProfile(updated);
    //     writeProfile(updated);
    // };

    const exportProfile = () => {
        const data = JSON.stringify(profile, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dice-profile.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    

    return (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 28, background: '#4b8cff',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: 18, overflow: 'hidden'
                }}>
                    {profile.avatarUrl ? (
                        // eslint-disable-next-line jsx-a11y/img-redundant-alt
                        <img src={profile.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : initials}
                </div>

                <div style={{ flex: 1 }}>
                    {editing ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                            <input placeholder="Name" value={nameDraft} onChange={e => setNameDraft(e.target.value)} />
                            <div>
                                <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    else {console.log("file: ", file)}

                                    // Optional: client-side validation
                                    if (file.size > 2 * 1024 * 1024) {
                                        alert("Image must be smaller than 2MB");
                                        return;
                                    }

                                    handleAvatarFile(file);

                                    // Reset input so same file can be re-selected later
                                    e.target.value = "";
                                }}
                                />
                                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                                    {uploadingAvatar ? 'Uploading avatar...' : avatarDraft ? 'Preview available' : 'No avatar chosen'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={saveProfile}>Save</button>
                                <button onClick={() => {
                                    setEditing(false);
                                    setNameDraft(profile.fullName);
                                    setAvatarDraft(profile.avatarUrl);
                                }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{profile.fullName}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>{profile.email || 'No email'}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>Wallet: {formatWallet(profile.wallet)}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>Joined {new Date(profile.createdAt).toLocaleDateString()}</div>
                            </div>
                            <button onClick={() => {
                                setEditing(true);
                                setNameDraft(profile.fullName);
                                setAvatarDraft(profile.avatarUrl);
                            }}>Edit</button>
                        </div>
                    )}
                </div>
            </div>

            <hr style={{ margin: '12px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Games Played</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.stats.gamesPlayed}</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Games Won</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.stats.gamesWon}</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Games Lost</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.stats.gamesLost}</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Win Rate</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{winRate}</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Total Wagered</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.stats.totalWagered}</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Total Won</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.stats.totalWon}</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {/* <button onClick={resetStats}>Reset Stats</button> */}
                <button onClick={exportProfile}>Export</button>
                <button onClick={async () => {
                    try {
                        const res = await ClearMediaCache();
                    } catch (e) {
                        console.error('Failed to clear media cache', e);
                        alert('Failed to clear media cache. See console for details.');
                    }
                }}>Clear Media Cache</button>
            </div>
        </div>
    );
}

// const getUserProfile = async (userId) => {
//     if (!userId) return null;   
//     try {
//         const db = getDatabase();
//         const profileRef = ref(db, `users/${userId}`);
//         const snapshot = await get(profileRef);
//         return snapshot.val();
//     } catch (e) {
//         console.error('Error fetching user profile', e);
//         return null;
//     }
// };  

const getUserProfile = async () => {
  try{
    const url = new URL('https://app-2wtihj5jvq-uc.a.run.app/getUserData');
    url.searchParams.append('userId',  localStorage.getItem("userID"));
    const res = await fetch(url,{
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("idToken")}` 
      }
    });

    const data = await res.json();
    console.log(data)
    return await data;
  }
  catch(err){
    console.log(err);
    throw new Error(err);
  }
}

const updateUserProfile = async (update) => {
  try{
    const url = new URL('https://app-2wtihj5jvq-uc.a.run.app/updateUserProfile');
    url.searchParams.append('userId',  localStorage.getItem("userID"));
    const res = await fetch(url,{
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("idToken")}` 
      },
      body:  JSON.stringify({update})
    });

    const data = await res.json();
    console.log(data)
    return await data;
  }
  catch(err){
    console.log(err);
    throw new Error(err);
  }
}