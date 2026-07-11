const sendToken = (user, statusCode, res) => {
  const token = user.generateToken();

  const options = {
    httpOnly: true,
    secure: false, // change to true in production with HTTPS
    sameSite: "lax",
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