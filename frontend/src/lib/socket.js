import { io } from 'socket.io-client';
import { getAccessToken } from './api';

// Backend authenticates sockets via `socket.handshake.auth.token` and joins
// the client to a private `user:<id>` room, emitting `notification:new`.
// Call connectSocket() once after login and disconnectSocket() on logout.

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io('/', {
    path: '/socket.io',
    auth: { token: getAccessToken() },
    withCredentials: true,
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
