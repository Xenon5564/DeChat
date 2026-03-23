import React from "react";
import "./noProfile.css";

function noProfileState({setLoginState}) {
    return(
        <div id="loginPage">
            <h2>No profile found in memory</h2>
            <button className="btn-roundSquare" id="createProfile" onClick= {() => setLoginState('CREATE')}>Create New Profile</button>
            <button className="btn-roundSquare" id="loadProfile" onClick= {() => alert("Import profile (coming soon)")}>Load Existing Profile</button>
        </div>
    );
}

export default noProfileState;