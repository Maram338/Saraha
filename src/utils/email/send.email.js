import nodemailer from "nodemailer"
import { EMAIL, PASS } from "../../../config/config.service.js";

export const sendEmail = async (
    {to, subject = "", html = "", attachments = []}
) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        tls:{
            rejectUnauthorized:false
        },
        auth:{
            user: EMAIL,
            pass: PASS
        }
    });
    const info = await transporter.sendMail({
        from:`"maram" <${EMAIL}>`,
        to,
        subject,
        html,
        attachments
    });
    console.log("message sent:", info.messageId);
    return info.accepted.length ? true : false
}

export const generateOtp = async () => {
    return Math.floor(100000 + Math.random() * 900000)
}