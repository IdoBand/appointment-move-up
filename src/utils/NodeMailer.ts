import nodemailer from 'nodemailer';
import dotev from 'dotenv'
dotev.config()

export class NodeMailer {
    private readonly EMAIL_ADD: string = process.env.EMAIL_ADD
    private readonly EMAIL_PASS: string = process.env.EMAIL_PASS
    private readonly EMAIL_SERVICE: string = process.env.EMAIL_SERVICE
    private static instance: NodeMailer
    private constructor() {

    }
    public static init() {
      if (!this.instance) {
          this.instance = new NodeMailer()
      }
      return this.instance
    }
    async sendEmail(header: string, content: string) {
      const transporter = nodemailer.createTransport({
          service: this.EMAIL_SERVICE,
          auth: {
            user: this.EMAIL_ADD,
            pass: this.EMAIL_PASS
          }
        });
        
        const mailOptions = {
          from: this.EMAIL_ADD,
          to: this.EMAIL_ADD,
          subject: header,
          text: content
        };
        
        try {
          const info = await transporter.sendMail(mailOptions);
        } catch (err) {
          console.error('Error sending email:', err);
        }
    }
}