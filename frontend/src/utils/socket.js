import { io } from 'socket.io-client';

// Use same host but port 3001 for backend
const SOCKET_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : '/';

export const socket = io(SOCKET_URL);
