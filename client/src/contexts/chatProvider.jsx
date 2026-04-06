import { useChat as useChatHook } from '../hooks/useChat';
import ChatContext from './chatContext';
import { CryptoEngine } from '../CryptoEngine';

export function ChatProvider({ socket, username, avatar, handleLogout, favouredServers, addFavouredServer, removeFavouredServer, activeServerUrl, setActiveServerUrl, children}) {
    const chat = useChatHook(socket, username);

    return (
        <ChatContext.Provider value={{
            ...chat,
            avatar,
            handleLogout,
            CryptoEngine,
            favouredServers,
            addFavouredServer,
            removeFavouredServer,
            activeServerUrl,
            setActiveServerUrl,
        }}>
            {children}
        </ChatContext.Provider>
    );
}