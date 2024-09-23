import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../modules/firebase';
import logo from '../../images/dice-red.jpg'

const Login = ({userLogedIn}) => {
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
        userLogedIn(result);
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
    <div className={`flex flex-col items-center justify-center min-h-full`}   
    style={{
        backgroundImage: `url(${logo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '80vh'
    }}>
      <form onSubmit={handleLogin} className="backdrop-blur-xl p-6 rounded shadow-md ">

        <h2 className="text-2xl mb-6">Login</h2>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button type="submit" className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">
          Login
        </button>
      </form>
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