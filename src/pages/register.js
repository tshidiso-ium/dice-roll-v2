import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../modules/firebase";
import logo from "../images/dice-red.png";
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

const Register = ({ userRegistered }) => {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isAdult, setIsAdult] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  

  const [modalState, setStateModal] = useState({
    showModal: false,
    text: "",
    title: "",
    icon: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isAdult) {
      setError("You must confirm that you are 18 years or older.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      setStateModal({
        showModal: true,
        title: "Account Created",
        text: "Registration successful",
        icon: "approved",
      });

      localStorage.setItem("userID", result.user.uid);

      if (userRegistered) {
        userRegistered(result);
      }
    } catch (err) {
      console.log(err);
    //   setError(err.message);
      setError(getAuthErrorMessage(err));
      setStateModal({
        showModal: true,
        title: "Registration Failed",
        text: err.message,
        icon: "unapproved",
      });
    } finally {
      setTimeout(() => {
        setStateModal({
          showModal: false,
          text: "",
          title: "",
          icon: "",
        });
      }, 3000);
    }
  };

  const getAuthErrorMessage = (error) => {
    if (!error?.code) {
        return "Something went wrong. Please try again.";
    }

    switch (error.code) {
        case "auth/email-already-in-use":
        return "An account with this email already exists. Please log in instead.";

        case "auth/invalid-email":
        return "Please enter a valid email address.";

        case "auth/weak-password":
        return "Your password is too weak. Please use at least 6 characters.";

        case "auth/user-not-found":
        return "No account found with this email.";

        case "auth/wrong-password":
        return "Incorrect password. Please try again.";

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
          Create Account
        </h2>
        <p className="text-center text-sm text-gray-300 mb-6">
          Join and start playing
        </p>

        <form onSubmit={handleRegister} className="space-y-4">

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

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Confirm Password
            </label>
            <TextField
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                variant="outlined"
                placeholder="••••••••"
                InputProps={{
                    endAdornment: (
                    <InputAdornment position="end">
                        <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            sx={{
                            color: showConfirmPassword ? "#facc15" : "#9ca3af", // yellow when active
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
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
          <div className="flex items-start gap-2 text-sm text-gray-300 p-[14px]">
            <input
                type="checkbox"
                id="isAdult"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="mt-1 accent-yellow-400"
            />
            <label htmlFor="isAdult" className="cursor-pointer">
                I confirm that I am <span className="text-yellow-400 font-semibold">18 years or older</span> and legally allowed to play.
            </label>
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
                REGISTER
        </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-300">
          Already have an account?{" "}
          <span
            className="text-yellow-400 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          🔞 You must be 18+ to play. Gamble responsibly.
        </p>

      </div>
    </div>
  );
};

export default Register;
