import { createContext, useContext } from "react";

const ChatContext = createContext(null);

export function useChat() {
    return useContext(ChatContext);
}

export default ChatContext;