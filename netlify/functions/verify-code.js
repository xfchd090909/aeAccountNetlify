const Redis = require("ioredis");

// 连接Redis（从环境变量获取配置）
const redis = new Redis(process.env.REDIS_URL);

exports.handler = async (event) => {
  const { email, code } = JSON.parse(event.body);

  try {
    // 从Redis获取存储的验证码
    const storedCode = await redis.get(`verification:${email}`);

    if (!storedCode) {
      return { statusCode: 400, body: JSON.stringify({ message: "验证码不存在或已过期" }) };
    }

    if (storedCode === code) {
      // 验证成功后删除验证码
      await redis.del(`verification:${email}`);
      return { statusCode: 200, body: JSON.stringify({ message: "验证通过" }) };
    } else {
      return { statusCode: 400, body: JSON.stringify({ message: "验证码错误" }) };
    }
  } catch (error) {
    console.error("验证验证码失败:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "验证过程出错，请稍后重试" }),
    };
  } finally {
    // 关闭Redis连接
    await redis.quit();
  }
};