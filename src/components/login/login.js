import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../modules/firebase';
import logo from '../../images/dice-red.png'

const Login = ({userLoggedIn}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [modalState, setStateModal] = useState({'showModal': false, "text": '', "title" :'', 'icon': ''});

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("loging in");
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth,email, password);
      console.log(result);
      const idToken = await result._tokenResponse;
      const uid = await verifyUser(idToken.idToken);
      if (result && uid.uid == result.user.uid) {
        // Display the success popup
        setStateModal({
          showModal: true,
          text: 'Login Successful',
          title: "Welcome",
          icon: "approved",
        });
        localStorage.setItem("userID", result.user.uid);
        localStorage.setItem("idToken", idToken.idToken);
        userLoggedIn(result);
      }
      else{
        setStateModal({
          showModal: true,
          icon: "unapproved",
          title: "Try Again",
          text: `Failed to login`
        });
      }
      // userLogedIn(await signInWithEmailAndPassword(auth, email, password));
      // On successful login, you can redirect or show a success message
    } catch (err) {
      console.log(err);
      setError(err.message);
    }
    finally {
      // Ensure the Popup is dismissed after the sign-in process is complete or encounters an error
      setTimeout(() => {
        setStateModal({'showModal': false, "text": '', "title" :'', 'icon': ''})
      }, 3000); // Adjust the delay as needed
    }
  };

return (
  <div
    className="flex items-center justify-center min-h-screen px-4"
    style={{
      backgroundImage: `url(${logo})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="w-full max-w-md backdrop-blur-2xl bg-black/70 border border-yellow-500/30 rounded-2xl shadow-2xl p-8">

      <h2 className="text-center text-3xl font-extrabold text-yellow-400 mb-2">
        🎰 Welcome Back
      </h2>
      <p className="text-center text-sm text-gray-300 mb-6">
        Log in to continue playing
      </p>

      <form onSubmit={handleLogin} className="space-y-4">

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-gray-600 text-white focus:outline-none focus:border-yellow-400"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-gray-600 text-white focus:outline-none focus:border-yellow-400"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-red-600 text-black font-extrabold tracking-wide hover:brightness-125 transition"
        >
          LOGIN
        </button>

      </form>

      <div className="text-center mt-6 text-sm text-gray-300">
        Don’t have an account?{" "}
        <span
          className="text-yellow-400 font-semibold cursor-pointer hover:underline"
          onClick={() => navigate("/register")}
        >
          Register
        </span>
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        🔞 You must be 18+ to play. Gamble responsibly.
      </p>

    </div>
  </div>
);

};

export default Login;

const verifyUser = async (idToken) => {
  try{
    const url = new URL('https://app-2wtihj5jvq-uc.a.run.app/verifyUser');
    url.searchParams.append('idToken', idToken);
    console.log(url)
    const res = await fetch(url,{
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
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