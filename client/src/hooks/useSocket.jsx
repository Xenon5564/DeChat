import { useState, useEffect, useRef } from "react";
import { io } from 'socket.io-client';

export function useSocket(username, publicKey, avatar, favouredServers = []) {
    const [sockets, setSockets] = useState({});
    const socketsRef = useRef({});

    useEffect(() => {
        if (!username || !publicKey) {
            // Cleanup if logged out
            Object.values(socketsRef.current).forEach(s => s.disconnect());
            socketsRef.current = {};
            setSockets({});
            return;
        }

        // Connect to favoured servers that aren't already connected
        favouredServers.forEach(url => {
            if (!socketsRef.current[url]) {
                const protocol = url.includes('localhost') ? 'https' : 'https'; // Assuming https for now
                const socketUrl = url.startsWith('http') ? url : `https://${url}`;
                
                const newSocket = io(socketUrl, {
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });

                newSocket.on('connect', () => {
                    console.log(`[Socket] Connected to ${url}`);
                    newSocket.emit('join', { username, publicKey, avatar });
                });

                newSocket.on('message notification', (notif) => {
                    console.log(`[Notification from ${url}] New message in ${notif.roomId} from ${notif.username}`);
                });

                newSocket.on('disconnect', () => {
                    console.log(`[Socket] Disconnected from ${url}`);
                });

                newSocket.on('connect_error', (err) => {
                    console.error(`[Socket] Connection error for ${url}:`, err.message);
                });

                socketsRef.current[url] = newSocket;
                setSockets(prev => ({ ...prev, [url]: newSocket }));
            }
        });

        // Cleanup servers no longer in favoured list
        Object.keys(socketsRef.current).forEach(url => {
            if (!favouredServers.includes(url)) {
                socketsRef.current[url].disconnect();
                delete socketsRef.current[url];
                setSockets(prev => {
                    const newState = { ...prev };
                    delete newState[url];
                    return newState;
                });
            }
        });

    }, [username, publicKey, favouredServers]);

    // Final cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(socketsRef.current).forEach(s => s.disconnect());
            socketsRef.current = {};
        };
    }, []);

    return sockets;
}
