import React, { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile  } from 'firebase/auth';
import { auth } from '../../modules/firebase';
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cn } from '../utils/cn';
import Modal from "../../components/PopupVariant/popupVariant";
import logo from '../../images/dice-red.jpg'
import WindowSize from '../../modules/windowSize';
import { database, storage} from '../../modules/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as databaseRef, set } from 'firebase/database';

const Register = () => {
  const [user, setUser] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [fullName, setFullName] = useState('');
  const [phototUrl, setPhotoUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const Device = WindowSize();

  const [uid, setUid] = useState()

  const [modalState, setStateModal] = useState({
    showModal: false,
    text: "",
    title: "",
    icon: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setUploading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user)
      setUid(res.user.uid);
      setSuccess('Registration successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file && uid) {
      try{
        // const fileRef = storageRef(storage, `photos/${file.name}`);
        const fileRef = storageRef(storage, `photos/${uid}/${file.name}`);

        console.log(fileRef);
        const uploadResult  = await uploadBytes(fileRef, file);
        console.log(uploadResult);
        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);

        // Save URL to Firebase Realtime Database
        await set(databaseRef(database, `users/${uid}`), { url: downloadURL, fullName: fullName, tokensAvailable: 0 , gamesPlayed: 0, phoneNumber: phoneNumber,});
        // Update user profile with name and phone number
        const profile = await updateProfile(user, {
          displayName: fullName,
          photoURL: downloadURL
        });
        console.log("profile", profile);

        console.log('Photo URL saved to database!');
        setUploading(false);
        setProgress(100);
      }
      catch(err){
       console.error('Upload error:', err);
        setError(`Upload error: ${err.message}`);
        setUploading(false);
      }
      
    }
  };

  const handleFullNameChange = (event) => {
    setFullName(event.target.value);
  };


  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePhotoUrlChange = (event) => {
    setPhotoUrl(event.target.value);
  }

  const handlePhoneNumberChange = (event) => {
    setPhoneNumber(event.target.value);
  }


  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  }

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  }

  useEffect( () => {
      const uploadPhoto = async () => {
        try{
           handleUpload();
        }
        catch(err){
          console.log(err);
          throw new Error(err);
        }
      }
    uploadPhoto();
  }, [uid])


  return (
          <div className={`max-h-full h-screen min-w-[100%] ${Device.width > 700 ? "pt-10" : "pt-0"} flex flex-wrap dark:bg-gray-800`}>
            <div className="min-w-[99%] h-[90%] w-full dark:bg-black mb-10 ml-2">
                <Modal modalState={modalState} />
                <div className={`flex flex-wrap justify-center min-w-[100%] h-[99%] rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black ${Device.width > 700 ? "mt-10" : "mt-0"}`}>
                    <h3 className="text-red-600 text-lg max-w-sm dark:text-neutral-300 sm:mb-10">
                        Create Account
                    </h3>
                    <div className="flex flex-wrap justify-center content-center">
                      <form className={`${Device.width > 700 ? "my-8 w-[60%] pt-16" : "my-4 w-[100%]"} bord border border-red-200 p-8 rounded-xl`} onSubmit={handleRegister}>
                          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                              <LabelInputContainer>
                                  <Label htmlFor="fullname">Full Name</Label>
                                  <Input 
                                      id="firstname" 
                                      placeholder="John Doe" 
                                      type="text" 
                                      required
                                      value={fullName}
                                      onChange={handleFullNameChange}
                                  />
                              </LabelInputContainer>
                              <LabelInputContainer>
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                      id="email" 
                                      placeholder="johndoe@ium.co.za" 
                                      type='email'
                                      value={email}
                                      onChange={handleEmailChange}
                                  />
                              </LabelInputContainer>
                          </div>
                          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                            <LabelInputContainer>
                                <Label htmlFor="phoneNummber">Phone Number</Label>
                                <Input 
                                    id="phoneNummber" 
                                    placeholder="071 123 4567" 
                                    type="tel" 
                                    pattern="^\+[1-9]\d{1,14}$" 
                                    required
                                    value={phoneNumber}
                                    onChange={handlePhoneNumberChange}
                                />
                            </LabelInputContainer>
                            <LabelInputContainer>
                            <Label htmlFor="photoUpload">Upload Photo</Label>
                            <Input
                                id="photoUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {uploading ? `Uploading ${progress}%` : 'Upload Photo'}
                            </LabelInputContainer>
                           
                          </div>
                          
                          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                            <LabelInputContainer>
                                <Label htmlFor="password">Password</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={handlePasswordChange}
                                />
                            </LabelInputContainer>
                            <LabelInputContainer>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="passwordConfirm" 
                                    placeholder="" 
                                    type='password'
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                />
                            </LabelInputContainer>
                          </div>
                          <button
                              className="bg-gradient-to-br relative group/btn from-black dark:from-mt-20 dark:to-red-900 to-red-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
                              type="submit"
                          >
                            Register
                            <BottomGradient />
                          </button>
                      </form>
                    </div>
                    <div className="bg-gradient-to-r from-transparent via-red-300 dark:via-red-700 to-transparent my-4 h-[1px] w-full" />
                    <div className="flex justify-center">
                        <img src={logo} className="w-36 h-auto "/> 
                    </div>
                </div>
            </div>
        </div>
  );
};

export default Register;

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-[#00b060] to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-[#00b060]0 to-transparent" />
    </>
  );
};
