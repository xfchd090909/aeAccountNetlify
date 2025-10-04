const nodemailer = require("nodemailer");
const Redis = require("ioredis");

// 连接Redis（从环境变量获取配置）
const redis = new Redis(process.env.REDIS_URL);

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);

  // 生成6位随机验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expireTime = 5 * 60; // 5分钟有效期（秒）

  try {
    // 存储验证码到Redis，并设置过期时间
    await redis.set(`verification:${email}`, code, 'EX', expireTime);

    // 创建SMTP连接
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 发送邮件
    await transporter.sendMail({
      from: `"AE账号管理面板" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "AE账号验证码",
      text: `您的验证码是: ${code}，有效期5分钟。注意:AE账号管理面板的验证码仅向发起获取的用户知晓，如果你未使用过AE账号管理面板且收到了这条验证码信息，请无视即可！`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "验证码已发送" }),
    };
  } catch (error) {
    console.error("发送验证码失败:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "发送验证码失败，请稍后重试" }),
    };
  } finally {
    // 关闭Redis连接
    await redis.quit();
  }
};