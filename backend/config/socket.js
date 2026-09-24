// socket: Socket.IO singleton — one instance per process, rooms per
// institution + user. Auth reuses the access-token secret; role is
// re-checked from DB like verifyToken (never the JWT claim).
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from './env.js'
import { UserModel } from '../models/UserModel.js'

let io = null

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error('Not authorized, no token provided'));
    const decoded = jwt.verify(token, env.secretKey);
    const user = await UserModel.findById(decoded.sub).select('_id institution role isActive');
    if (!user || !user.isActive) return next(new Error('Not authorized'));
    socket.data = socket.data || {};
    socket.data.user = { id: String(user._id), institution: String(user.institution), role: user.role };
    next();
  } catch {
    next(new Error('Not authorized, token failed'));
  }
};

export const initSocket = (httpServer) => {
  if (io) return io // singleton — hot-reload safe
  io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true }
  })

  io.use(authenticateSocket)

  io.on('connection', (socket) => {
    const { id, institution } = socket.data.user
    socket.join(`user:${id}`)
    if (institution) socket.join(`institution:${institution}`)
  })

  return io
}

export const getIO = () => io // null until initSocket (tests import app only)
export const setIO = (instance) => { io = instance; }

// Fire-and-forget emits — never throw into the DB write path.
export const emitToUser = (userId, event, payload) => {
  try { io?.to(`user:${userId}`).emit(event, payload) } catch { /* socket down */ }
}

export const emitToInstitution = (institutionId, event, payload) => {
  try { io?.to(`institution:${institutionId}`).emit(event, payload) } catch { /* socket down */ }
}
