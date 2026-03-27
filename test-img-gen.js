// Quick test: login and call generate-image
import axios from "axios";

const BASE = "https://virtual-assistant-backend-xd3m.onrender.com";

async function run() {
  // 1. Login
  const loginRes = await axios.post(`${BASE}/api/auth/signin`, {
    email: "test@gmail.com",
    password: "12345"
  }, { withCredentials: true });

  const cookie = loginRes.headers['set-cookie']?.[0] || '';
  console.log("Login status:", loginRes.status);

  // 2. Call generate-image
  const imgRes = await axios.post(`${BASE}/api/user/generate-image`,
    { prompt: "red cat" },
    { headers: { Cookie: cookie, 'Content-Type': 'application/json' } }
  );

  const url = imgRes.data?.imageUrl || "";
  const errRes = imgRes.data?.response || "";
  console.log("Status:", imgRes.status);
  console.log("Has imageUrl:", !!url);
  if (url) {
    console.log("imageUrl format:", url.substring(0, 80));
    console.log("Is data URI:", url.startsWith("data:"));
  } else {
    console.log("Error response:", errRes);
  }
}

run().catch(e => {
  console.error("FAILED:", e.response?.status, e.response?.data, e.message);
});
