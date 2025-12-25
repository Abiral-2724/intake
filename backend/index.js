import express from 'express' 
import cors from 'cors' ; 
import dotenv from 'dotenv' ; 


const app = express() ; 

dotenv.config({}) ; 

const PORT = process.env.PORT || 8000 ; 

app.use(express.json()) ;
app.use(express.urlencoded({extended : true})) ; 

const corsOptions = {
    origin: 'http://localhost:3002',
    credentials: true, // Enable credentials (cookies)
};

app.use(cors(corsOptions)) ; 

app.listen(PORT ,() => {
    console.log(`server running at port ${PORT}`) ; 
})