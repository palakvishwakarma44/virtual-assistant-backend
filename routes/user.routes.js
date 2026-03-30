import express from "express";
import {
    askToAssistant,
    getCurrentUser,
    updateAssistant,
    openApp,
    summarizeYoutube,
    summarizePdf,
    analyzeImage,
    generateImage,
    deleteHistory,
    proxyImage
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.get("/fetch-artwork", proxyImage); // No isAuth for speed (public proxy)
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant);
userRouter.post("/asktoassistant", isAuth, upload.single("image"), askToAssistant);
userRouter.post("/open-app", isAuth, openApp);
userRouter.post("/summarize-youtube", isAuth, summarizeYoutube);
userRouter.post("/summarize-pdf", isAuth, upload.single("pdf"), summarizePdf);
userRouter.post("/analyze-image", isAuth, upload.single("image"), analyzeImage);
userRouter.post("/generate-image", isAuth, generateImage);
userRouter.delete("/history", isAuth, deleteHistory);

export default userRouter;