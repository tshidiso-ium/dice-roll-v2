import React, { useEffect, useState } from 'react';
import { getDatabase, ref as dbRef, onValue, set } from 'firebase/database';
import { ClearBrowserCache } from '../utils/clearCashe';
import { ClearMediaCache } from '../utils/clearMediaCache';
import TopUpModal from './topUp';
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
    const [showTopUp, setShowTopUp] = useState(false);
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


    return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-[#1a0000] to-[#0a0000] border border-yellow-500/30 rounded-2xl shadow-2xl p-6 text-white">

    {/* HEADER */}
    <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400 shadow-lg bg-black flex items-center justify-center text-xl font-extrabold text-yellow-400">
            {profile.avatarUrl ? (
            <img
                src={profile.avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
            />
            ) : (
            initials
            )}
        </div>

        {editing && (
            <label className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full cursor-pointer hover:brightness-110">
            Edit
            <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                hidden
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                    alert("Image must be smaller than 2MB");
                    return;
                }

                handleAvatarFile(file);
                e.target.value = "";
                }}
            />
            </label>
        )}
        </div>

        {/* Info */}
        <div className="flex-1">
        {editing ? (
            <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            className="w-full bg-black/60 border border-yellow-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            placeholder="Full name"
            />
        ) : (
            <>
            <div className="text-lg font-extrabold text-yellow-400">
                {profile.fullName}
            </div>
            <div className="text-xs text-gray-400">
                {profile.email || "No email"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
                Joined {new Date(profile.createdAt).toLocaleDateString()}
            </div>
            </>
        )}
        </div>

        {/* Edit Button */}
        {!editing && (
        <button
            onClick={() => {
            setEditing(true);
            setNameDraft(profile.fullName);
            setAvatarDraft(profile.avatarUrl);
            }}
            className="text-sm px-3 py-1 rounded-lg border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
        >
            Edit
        </button>
        )}
    </div>

    {/* Upload status */}
    {editing && (
        <div className="mt-3 text-xs text-gray-400">
        {uploadingAvatar
            ? "Uploading avatar…"
            : avatarDraft
            ? "Avatar ready to save"
            : "No avatar selected"}
        </div>
    )}

    {/* ACTIONS */}
    {editing && (
        <div className="flex gap-3 mt-4">
        <button
            onClick={saveProfile}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-red-600 text-black font-extrabold hover:brightness-110 transition"
        >
            Save
        </button>
        <button
            onClick={() => {
            setEditing(false);
            setNameDraft(profile.fullName);
            setAvatarDraft(profile.avatarUrl);
            }}
            className="flex-1 py-2 rounded-xl border border-gray-500 text-gray-300 hover:bg-gray-700 transition"
        >
            Cancel
        </button>
        </div>
    )}

    {/* DIVIDER */}
    <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent my-6" />

    {/* WALLET */}
    <div className="text-center mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
        Wallet Balance
        </div>
        <div className="text-2xl font-extrabold text-green-400">
        {formatWallet(profile.wallet)}
        </div>
    </div>

    {/* STATS */}
    <div className="grid grid-cols-2 gap-4 text-center">
        {[
        ["Games Played", profile.stats.gamesPlayed],
        ["Games Won", profile.stats.gamesWon],
        ["Games Lost", profile.stats.gamesLost],
        ["Win Rate", winRate],
        ["Total Wagered", profile.stats.totalWagered],
        ["Total Won", profile.stats.totalWon],
        ].map(([label, value]) => (
        <div
            key={label}
            className="bg-black/50 border border-yellow-500/20 rounded-xl p-3 shadow-inner"
        >
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-lg font-extrabold text-yellow-400">
            {value}
            </div>
        </div>
        ))}
    </div>

    {/* FOOTER ACTIONS */}
    <div className="mt-6 grid grid-cols-2 gap-4">
        <button
            onClick={() => setShowTopUp(true)}
            className="
            py-3 rounded-xl
            bg-gradient-to-r from-green-400 to-emerald-600
            text-black font-extrabold tracking-wide
            shadow-lg
            hover:brightness-110 hover:scale-[1.02]
            active:scale-95
            transition-all
            "
        >
            💳 Top Up
        </button>
        <button
            //   onClick={handleWithdraw}
            disabled={profile.wallet.balance <= 0}
            className={`
                py-3 rounded-xl font-extrabold transition-all
                ${profile.wallet.balance > 0
                ? "bg-gradient-to-r from-yellow-400 to-red-600 text-black hover:brightness-110 hover:scale-[1.02]"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"}
            `}
            >
        💸 WITHDRAW
        </button>
    </div>

    <TopUpModal
        open={showTopUp}
        onClose={() => setShowTopUp(false)}
        wallet={{
            todayDeposited: profile.wallet.todayDeposited,
            monthDeposited: profile.wallet.monthDeposited,
        }}
        onRedirectToPayment={async (amount) => {
            var idToken = localStorage.getItem("idToken");
            const url = new URL('https://payments-2wtihj5jvq-uc.a.run.app/createTopUpPayment');
            url.searchParams.append('idToken', idToken);
            const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("idToken")}`,
            },
            body: JSON.stringify({ amount }),
            });

            const data = await res.json();
            window.location.href = data.checkoutUrl;
        }}
    />
    </div>
    );
}

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