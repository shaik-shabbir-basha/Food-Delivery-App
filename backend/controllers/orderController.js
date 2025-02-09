import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { log } from "console";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    // Validate required fields
    if (!userId || !items || !amount || !address) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Create Razorpay order first
    const amountInPaise = Math.round(amount * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      payment_capture: 1,
    });

    // Save order to database with Razorpay order ID
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      razorpayOrderId: razorpayOrder.id,
      payment: false, // Initially unpaid
    });

    await newOrder.save();

    // Clear user's cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        currency: razorpayOrder.currency,
        amount: razorpayOrder.amount,
        key: process.env.RAZORPAY_ID_KEY,
        orderId: newOrder._id,
      },
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({
      success: false,
      message: "Error placing order",
      error: error.message,
    });
  }
};

const verifyOrder = async (req, res) => {
  const {
    orderId,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;

  // Validate required fields
  if (
    !orderId ||
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Find and update the order using MongoDB _id
    const order = await orderModel.findByIdAndUpdate(
      orderId, // Use MongoDB _id to find the order
      {
        payment: true,
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true } // Return the updated document
    );

    console.log("Updated Order:", order); // Log the updated order

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying order:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
    });
  }
};
// Use authentication middleware to get userId
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

//listing orders for admin panel
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error in List Orders" });
  }
};

//api for updating order status
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error in Update Status" });
  }
};
export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
