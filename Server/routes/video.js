import express from "express";
import { getallvideo, uploadvideo } from "../Controllers/video.js";
import { recordAndCheckDownload, getDownloadedVideos } from '../Controllers/download.js';
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.post('/record-download', recordAndCheckDownload);
routes.get('/downloads/:userId', getDownloadedVideos);

export default routes;