import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendTicketEmail = async ({
  email,
  name,
  bookingId,
  movieTitle,
  showDateTime,
  seats,
  amount,
}) => {
  const formattedDate = showDateTime
    ? new Date(showDateTime).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const formattedTime = showDateTime
    ? new Date(showDateTime).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const mailOptions = {
    from: `"Cine-Book 🎬" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🎟️ Your Cine-Book Ticket - ${movieTitle}`,

    html: `
      <div style="
        background:#f4f4f4;
        padding:30px;
        font-family:Arial, sans-serif;
      ">

        <div style="
          max-width:600px;
          margin:auto;
          background:white;
          border-radius:15px;
          overflow:hidden;
          box-shadow:0 4px 15px rgba(0,0,0,0.1);
        ">

          <div style="
            background:#6c2cff;
            color:white;
            padding:25px;
            text-align:center;
          ">
            <h1 style="margin:0;">🎬 Cine-Book</h1>
            <p style="margin:8px 0 0;">
              Movie Ticket Confirmation
            </p>
          </div>

          <div style="padding:30px;">

            <h2 style="margin-top:0;">
              Hello ${name || "Movie Lover"} 👋
            </h2>

            <p>
              Your payment was successful and your movie ticket has been
              confirmed.
            </p>

            <div style="
              border:2px dashed #6c2cff;
              border-radius:12px;
              padding:20px;
              margin-top:25px;
            ">

              <h2 style="
                color:#6c2cff;
                margin-top:0;
              ">
                🎟️ ${movieTitle}
              </h2>

              <hr>

              <p>
                <strong>📅 Date:</strong>
                ${formattedDate}
              </p>

              <p>
                <strong>🕐 Time:</strong>
                ${formattedTime}
              </p>

              <p>
                <strong>💺 Seats:</strong>
                ${seats.join(", ")}
              </p>

              <p>
                <strong>🎫 Tickets:</strong>
                ${seats.length}
              </p>

              <p>
                <strong>💰 Amount Paid:</strong>
                ₹${amount}
              </p>

              <p>
                <strong>🔖 Booking ID:</strong>
                ${bookingId}
              </p>

              <p>
                <strong>💳 Payment Status:</strong>
                <span style="color:green;font-weight:bold;">
                  PAID ✓
                </span>
              </p>

            </div>

            <div style="
              text-align:center;
              margin-top:30px;
            ">
              <p style="color:#666;">
                Please keep this email for your records.
              </p>

              <p style="
                font-size:13px;
                color:#999;
              ">
                Thank you for booking with Cine-Book 🎬
              </p>
            </div>

          </div>

        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendTicketEmail;