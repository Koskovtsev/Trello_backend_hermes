import { Resend } from 'resend';

export const sendResetEmail = async (email: string, token: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const resetLink = `https://fullstack-anton.pp.ua/reset-password?token=${token}`;
  
  try {
    const data = await resend.emails.send({
      from: `Trello Clone <mailings@send.fullstack-anton.pp.ua>`,
      to: [email],
      subject: 'Відновлення пароля',
      html: `<p>Ви запросили відновлення пароля. Використовуйте наступне посилання: <a href="${resetLink}">Відновити пароль</a></p><p>Якщо ви цього не робили, просто ігноруйте цей лист.</p>`,
    });
    return data;
  } catch (error) {
    console.error('Resend Error:', error);
    throw error;
  }
};
