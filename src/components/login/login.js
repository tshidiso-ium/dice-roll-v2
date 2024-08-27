import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../modules/firebase';
import logo from '../../images/dice-red.jpg'

const Login = ({userLogedIn}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
            console.log("loging in");
    setError(null);
    try {
      userLogedIn(await signInWithEmailAndPassword(auth, email, password));
      // On successful login, you can redirect or show a success message
    } catch (err) {
      setError(err.message);
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