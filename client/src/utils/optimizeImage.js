export const optimizeImage = (url, width = 900) => {
  if (!url) return "";

  // Cloudinary image असेल तर optimized version
  if (
    url.includes("res.cloudinary.com") &&
    url.includes("/upload/")
  ) {
    return url.replace(
      "/upload/",
      `/upload/f_auto,q_auto,c_limit,w_${width}/`
    );
  }

  // Non-Cloudinary image unchanged
  return url;
};