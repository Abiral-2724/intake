import dotenv from 'dotenv' 
dotenv.config({}) ; 
import bcrypt from 'bcrypt'
 import client from '../prisma.js';
import { errorResponseFunctionForCatchInTryCatch } from '../utils/errorResponse.js';
import jwt from 'jsonwebtoken'
import cloudinary from '../utils/cloudinary.js';
// import { PrismaClient } from '@prisma/client';

// const client = new PrismaClient() ; 

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ NEVER expose this
);


export const getUserProfileById = async (req ,res) => {
    try{
            const userId = req.params.userId; 

            if(!userId){
                return res.status(400).json({
                    success : false ,
                    message : "Missing user Id ! "
                })
            }

            const userProfile = await client.user.findFirst({
                where : {
                    id : userId
                }
            })

            return res.status(200).json({
                success : true ,
                message : "User profile found successfully!",
                userProfile : userProfile
            })
            
    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while getting user profile . Please try again later ! " ,500 ) ;
    }
}

export const editUserProfile = async (req ,res) => {
    try{
            const {userId ,firstName ,lastName , gender , role , subscriptionPlan ,typeOfWorkYouDo , yourRole , whereYouDiscoverIntake} = req.body ;
            
            if(!userId){
                return res.status(400).json({
                    success : false ,
                    message : "Missing user Id ! "
                })
            }

            const checkIfUserExits = await client.user.findFirst({
                where : {
                    id : userId
                }
            })

            if(!checkIfUserExits){
                return res.status(400).json({
                    success : false ,
                    message : "Invalid userId , no user exits with this id ! "
                })
            }

           

            let profile = checkIfUserExits.profile;


            if (req.file) {
                const uploadResult = await cloudinary.uploader.upload(
                  `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
                  { folder: "profile_photos" }
                );
          
                profile = uploadResult.secure_url;
              }


            const updatedUser = await client.user.update({
                where : {
                    id : userId
                } ,
                data : {
                    firstName : firstName , 
                    lastName : lastName ,
                    gender : gender ,
                    profile : profile ,
                    role : role ,
                    subscriptionPlan : subscriptionPlan ,
                    typeOfWorkYouDo : typeOfWorkYouDo ,
                    yourRole : yourRole ,
                    whereYouDiscoverIntake : whereYouDiscoverIntake
                }
            })


            return res.status(200).json({
                success : true ,
                message : "Profile updated successfully !",
                updatedUser : updatedUser
            })

    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while editing user profile . Please try again later ! " ,500 ) ; 
    }
}

export const deleteUserAccount = async(req ,res) => {
    try{
            const {userId} = req.body ; 

            if(!userId){
                return res.status(400).json({
                    success : false ,
                    message : "Missing user Id ! "
                })
            }

            const checkIfUserExits = await client.user.findFirst({
                where : {
                    id : userId
                }
            })

            if(!checkIfUserExits){
                return res.status(400).json({
                    success : false ,
                    message : "Invalid userId , no user exits with this id ! "
                })
            }

            const {error} = await supabaseAdmin.auth.admin.deleteUser(userId)

            if (error) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to delete auth user",
                  error: error.message,
                });
              }

            const deleteUseraccount = await client.user.delete({
                where : {
                    id : userId
                }
            })

            return res.status(200).json({
                success : true ,
                message : "Profile deleted successfully !",
            })

    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while deleting user account . Please try again later ! " ,500 ) ; 
    }
}