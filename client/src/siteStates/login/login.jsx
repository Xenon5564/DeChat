import React from "react";
import './login.css';

function Login({password, setPassword, handleUnlock}){
    return (
        <div id="loginPage">
            <h2>Profile found! Please enter your credentials</h2>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder='Enter your password'
            />
        </div>
    );
}

export default Login;