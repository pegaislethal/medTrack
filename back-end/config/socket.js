let ioInstance = null;

const setSocketInstance = (io) => {
  ioInstance = io;
};

const getSocketInstance = () => ioInstance;

module.exports = {
  setSocketInstance,
  getSocketInstance,
};
