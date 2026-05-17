import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: "test@gmail.com",
    pass: "test"
  },
  // Force IPv4
  family: 4
} as any);

transporter.verify((error, success) => {
  if (error) {
    console.log("Error verifying:", error.message);
  } else {
    console.log("Server is ready to take our messages");
  }
});
