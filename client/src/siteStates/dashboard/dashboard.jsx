import React, { useEffect, useState } from "react";
import { useChat } from '../../contexts/chatContext';
import Chat from '../../components/Chat/chat';
import './dashboard.css';

function Dashboard() {
    const { avatar, favouredServers, addFavouredServer, activeServerUrl, setActiveServerUrl } = useChat();
    const [showServerModal, setShowServerModal] = useState(false);
    const [serverAddress, setServerAddress] = useState('');
    const [connectError, setConnectError] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [serverDetails, setServerDetails] = useState({});

    useEffect(() => {
        const fetchAllDetails = async () => {
            const results = {};
            await Promise.all(
                favouredServers.map(async (url) => {
                    try {
                        const res = await fetch(`https://${url}/ping`);
                        const data = await res.json();
                        results[url] = { name: data.name, icon: data.icon, online: true };
                    } catch {
                        results[url] = { name: url, icon: null, online: false };
                    }
                })
            );
            setServerDetails(results);
        };
        if (favouredServers.length > 0) fetchAllDetails();
    }, [favouredServers]);

    const handleConnect = async () => {
        const url = serverAddress.trim();
        if (!url) return;

        if (favouredServers.includes(url)) {
            setConnectError('Server already favored');
            return;
        }

        setConnecting(true);
        setConnectError('');

        try {
            const res = await fetch(`https://${url}/ping`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (data.type !== 'dechat') throw new Error();

            await addFavouredServer(url);

            setServerDetails(prev => ({
                ...prev,
                [url]: { name: data.name, icon: data.icon, online: true }
            }));

            setServerAddress('');
            setShowServerModal(false);
        } catch {
            setConnectError('Could not reach a DeChat server at that address');
        } finally {
            setConnecting(false);
        }
    }

    return (
        <div id="dashboard">
            <div id="sideContainer">
                <div id="serverSidebar">
                    {favouredServers.map((url) => {
                        const details = serverDetails[url];
                        return (
                            <button
                                key={url}
                                className={`btn-roundButton server-btn ${activeServerUrl === url ? 'active' : ''}`}
                                title={details?.name || url}
                                onClick={() => setActiveServerUrl(url)}
                            >
                                {details?.icon
                                    ? <img src={details.icon} alt={details.name} className="server-icon" />
                                    : <span className="server-icon-placeholder">{(details?.name || url).charAt(0).toUpperCase()}</span>
                                }
                                {!details?.online && <span className="server-offline-dot" />}
                            </button>
                        );
                    })}
                    <button className="btn-roundButton" id="addServer" onClick={() => setShowServerModal(true)}>+</button>
                </div>

                <label htmlFor="settingsBtn" id="settingsLabel">
                    <img src={avatar} className="avatar-preview-img" alt="Preview" />
                </label>
                <button id="settingsBtn" style={{ display: 'none' }} />
            </div>

            <div id="chatArea">
                {activeServerUrl ? (
                    <Chat />
                ) : (
                    <div id="noActiveServer">
                        <h2>Select a server to start chatting</h2>
                        <p>You have {favouredServers.length} favoured servers</p>
                    </div>
                )}
            </div>

            {showServerModal && (
                <div id="modalOverlay" onClick={() => setShowServerModal(false)}>
                    <div id="serverModal" onClick={(e) => e.stopPropagation()}>
                        <h2>Connect to a server</h2>
                        <p>Enter the address of the server you want to join.</p>
                        <label htmlFor="serverAddressInput">Server address</label>
                        <input
                            id="serverAddressInput"
                            type="text"
                            placeholder="192.168.1.1:3000"
                            value={serverAddress}
                            onChange={(e) => setServerAddress(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                        />
                        <span className="modal-hint">Include the port if the server uses a custom one.</span>
                        {connectError && <span className="modal-error">{connectError}</span>}
                        <div id="modalButtons">
                            <button className="btn-roundSquare" onClick={() => setShowServerModal(false)}>Cancel</button>
                            <button className="btn-roundSquare" id="connectBtn" onClick={handleConnect} disabled={connecting}>
                                {connecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;