// 1. Mock de nodemailer debe ir antes de cualquier importación
jest.mock('nodemailer');
const nodemailer = require('nodemailer');
const sendMailMock = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

// 2. Variables de entorno necesarias ANTES de importar el servicio
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'testuser';
process.env.EMAIL_PASS = 'testpass';
process.env.EMAIL_FROM = 'test@example.com';
process.env.NODE_ENV = 'development';      // evita la protección de test
process.env.SKIP_EMAILS = 'false';         // idem

// 3. Ahora importamos el servicio (se creará el transporter con las variables)
const {
  sendEmail,
  sendWelcomeEmail,
  sendCampaignNotification,
  sendPasswordResetEmail,
} = require('../../../src/services/emailService');

// Espía console.error para verificar logs de error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  // Limpia los mocks antes de cada test
  sendMailMock.mockClear();
  consoleErrorSpy.mockClear();
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe('Email Service', () => {
  test('sendEmail envia correo correctamente cuando está configurado', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: '123' });
    await sendEmail('test@example.com', 'Test Subject', 'custom', { body: '<p>Hola</p>' });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  test('sendEmail registra error si falla el transporte', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Some error'));
    await sendEmail('fail@test.com', 'Test', 'custom', { body: '<p>Error</p>' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to send email to fail@test.com:'),
      expect.any(Error)
    );
  });

  test('sendWelcomeEmail funciona', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: '123' });
    await sendWelcomeEmail('welcome@test.com');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  test('sendCampaignNotification funciona', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: '123' });
    await sendCampaignNotification('camp@test.com', { id: 1, name: 'Campaña' });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  test('sendPasswordResetEmail funciona', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: '123' });
    await sendPasswordResetEmail('reset@test.com', 'http://reset.link');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});