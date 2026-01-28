import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../modules/firebase';
import logo from '../images/dice-red.png';
import { useNavigate } from "react-router-dom";
import {
  TextField,
  IconButton,
  InputAdornment
} from "@mui/material";
import {
  Visibility,
  VisibilityOff
} from "@mui/icons-material";

const Login = ({userLoggedIn}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [modalState, setStateModal] = useState({'showModal': false, "text": '', "title" :'', 'icon': ''});
  const navigate = useNavigate();

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
      // On successful login, you can redirect or show a success message
    } catch (err) {
      console.log(err);
      setError(getAuthErrorMessage(err));
    }
    finally {
      // Ensure the Popup is dismissed after the sign-in process is complete or encounters an error
      setTimeout(() => {
        setStateModal({'showModal': false, "text": '', "title" :'', 'icon': ''})
      }, 3000); // Adjust the delay as needed
    }
  };

  const getAuthErrorMessage = (error) => {
    if (!error?.code) {
        return "Something went wrong. Please try again.";
    }

    switch (error.code) {
        case "auth/invalid-credential":
          return "The email or password you entered is incorrect. Please try again.";

        case "auth/user-not-found":
          return "No account found with this email.";

        case "auth/wrong-password":
          return "Incorrect password. Please try again.";

        case "auth/email-already-in-use":
          return "An account with this email already exists. Please log in instead.";

        case "auth/too-many-requests":
          return "Too many attempts. Please wait a moment and try again.";

        case "auth/network-request-failed":
          return "Network error. Please check your internet connection.";

        default:
        return "Unable to complete your request. Please try again.";
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
         Welcome Back
      </h2>
      <p className="text-center text-sm text-gray-300 mb-6">
        Log in to continue playing
      </p>

      <form onSubmit={handleLogin} className="space-y-4">

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Email
          </label>
          <TextField
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={{
                  "& .MuiInputBase-input": {
                  color: "#fff",
                  padding: "14px",
                  },
                  "& .MuiInputLabel-root": {
                  color: "#ccc",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                  color: "#facc15",
                  },
                  "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "rgba(0,0,0,0.6)",
                  "& fieldset": {
                      borderColor: "#555",
                  },
                  "&:hover fieldset": {
                      borderColor: "#facc15",
                  },
                  "&.Mui-focused fieldset": {
                      borderColor: "#facc15",
                      borderWidth: "1px",
                  },
                  },
              }}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Password
          </label>
            <TextField
            type={showPassword ? "text" : "password"}
            // label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            variant="outlined"
            placeholder="••••••••"
            InputProps={{
                endAdornment: (
                <InputAdornment position="end">
                    <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        sx={{
                        color: showPassword ? "#facc15" : "#9ca3af", // yellow when active
                        transition: "all 0.2s ease",
                        "&:hover": {
                            color: "#facc15",
                            transform: "scale(1.1)",
                        },
                        "&:active": {
                            transform: "scale(0.95)",
                        },
                        }}
                    >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>


                ),
            }}
                sx={{
                    "& .MuiInputBase-input": {
                    color: "#fff",
                    padding: "14px",
                    },
                    "& .MuiInputLabel-root": {
                    color: "#ccc",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                    color: "#facc15",
                    },
                    "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    "& fieldset": {
                        borderColor: "#555",
                    },
                    "&:hover fieldset": {
                        borderColor: "#facc15",
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: "#facc15",
                        borderWidth: "1px",
                    },
                    },
                }}
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