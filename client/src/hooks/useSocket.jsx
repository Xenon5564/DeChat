import { useState, useEffect } from "react";
import { io } from 'socket.io-client';

export function useSocket(username, publicKey, avatar) {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!username || !publicKey) return;

        const newSocket = io();

        newSocket.emit('join', { username, publicKey, avatar});
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [username, publicKey]);

    return socket;
}