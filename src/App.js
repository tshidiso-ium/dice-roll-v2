import './App.css';
import Login from './pages/login';
import Register from './pages/register';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route   } from 'react-router-dom';
import AccountPage from './pages/account';
import HomePage from './pages/home';


function App() {

  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    console.log(userLoggedIn);
    if (userLoggedIn) {
      setUserLoggedIn(true);
      window.location.href = '/home';
    }
    else{
      const { userId, idToken } = getItems("userId", "idToken");
      if((userId == null || idToken == null) &&  window.location.href !== 'http://localhost:3000/'){
          window.location.href = '/';
      }
      else{
        setUserLoggedIn(false);
      }
    }
  }, [userLoggedIn]); 

  const getItems = (...keys) => {
    const results = {};
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        results[key] = value ? value : null;
      } catch (error) {
        console.error(`Error parsing localStorage key: ${key}`, error);
        results[key] = null;
      }
    });
    return results;
  };

 const onUserLogin = async (userInfo) => {
  if(userInfo.user){
    console.log("User info: ", userInfo);
    const user = userInfo.user
    const idToken =  userInfo._tokenResponse;
    localStorage.setItem("userId", user.uid );
    localStorage.setItem("idToken", idToken.idToken );
    //setUserLoggedIn(true);
    window.location.href = '/';
  }
 }

  const onUserLogout = () => {
    const { userId, idToken } = getItems("userId", "idToken");
    if((userId == null || idToken == null) &&  window.location.href !== 'http://localhost:3000/'){
      console.log("window location ref: ", window.location.href)
      setUserLoggedIn(false)
      window.location.href = '/';
    }
  }

  const onRedirect = (href) => {
    console.log("On redirect: ", href);
    window.location.href = href;
  }
  return (
    <div className="h-screen bg-gradient-to-r from-black via-red-900 to-black text-yellow-300 font-mono">
      <BrowserRouter>
        <Routes>
          <Route index element={<Login userLoggedIn = {onUserLogin}/>} />
          <Route path="/register" exact element={<Register userRegistered = {onUserLogin}/>}/>
          <Route path="/" exact element={<Login userLoggedIn = {onUserLogin}/>}/>
          <Route path="/home" element={<HomePage userLoggedOut = {onUserLogout}  redirect={onRedirect}/>} />
          <Route path="/account"  element={<AccountPage userLoggedOut = {onUserLogout} redirect={onRedirect}/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
