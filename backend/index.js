import express from 'express' 
import cors from 'cors' ; 
import dotenv from 'dotenv' ; 
import userRouter from './routes/user.routes.js'
import featureRouter from './routes/featurerequest.routes.js' ; 
import turnstileRouter from './routes/turnstile.routes.js'
const app = express() ; 

dotenv.config({}) ; 

const PORT = process.env.PORT || 8000 ; 

app.use(express.json()) ;
app.use(express.urlencoded({extended : true})) ; 

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true, // Enable credentials (cookies)
};

app.use(cors(corsOptions)) ; 

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// Helper function to get client IP
export const getClientIP = (req) => {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

app.use('/api/v1/auth' ,userRouter) ; 

app.use('/api/v1/feature/request' ,featureRouter);


app.use('/api' ,turnstileRouter)
  // app.post('/api/verify-turnstile', );
  // Enhanced validation endpoint with additional checks
  // app.post('/api/verify-turnstile-enhanced');


app.listen(PORT ,() => {
    console.log(`server running at port ${PORT}`) ; 
})