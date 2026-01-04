import express from "express";
import { verifyTurnstile, verifyTurnstileEnhanced } from "../controllers/turnstile.controllers.js";

const router = express.Router() ; 

router.post('/verify-turnstile' ,verifyTurnstile) ;

router.post('/verify-turnstile-enhanced' ,verifyTurnstileEnhanced)

export default router ; 