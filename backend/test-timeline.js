const { sequelize } = require('./src/config/db');
const { ComplaintTimeline, Complaint } = require('./src/models');
const { createTimelineEvent } = require('./src/services/timelineService');

async function testTimeline() {
  try {
    console.log("Checking DB connection and syncing...");
    await sequelize.authenticate();
    console.log("Connection successful!");

    // Check if table exists by querying it
    console.log("Querying timeline entries...");
    const initialTimeline = await ComplaintTimeline.findAll();
    console.log(`Initial timeline count: ${initialTimeline.length}`);

    // Create a mock complaint or find an existing one to associate with
    const complaint = await Complaint.findOne();
    if (!complaint) {
      console.log("No complaints found in the DB. Please submit a complaint first.");
      process.exit(0);
    }
    console.log(`Using existing complaint: ${complaint.complaintId}`);

    // Add a test timeline entry
    console.log("Adding mock timeline entry...");
    const testEntry = await createTimelineEvent(
      complaint.complaintId,
      'UNDER_REVIEW',
      'Test Event: Admin started reviewing complaint via script',
      'Verification Script',
      'SYSTEM'
    );
    console.log("Timeline entry created successfully!", testEntry.toJSON());

    // Fetch again
    const finalTimeline = await ComplaintTimeline.findAll({
      where: { complaintId: complaint.complaintId }
    });
    console.log(`Timeline count for ${complaint.complaintId}: ${finalTimeline.length}`);
    console.log("Entries:");
    finalTimeline.forEach((t, i) => {
      console.log(` [${i+1}] Stage: ${t.stage} | Message: ${t.message} | UpdatedBy: ${t.updatedBy} (${t.role})`);
    });

    // Cleanup test entry
    console.log("Cleaning up test entry...");
    await testEntry.destroy();
    console.log("Cleanup complete!");

    process.exit(0);
  } catch (error) {
    console.error("Timeline test failed:", error);
    process.exit(1);
  }
}

testTimeline();
