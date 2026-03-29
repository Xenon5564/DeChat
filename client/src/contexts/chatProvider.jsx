import { useChat as useChatHook } from '../hooks/useChat';
import ChatContext from './chatContext';
import { CryptoEngine } from '../CryptoEngine';

export function ChatProvider({ socket, username, avatar, handleLogout, children}) {
    const chat = useChatHook(socket, username);

    return (
        <ChatContext.Provider value={{
            ...chat,
            avatar,
            handleLogout,
            CryptoEngine,
        }}>
            {children}
        </ChatContext.Provider>
    );
}