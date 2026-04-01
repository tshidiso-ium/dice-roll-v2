import "./App.css";
import Login from "./pages/login";
import Register from "./pages/register";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AccountPage from "./pages/account";
import HomePage from "./pages/home";

function AppRoutes() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getItems = (...keys) => {
    const results = {};
    keys.forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        results[key] = value || null;
      } catch (error) {
        console.error(`Error reading localStorage key: ${key}`, error);
        results[key] = null;
      }
    });
    return results;
  };

  useEffect(() => {
    const { userId, idToken } = getItems("userId", "idToken");
    const isAuthenticated = !!userId && !!idToken;

    setUserLoggedIn(isAuthenticated);

    if (!isAuthenticated && location.pathname !== "/" && location.pathname !== "/register") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  const onUserLogin = async (userInfo) => {
    if (userInfo.user) {
      const user = userInfo.user;
      const idToken = userInfo._tokenResponse;

      localStorage.setItem("userId", user.uid);
      localStorage.setItem("idToken", idToken.idToken);

      setUserLoggedIn(true);
      navigate("/home", { replace: true });
    }
  };

  const onUserRegister = async (userInfo) => {
    if (userInfo.user) {
      const user = userInfo.user;
      localStorage.setItem("userEmail", user.email);
      navigate("/", { replace: true });
    }
  };

  const onUserLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("idToken");
    localStorage.removeItem("userEmail");
    setUserLoggedIn(false);
    navigate("/", { replace: true });
  };

  const onRedirect = (href) => {
    navigate(href);
  };

  return (
    <div className="h-screen bg-gradient-to-r from-black via-red-900 to-black text-yellow-300 font-mono">
      <Routes>
        <Route path="/" element={<Login userLoggedIn={onUserLogin} />} />
        <Route
          path="/register"
          element={<Register userRegistered={onUserRegister} />}
        />
        <Route
          path="/home"
          element={
            userLoggedIn ? (
              <HomePage userLoggedOut={onUserLogout} redirect={onRedirect} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/account"
          element={
            userLoggedIn ? (
              <AccountPage userLoggedOut={onUserLogout} redirect={onRedirect} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;