import nodemailer from 'nodemailer';

export const sendResetEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
    },
  });

  const resetLink = `https://fullstack-anton.pp.ua/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Trello Clone" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Відновлення пароля',
    text: `Ви запросили відновлення пароля. Використовуйте наступне посилання: ${resetLink}\n\nЯкщо ви цього не робили, просто ігноруйте цей лист.`,
    html: `<p>Ви запросили відновлення пароля. Використовуйте наступне посилання: <a href="${resetLink}">Відновити пароль</a></p><p>Якщо ви цього не робили, просто ігноруйте цей лист.</p>`,
  };

  return transporter.sendMail(mailOptions);
};
