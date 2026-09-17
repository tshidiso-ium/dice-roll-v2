const verifyUser = async (auth, idToken) => {
    try {
        if (typeof idToken !== "string" || idToken.length < 20) {
            return {errorInfo: {code: "auth/invalid-id-token", message: "Authentication failed"}};
        }
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    } catch (err) {
        console.warn("Token verification failed", {code: err?.code || "auth/verification-failed"});
        return {
            errorInfo: {
                code: err?.code || "auth/verification-failed",
                message: "Authentication failed",
            },
        };
    }
}

const setUserRole = async (auth, userEmail, type, accessLevel) => {
    try{
        const userId = await auth.getUserByEmail(userEmail)
        if(userId.uid){
            var userAccessLevel;

            if(userId.customClaims){
                userAccessLevel = userId.customClaims.accessLevel
            }
            else{
                userAccessLevel = 0
            }

            if(type === "employee" && accessLevel >= userAccessLevel)
            {   
                const results = await auth.setCustomUserClaims(userId.uid, {admin: false, accessLevel: 1})
                if(results === undefined){
                    return {message: 'user role succesfully updated to employee'};
                }
                else return results
            }
            else if (type === "manager" && accessLevel >= userAccessLevel)
            {
                const results = await auth.setCustomUserClaims(userId.uid, {admin: false, accessLevel: 2})
                if(results === undefined){
                    return {message: 'user role succesfully updated to manager'};
                }
                else return results
            }
            else if (type === "senior_manager" && accessLevel >= userAccessLevel)
            {
                const results = await auth.setCustomUserClaims(userId.uid, {admin: true, accessLevel: 3})
                if(results === undefined){
                    return {message: 'user role succesfully updated to senior manager'};
                }
                else return results
            }
            else if (type === "executive" && accessLevel >= userAccessLevel)
            {
                const results = await auth.setCustomUserClaims(userId.uid, {admin: true, accessLevel: 4})
                if(results === undefined){
                    return {message: 'user role succesfully updated to executive'};
                }
                else return results
            }
        }
        else{
            return {message: 'user does not exist'}
        }
    }
    catch(err){
        console.warn("Role update failed", {code: err?.code || err?.errorInfo?.code || "unknown"});
        return {error: err.errorInfo};
    }
}

const getUserRole = async (auth,uid, idToken) => {
    try{
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    }
    catch(err){
        console.warn("Role lookup authentication failed", {code: err?.code || "unknown"});
        throw err;
    }
}

const createUser = async (auth, fullName, userEmail, phoneNumber, password ) => {
    try{
        const userId = await auth.getUserByEmail(userEmail)
        if(userId.errorInfo){
        }
        else{
            return  {error:  {message: 'user already exists', code: 'auth/user-already-exists'}};
        }
    }
    catch(err){
        if(err.errorInfo){
            if(err.errorInfo.code === 'auth/user-not-found'){
                if (typeof password !== "string" || password.length < 12) {
                    return {error: {message: "A strong password is required", code: "auth/weak-password"}};
                }
                const results =  await auth.createUser({
                    email: userEmail,
                    emailVerified: false,
                    phoneNumber: phoneNumber,
                    password,
                    displayName: fullName,
                    disabled: false,
                })
            
                return results
            }
            else{
                return err;
            }
        }
        else{
            return err;
        }
    }
}


const disableUser = async (auth, uid) => {
    try{
        const userUpdated = await auth.updateUser( uid, {
            disabled: true,
        })
        console.info("User disabled", {uid});
        return userUpdated;
    }
    catch(err){
        console.warn("Disable user failed", {uid, code: err?.code || "unknown"});
        throw err;
    }
}

module.exports = {
    verifyUser,
    setUserRole,
    getUserRole,
    createUser,
    disableUser
} 
