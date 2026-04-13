import express from "express";
import { getallvideo, uploadvideo } from "../Controllers/video.js";
import { checkDownloadEligibility } from '../Controllers/download.js';
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.post('/check-download', checkDownloadEligibility);

export default routes;