//asyncHandler start

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    };
};

export { asyncHandler };




// const asyncHandler = (requestHandler)=>{
    
//     return (req, res, next)=>{
//     Promise.resolve(requestHandler(req, res, next))
//     .catch((err)=>next(err))
//     }
// }

// export { asyncHandler }

// asyncHandler end







// const asyncHandler = (requestHandler)=> async (req,res,next)=>{
//     try {
//         await requestHandler(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

// export {asyncHandler}

