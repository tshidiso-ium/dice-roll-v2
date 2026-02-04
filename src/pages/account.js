import NavMobile from '../components/header/header'
import Profile from '../components/userProfile/Profile';

export default function AccountPage({userLoggedOut, redirect}){
    const onUserLogout  = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("idToken");
        userLoggedOut();
    };

    const onRedirect = (href) => {
        console.log("Home page on redirect")
        redirect(href)
    }

    return (
        <div className="h-screen bg-gradient-to-r from-black via-red-900 to-black text-yellow-300 font-mono">
            <NavMobile userLogedOut = {onUserLogout}  redirect={onRedirect}/>
            <div className='flex justify-center items-center'>
                <Profile />
            </div>
 
        </div>
    )
}