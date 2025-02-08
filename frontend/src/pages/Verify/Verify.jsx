import React, { useContext, useEffect, useState } from "react";
import "./Verify.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState("verifying");

  // Extract parameters from URL
  const razorpayPaymentId = searchParams.get("razorpay_payment_id");
  const razorpayOrderId = searchParams.get("razorpay_order_id");
  const razorpaySignature = searchParams.get("razorpay_signature");
  const orderId = searchParams.get("orderId"); // MongoDB orderId

  const verifyPayment = async () => {
    try {
      // Validate all parameters exist
      if (
        !razorpayPaymentId ||
        !razorpayOrderId ||
        !razorpaySignature ||
        !orderId
      ) {
        throw new Error("Missing payment verification parameters");
      }

      // Send to backend for verification
      const response = await axios.post(`${url}/api/order/verify`, {
        orderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
      });

      // Handle success/failure
      if (response.data.success) {
        setVerificationStatus("success");
        setTimeout(() => navigate("/myorders"), 2000);
      } else {
        setVerificationStatus("failed");
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      setVerificationStatus("failed");
      setTimeout(() => navigate("/"), 3000);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, []);

  const renderContent = () => {
    switch (verificationStatus) {
      case "verifying":
        return (
          <div className="status-container">
            <div className="spinner"></div>
            <p>Verifying your payment...</p>
          </div>
        );
      case "success":
        return (
          <div className="status-container">
            <div className="success-icon">✓</div>
            <p>Payment verified successfully!</p>
            <p>Redirecting to your orders...</p>
          </div>
        );
      case "failed":
        return (
          <div className="status-container">
            <div className="error-icon">✕</div>
            <p>Payment verification failed</p>
            <p>Redirecting to homepage...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="verify">{renderContent()}</div>;
};

export default Verify;
