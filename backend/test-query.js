const { sequelize } = require('./src/config/db');
const adminController = require('./src/controllers/adminController');

const mockReq = {
  params: {},
  body: {},
  query: {}
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.data = data;
    return this;
  }
};

async function test() {
  try {
    console.log("Checking DB connection...");
    await sequelize.authenticate();
    console.log("DB connection OK.");

    console.log("Testing getStats...");
    const statsRes = Object.create(mockRes);
    await adminController.getStats(mockReq, statsRes);
    console.log("getStats status:", statsRes.statusCode, "data:", statsRes.data);

    console.log("Testing getOfficers...");
    const officersRes = Object.create(mockRes);
    await adminController.getOfficers(mockReq, officersRes);
    console.log("getOfficers status:", officersRes.statusCode, "data length:", officersRes.data?.length);

    console.log("Testing getUsers...");
    const usersRes = Object.create(mockRes);
    await adminController.getUsers(mockReq, usersRes);
    console.log("getUsers status:", usersRes.statusCode, "data length:", usersRes.data?.length);

    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

test();
