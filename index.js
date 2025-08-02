const express = require("express");
const app = express();
const port = 3000;

const BUNDLE_IDENTIFIER = "social.lemonade.app.staging"; // Prod: social.lemonade.app

// Middleware to parse URL-encoded bodies (Apple sends form data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/callback/apple", (req, res) => {
  try {
    // Extract parameters from Apple's callback
    const { code, id_token, state, user, error, error_description } =
      req.body || {};
    // Handle error cases from Apple
    if (error) {
      console.error("Apple Sign In error:", error, error_description);

      // Create error parameters for Android app
      const errorParams = new URLSearchParams({
        error: error,
        error_description: error_description || "",
        state: state || "",
      });

      // Create intent URL for Android app
      const intentUrl = `intent://callback?${errorParams.toString()}#Intent;package=${BUNDLE_IDENTIFIER};scheme=signinwithapple;end`;

      return res.redirect(intentUrl);
    }

    // Validate required parameters
    if (!code) {
      console.error("Missing authorization code from Apple");

      const errorParams = new URLSearchParams({
        error: "invalid_request",
        error_description: "Missing authorization code",
        state: state || "",
      });

      const intentUrl = encodeURI(
        `intent://callback?${errorParams.toString()}#Intent;package=${BUNDLE_IDENTIFIER};scheme=signinwithapple;end`
      );

      return res.redirect(intentUrl);
    }

    // Create success parameters for Android app
    const successParams = new URLSearchParams();
    successParams.append("code", code);
    if (id_token) successParams.append("id_token", id_token);
    if (state) successParams.append("state", state);
    if (user) successParams.append("user", user);

    // Create secure intent URL for Android app
    const intentUrl = encodeURI(
      `intent://callback?${successParams.toString()}#Intent;package=${BUNDLE_IDENTIFIER};scheme=signinwithapple;end`
    );

    console.log("Redirecting to Android app:", intentUrl);

    // Send HTML response with JavaScript redirection
    res.redirect(intentUrl);
  } catch (error) {
    console.error("Error processing Apple callback:", error);

    // Create error parameters
    const errorParams = new URLSearchParams({
      error: "server_error",
      error_description: "Internal server error processing callback",
    });

    const intentUrl = encodeURI(
      `intent://callback?${errorParams.toString()}#Intent;package=${BUNDLE_IDENTIFIER};scheme=signinwithapple;end`
    );

    // Send HTML response with JavaScript redirection
    res.redirect(intentUrl);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
