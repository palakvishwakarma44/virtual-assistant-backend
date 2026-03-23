import axios from "axios";

async function run() {
  try {
    // 1. login to get cookie
    const loginRes = await axios.post("http://localhost:8000/api/auth/signin", {
      email: "test@gmail.com",
      password: "12345"
    }, { withCredentials: true });
    
    const cookie = loginRes.headers['set-cookie']?.[0] || '';
    console.log("Logged in successfully. Cookie size:", cookie.length);

    // 2. test askToAssistant
    const res = await axios.post("http://localhost:8000/api/user/asktoassistant", {
      command: "generate a cat image",
      userLang: "en-US"
    }, {
      headers: { Cookie: cookie, "Content-Type": "application/json" }
    });

    console.log("---- RESPONSE ----");
    console.log("Type:", res.data.type);
    console.log("Response Text:", res.data.response);
    
    if (res.data.image) {
      console.log("Has Image:", !!res.data.image);
      console.log("Image Prefix:", res.data.image.substring(0, 50));
    } else {
      console.log("NO IMAGE RETURNED!");
      console.log("Full data:", Object.keys(res.data));
    }
    
  } catch (err) {
    console.error("ERROR:");
    console.error(err.response?.status, err.response?.data, err.message);
  }
}

run();
