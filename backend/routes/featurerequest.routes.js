import express from "express";
import { deleteFeatureRequest, downvoteFeatureRequest, getAllFeatureRequest, getAllFeatureRequestedByUser, searchFeatureRequestBasedOnName, sendFeatureRequest, upvoteFeatureRequest } from "../controllers/featurerequest.controllers.js";
import upload from "../middleware/multer.js";

const router = express.Router() ; 

router.post('/add/new/feature/request' ,upload.array("files" ,10),sendFeatureRequest)

router.get('/get/all/feature/request' ,getAllFeatureRequest) ; 

router.get('/get/all/feature/request/user/:userId' ,getAllFeatureRequestedByUser)

router.post('/upvote/Feature' ,upvoteFeatureRequest) 

router.post('/downvote/feature' ,downvoteFeatureRequest)

router.delete('/delete/feature' ,deleteFeatureRequest) 

router.get('/feature/request/search' ,searchFeatureRequestBasedOnName)

export default router ; 