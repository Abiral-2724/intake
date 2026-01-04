import client from '../prisma.js';
import cloudinary from '../utils/cloudinary.js';
import { errorResponseFunctionForCatchInTryCatch } from '../utils/errorResponse.js';

export const sendFeatureRequest = async (req ,res) => {
    try{
            const {title ,description ,userId} = req.body ; 

            const files = req.files

            if( !title || !description){
                return res.status(400).json({
                    success : false ,
                    message : "Title or description missing"
                })
            }

            if(!userId){
                return res.status(400).json({
                    success : false ,
                    message : "userId missing!"
                })
            }

            const doesUserExits = await client.user.findFirst({
                where : {
                    id : userId
                }
            })

            if(!doesUserExits){
                return res.status(400).json({
                    success : false ,
                    message : "No user exits with this userId"
                })
            }

            const addingFeatureRequest = await client.featureRequest.create({
                data : {
                    title : title , 
                    description : description,
                    ownerId : userId
                }
            }) ; 


            // add all files to the request files table 

            if (files && files.length > 0) {
                const uploadedFiles = await Promise.all(
                  files.map((file) =>
                    cloudinary.uploader.upload(
                      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
                      { folder: "feature_requests" }
                    )
                  )
                );
          
                await Promise.all(
                  uploadedFiles.map((upload) =>
                    client.filesFeatureRequest.create({
                      data: {
                        featureId: addingFeatureRequest.id,
                        imageUrl: upload.secure_url,
                      },
                    })
                  )
                );
              }


            return res.status(200).json({
                success : true ,
                message : "Feature request send successfully !!"
            })

    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while sending feature request . Please try again later ! " ,500 ) ;
    }
}

export const getAllFeatureRequest = async (req ,res) => {
    try{
            const allFeatureRequest = await client.featureRequest.findMany({
                    include : {
                        user : {
                            select : {
                                id : true ,
                                firstName: true , 
                                lastName : true,
                                profile: true ,
                                email : true
                            } ,
                        } , 
                        files : true 
                    } ,
                    orderBy : {
                        createdAt : "desc"
                    }
            })

            return res.status(200).json({
                success : true ,
                message : "All feature got successfully" , 
                feature : allFeatureRequest
            })
    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while getting all feature requests . Please try again later ! " ,500 ) ;
    }
}

export const getAllFeatureRequestedByUser = async (req ,res) => {
    try{
        const userId = req.params.userId; 

        if(!userId){
            return res.status(400).json({
                success : false ,
                message : "Missing user Id ! "
            })
        }

        const doesUserExits = await client.user.findFirst({
            where : {
                id : userId
            }
        })

        if(!doesUserExits){
            return res.status(400).json({
                success : false ,
                message : "No user exits with this userId"
            })
        }

        const featureRequestedByuser = await client.featureRequest.findMany({
            where : {
                ownerId : userId
            } ,
            include : {
                user : {
                    select : {
                        id : true ,
                        firstName: true , 
                        lastName : true,
                        profile: true ,
                        email : true
                    } ,
                } ,
                files : true
            } ,
            orderBy : {
                createdAt : "desc"
            }
        })

        return res.status(200).json({
            success : true ,
            message : "All requested feature of user found successfully" ,
            feature : featureRequestedByuser ,
        })


    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while getting all requested feature of user . Please try again later ! " ,500 ) ;
    }
}

export const upvoteFeatureRequest = async(req ,res) => {
    try{
        const { featureId ,userId } = req.body;
    
    if (!featureId) {
      return res.status(400).json({
        success: false,
        message: "featureId is required",
      });
    }

    await client.$transaction(async (tx) => {
        // 1️⃣ Create upvote record
        await tx.featureUpvote.create({
          data: {
            featureId,
            userId,
          },
        });
  
        // 2️⃣ Increment likes
        await tx.featureRequest.update({
          where: { id: featureId },
          data: {
            likes: { increment: 1 },
          },
        });
      });
  
      return res.status(200).json({
        success: true,
        message: "Feature upvoted successfully",
      });

    }
    catch(e){
        if (e.code === "P2002") {
            return res.status(409).json({
              success: false,
              message: "You have already upvoted this feature",
            });
          }
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while upvoting feature . Please try again later ! " ,500 ) ;
    }
}

export const downvoteFeatureRequest = async(req ,res) => {
    try{
        const { featureId , userId } = req.body;
        
    
        if (!featureId) {
          return res.status(400).json({
            success: false,
            message: "featureId is required",
          });
        }

        const existingUpvote = await client.featureUpvote.findUnique({
            where: {
              featureId_userId: {
                featureId,
                userId,
              },
            },
          });

          if (!existingUpvote) {
            return res.status(400).json({
              success: false,
              message: "You have not upvoted this feature",
            });
          }

          await client.$transaction(async (tx) => {
            // 1️⃣ Remove upvote
            await tx.featureUpvote.delete({
              where: {
                featureId_userId: {
                  featureId,
                  userId,
                },
              },
            });
      
            // 2️⃣ Decrement likes
            await tx.featureRequest.update({
              where: { id: featureId },
              data: {
                likes: { decrement: 1 },
              },
            });
          });
      
          return res.status(200).json({
            success: true,
            message: "Feature downvoted successfully",
          });
      
    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while down voting feature . Please try again later ! " ,500 ) ;
    }
}

export const deleteFeatureRequest = async(req ,res) => {
    try{
            const {featureId ,userId } = req.body ; 

            if (!featureId || !userId) {
                return res.status(400).json({
                  success: false,
                  message: "featureId is required",
                });
              }
              const feature = await client.featureRequest.findFirst({
                where: {
                  id: featureId,
                  ownerId: userId,
                },
              });
          
              if (!feature) {
                return res.status(403).json({
                  success: false,
                  message: "You are not allowed to delete this feature or it does not exist",
                });
              }
            const deletefeature = await client.featureRequest.delete({
                where : {
                    id : featureId 
                }
            })

           

            return res.status(200).json({
                success : true ,
                message : "feature deleted successfully"
            })

    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while deleting feature request . Please try again later ! " ,500 ) ;
    }
}

export const searchFeatureRequestBasedOnName = async(req ,res) => {
    try{
        const { query } = req.query;

        if (!query) {
          return res.status(400).json({
            success: false,
            message: "Search query is required",
          });
        }

        const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [features, total] = await Promise.all([
        client.featureRequest.findMany({
          where: {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: true,
              },
            },
            files: {
              select: {
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        client.featureRequest.count({
          where: {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
        }),
      ]);
  
      return res.status(200).json({
        success: true,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        data: features,
      });
    }
    catch(e){
        errorResponseFunctionForCatchInTryCatch(res ,e ,
            "Error while searching feature request . Please try again later ! " ,500 ) ;
    }
}