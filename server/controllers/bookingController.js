import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

import User from "../models/User.js";
import sendTicketEmail from "../utils/sendTicketEmail.js";

import { clerkClient } from "@clerk/express";

import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// function to check availability of selected seats for a movie
const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

// export const createBooking = async (req, res) => {
//   try {
//     const { userId } = req.auth();


  
  
//     const { showId, selectedSeats } = req.body;
//     const { origin } = req.headers;

//     // check if the seat is available for the selected show
//     const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

//     if (!isAvailable) {
//       return res.json({
//         success: false,
//         message: "Selected Seats Are Not Available",
//       });
//     }

//     // Get the show datails
//     const showData = await Show.findById(showId).populate("movie");

//     // create a new booking
//     const booking = await Booking.create({
//       user: userId,
//       show: showId,
//       amount: showData.showPrice * selectedSeats.length,
//       bookedSeats: selectedSeats,
//     });

//     selectedSeats.map((seat) => {
//       showData.occupiedSeats[seat] = userId;
//     });

//     showData.markModified("occupiedSeats");

//     await showData.save();

//     // create razorpay order
//     const options = {
//       amount: booking.amount * 100, // convert to paise
//       currency: "INR",
//       receipt: booking._id.toString(),
//     };

//     const order = await razorpay.orders.create(options);

//     res.json({
//       success: true,
//       order,
//       bookingId: booking._id,
//     });
//   } catch (error) {
//     console.log(error.message);
//     res.json({ success: false, message: error.message });
//   }
// };

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();

    const { showId, selectedSeats } = req.body;

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's email from Clerk
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    // Get user's name from Clerk
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      "Movie Lover";

    if (!email) {
      return res.json({
        success: false,
        message: "User email not found",
      });
    }

    // Create or update user in MongoDB
    await User.findOneAndUpdate(
      { _id: userId },
      {
        _id: userId,
        name: name,
        email: email,
        image: clerkUser.imageUrl || "",
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    // Check if the selected seats are available
    const isAvailable = await checkSeatsAvailability(
      showId,
      selectedSeats
    );

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected Seats Are Not Available",
      });
    }

    // Get show details
    const showData = await Show.findById(showId).populate("movie");

    if (!showData) {
      return res.json({
        success: false,
        message: "Show not found",
      });
    }

    // Create a new booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    // Mark selected seats as occupied
    selectedSeats.forEach((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");

    await showData.save();

    // Create Razorpay order
    const options = {
      amount: booking.amount * 100,
      currency: "INR",
      receipt: booking._id.toString(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      bookingId: booking._id,
    });

  } catch (error) {
    console.log("CREATE BOOKING ERROR:", error.message);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    const occupiedSeats = Object.keys(showData.occupiedSeats);

    res.json({ success: true, occupiedSeats });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


// Add payment verification API

export const verifyPayment = async (req, res) => {
  try {
    console.log("========== VERIFY PAYMENT CALLED ==========");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      console.log("❌ Payment signature invalid");

      return res.json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Payment signature verified
    console.log("✅ Payment signature verified");
    console.log("Booking ID:", bookingId);

    // Mark booking as paid
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { isPaid: true },
      { new: true }
    );

    if (!booking) {
      console.log("❌ Booking not found");

      return res.json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log("✅ Booking found");
    console.log("Finding user:", booking.user);

    // Get user details
    const user = await User.findById(booking.user);

    console.log("User found:", user);
    console.log("User email:", user?.email);

    if (!user) {
      console.log("❌ User not found");

      return res.json({
        success: true,
        message: "Payment successful, but user details not found",
      });
    }

    // Get show + movie details
    const show = await Show.findById(booking.show).populate("movie");

    if (!show) {
      console.log("❌ Show not found");

      return res.json({
        success: true,
        message: "Payment successful, but show details not found",
      });
    }

    console.log("✅ Show found");
    console.log("Movie:", show.movie.title);

    // Send ticket email
    try {
      console.log("📧 Starting email sending...");

      await sendTicketEmail({
        email: user.email,
        name: user.name,
        bookingId: booking._id.toString(),
        movieTitle: show.movie.title,
        showDateTime: show.showDateTime,
        seats: booking.bookedSeats,
        amount: booking.amount,
      });

      console.log(`✅ Ticket email sent to ${user.email}`);

    } catch (emailError) {
      console.log("❌ EMAIL ERROR:", emailError.message);
    }

    res.json({
      success: true,
      message: "Payment successful and ticket email processed",
    });

  } catch (error) {
    console.log("❌ VERIFY PAYMENT ERROR:", error.message);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// new api 

export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);

    const options = {
      amount: booking.amount * 100,
      currency: "INR",
      receipt: booking._id.toString(),
    };

    const order = await razorpay.orders.create(options);

    res.json({ success: true, order, bookingId });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

