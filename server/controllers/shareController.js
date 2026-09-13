import Post from "../models/Post.js";

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export const sharePostPreview = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate(
        "user",
        "name username profilePic"
      );

    if (!post) {
      return res
        .status(404)
        .send("Post not found");
    }

   const frontendUrl =
  process.env.CLIENT_URL ||
  "https://chit-chat-six-eta.vercel.app";

    const backendUrl =
      process.env.BACKEND_URL ||
      `${req.protocol}://${req.get("host")}`;

    const postUrl =
      `${frontendUrl}/post/${post._id}/comments`;

    const shareUrl =
      `${backendUrl}/api/share/post/${post._id}`;

    const image =
      post.images?.[0] ||
      `${frontendUrl}/icon-512.png`;

    const authorName =
      post.user?.name ||
      post.user?.username ||
      "Chit-Chat User";

    const description =
      post.description?.trim() ||
      `View ${authorName}'s post on Chit-Chat`;

    const title =
      `${authorName} on Chit-Chat`;

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    return res.send(`
      <!DOCTYPE html>

      <html lang="en">

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${escapeHtml(title)}</title>

        <!-- Open Graph -->

        <meta
          property="og:type"
          content="website"
        />

        <meta
          property="og:site_name"
          content="Chit-Chat"
        />

        <meta
          property="og:title"
          content="${escapeHtml(title)}"
        />

        <meta
          property="og:description"
          content="${escapeHtml(description)}"
        />

        <meta
          property="og:image"
          content="${escapeHtml(image)}"
        />

        <meta
          property="og:image:secure_url"
          content="${escapeHtml(image)}"
        />

        <meta
          property="og:url"
          content="${escapeHtml(shareUrl)}"
        />

        <!-- Twitter / other platforms -->

        <meta
          name="twitter:card"
          content="summary_large_image"
        />

        <meta
          name="twitter:title"
          content="${escapeHtml(title)}"
        />

        <meta
          name="twitter:description"
          content="${escapeHtml(description)}"
        />

        <meta
          name="twitter:image"
          content="${escapeHtml(image)}"
        />

        <!-- Human visitor redirect -->

        <meta
          http-equiv="refresh"
          content="0;url=${escapeHtml(postUrl)}"
        />

      </head>

      <body>

        <p>
          Opening Chit-Chat post...
        </p>

        <script>
          window.location.replace(
            ${JSON.stringify(postUrl)}
          );
        </script>

      </body>

      </html>
    `);

  } catch (error) {

    console.error(
      "POST SHARE PREVIEW ERROR:",
      error
    );

    return res
      .status(500)
      .send("Failed to load post");

  }
};