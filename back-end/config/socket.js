let ioInstance = null;

const setSocketInstance = (io) => {
  ioInstance = io;
};

const getSocketInstance = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};

/** Same instance as getSocketInstance, or null if the server has not called setSocketInstance yet */
const getSocketOrNull = () => ioInstance;

module.exports = { setSocketInstance, getSocketInstance, getSocketOrNull };