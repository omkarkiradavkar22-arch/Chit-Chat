const sendToken = (user, statusCode, res) => {
  const token = user.generateToken();

  const isProduction = process.env.NODE_ENV === "production";

  const options = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user,
    });
};

export default sendToken;
