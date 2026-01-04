

export const errorResponseFunctionForCatchInTryCatch = (res ,apiError ,message,statusCode) => {

    console.log(apiError) ; 

    return res.status(statusCode).json({
        success : false ,
        message : message
    })

}
