import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const sendPushToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({
      user: userId,
    });

    console.log("🔔 Sending push:", {
      userId,
      type: payload.type,
      subscriptions: subscriptions.length,
    });

    await Promise.all(
      subscriptions.map(async (subscriptionDoc) => {
        try {
          await webpush.sendNotification(
            subscriptionDoc.subscription,
            JSON.stringify(payload)
          );
        } catch (error) {
          console.error(
            "Push notification failed:",
            error.statusCode,
            error.message
          );

          if (
            error.statusCode === 404 ||
            error.statusCode === 410
          ) {
            await PushSubscription.deleteOne({
              _id: subscriptionDoc._id,
            });
          }
        }
      })
    );
  } catch (error) {
    console.error("SEND PUSH ERROR:", error);
  }
};