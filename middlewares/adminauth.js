const is_LoggedIn=(req,res,next)=>{
    try{
         if(req.session.admin_id){
            next()
         }else{
            res.redirect('/admin')
         }
        
    }catch(error){
        console.log(error.message)
    }
   
}

const is_LoggedOut=(req,res,next)=>{
    try{
         if(req.session.admin_id){
           res.redirect('/admin/home')
         }
         next()
    }catch(error){
        console.log(error.message)
    }
    
}

module.exports={
    is_LoggedIn,
    is_LoggedOut
 }