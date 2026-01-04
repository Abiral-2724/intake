import express from "express";
import { deleteUserAccount, editUserProfile, getUserProfileById} from "../controllers/user.controllers.js";
import upload from "../middleware/multer.js";

const router = express.Router() ; 


router.patch('/profile/update' ,upload.single('image') ,editUserProfile)
router.get('/get/profile/:userId' ,getUserProfileById)

router.delete('/profile/delete' ,deleteUserAccount) ; 

export default router ; 