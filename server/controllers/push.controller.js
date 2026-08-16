import PushSubscription from "../models/PushSubscription.js";

export const savePushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription?.endpoint) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription",
      });
    }

    await PushSubscription.findOneAndUpdate(
      {
        endpoint: subscription.endpoint,
      },
      {
        user: req.user._id,
        endpoint: subscription.endpoint,
        subscription,
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Push subscription saved",
    });
  } catch (error) {
    console.error("SAVE PUSH SUBSCRIPTION:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};