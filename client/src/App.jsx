import { useAuth } from './hooks/useAuth';
import { useState } from 'react';
import { useSocket } from './hooks/useSocket';

import { ChatProvider } from './contexts/chatProvider';

import NoProfileState from "./siteStates/no_profile/noProfile";
import Register from "./siteStates/register/register";
import Login from "./siteStates/login/login";
import Dashboard from "./siteStates/dashboard/dashboard";

import './App.css';

function App() {
  const {
    loginState, setLoginState,
    username, setUsername,
    password, setPassword,
    avatar, setAvatar,
    publicKey,
    handleCreateProfile,
    handleUnlock,
    handleLogout,
    favouredServers,
    addFavouredServer,
    removeFavouredServer,
  } = useAuth();

  const [activeServerUrl, setActiveServerUrl] = useState(null);

  const sockets = useSocket(
    loginState === 'DASHBOARD' ? username : null,
    loginState === 'DASHBOARD' ? publicKey : null,
    loginState === 'DASHBOARD' ? avatar : null,
    favouredServers
  );

  const activeSocket = sockets[activeServerUrl];

  const renderScreen = () => {
    switch (loginState) {
      case 'CHECK':
        return <h2>Checking for profile...</h2>;
      
      case 'NO_PROFILE':
        return <NoProfileState setLoginState={setLoginState} />;

      case 'CREATE':
        return <Register username={username} setUsername={setUsername} password={password} setPassword={setPassword} avatar={avatar} setAvatar={setAvatar} handleCreateProfile={handleCreateProfile} setLoginState={setLoginState} />;

      case 'UNLOCK':
        return <Login password={password} setPassword={setPassword} handleUnlock={handleUnlock} />;

      case 'DASHBOARD':
        return (
          <ChatProvider 
            socket={activeSocket} 
            username={username} 
            avatar={avatar} 
            handleLogout={handleLogout} 
            favouredServers={favouredServers} 
            addFavouredServer={addFavouredServer} 
            removeFavouredServer={removeFavouredServer}
            activeServerUrl={activeServerUrl}
            setActiveServerUrl={setActiveServerUrl}
          >
            <Dashboard />
          </ChatProvider>
        )

      default:
          return <h2>Unknown State.</h2>;
    }
  }

  return (
      <div id="container">
          {renderScreen()}
      </div>
  );
}

export default App;