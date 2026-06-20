import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8080";

export const initiateSocketConnection = (token, userId, role) => {
  return io(SOCKET_URL, {
    auth: {
      token: token,
    },
    query: {
      userId: userId,
      role: role,
    },
    withCredentials: true,
  });
};
