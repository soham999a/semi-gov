const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// Trigger: When a service request is approved, notify user
exports.onRequestApproved = functions.firestore
  .document("serviceRequests/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== "approved" && after.status === "approved") {
      // TODO: Send SMS/email notification to user
      console.log(`Request ${context.params.requestId} approved for user ${after.userId}`);
    }
  });

// Trigger: New user registered
exports.onUserCreated = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const user = snap.data();
    console.log(`New user registered: ${user.fullName} (${user.phoneNumber})`);
    // TODO: Send welcome SMS
  });
