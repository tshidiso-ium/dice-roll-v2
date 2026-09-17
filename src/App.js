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
import ErrorBoundary from "./components/ErrorBoundary";
import {auth} from "./modules/firebase";
import {onAuthStateChanged, signOut} from "firebase/auth";
import {
  clearAuthSession,
  setAuthSession,
} from "./modules/sessionStorage";

function AppRoutes() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setAuthSession({userId: user.uid});
      else clearAuthSession();
      setUserLoggedIn(Boolean(user));
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (authReady && !userLoggedIn && location.pathname !== "/" && location.pathname !== "/register") {
      navigate("/", { replace: true });
    }
  }, [authReady, location.pathname, navigate, userLoggedIn]);

  const onUserLogin = async (userInfo) => {
    if (userInfo.user) {
      const user = userInfo.user;
      setAuthSession({ userId: user.uid });

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

  const onUserLogout = async () => {
    await signOut(auth).catch(() => undefined);
    clearAuthSession();
    localStorage.removeItem("userEmail");
    setUserLoggedIn(false);
    navigate("/", { replace: true });
  };

  const onRedirect = (href) => {
    navigate(href);
  };

  if (!authReady) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-yellow-300">Loading session…</main>;
  }

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
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
